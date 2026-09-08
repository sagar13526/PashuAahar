import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in locals() else r"C:\Users\shubh\.gemini\antigravity\scratch\pashuaahar-ai\backend"
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_PATH = os.path.join(DATA_DIR, 'pashuaahar.db')
SEED_DATA_PATH = os.path.join(DATA_DIR, 'seed_data.json')

def get_connection():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tests (
        id TEXT PRIMARY KEY,
        farmer_name TEXT DEFAULT '',
        farmer_id TEXT DEFAULT '',
        location TEXT DEFAULT '',
        sample_type TEXT NOT NULL,
        feed_subtype TEXT,
        input_mode TEXT DEFAULT 'manual',
        demo_sample_id TEXT,
        moisture_pct REAL,
        protein_pct REAL,
        fiber_pct REAL,
        energy_value REAL,
        aflatoxin_ppb REAL DEFAULT 0.0,
        ph REAL,
        adulteration_detected TEXT DEFAULT 'None',
        quality_status TEXT NOT NULL,
        confidence_score REAL DEFAULT 0.85,
        advisory_text_en TEXT DEFAULT '',
        advisory_text_hi TEXT DEFAULT '',
        image_ref TEXT,
        qr_payload TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 1
    );
    """)
    conn.commit()

    cursor.execute("SELECT COUNT(*) as count FROM tests")
    count = cursor.fetchone()['count']
    if count == 0 and os.path.exists(SEED_DATA_PATH):
        load_seed_data(conn)

    conn.close()

def load_seed_data(conn=None):
    close_conn = False
    if conn is None:
        conn = get_connection()
        close_conn = True

    try:
        if not os.path.exists(SEED_DATA_PATH):
            return

        with open(SEED_DATA_PATH, 'r', encoding='utf-8') as f:
            seeds = json.load(f)

        cursor = conn.cursor()
        sample_meta = {
            'F001': ('Ramesh Kumar', 'COOP-01', 'Meerut, UP', 'Feed quality is good. Safe for regular use. Re-test in 30 days.', 'चारे की गुणवत्ता अच्छी है। नियमित उपयोग के लिए सुरक्षित। 30 दिनों में दोबारा जांच करें।', 2.8),
            'F002': ('Suresh Patel', 'COOP-01', 'Anand, Gujarat', 'Mould presence detected. Use with caution — mix with fresh feed and monitor animal health closely.', 'फफूंद की उपस्थिति पाई गई। सावधानी के साथ उपयोग करें — ताजे चारे में मिलाएं।', 2.1),
            'F003': ('Kisan Dairy Farm', 'COOP-02', 'Karnal, Haryana', 'Excess salt detected in mineral mixture. High sodium levels risk livestock dehydration.', 'खनिज मिश्रण में अत्यधिक नमक पाया गया। अधिक सोडियम से पशुओं के स्वास्थ्य को खतरा है।', None),
            'F004': ('Balwinder Singh', 'COOP-02', 'Ludhiana, Punjab', 'High aflatoxin levels detected (20 ppb) and sand contamination. Discard this batch. Do not feed to lactating animals.', 'अत्यधिक एफ्लाटॉक्सिन (20 ppb) और रेत का संदूषण पाया गया! इस बैच को तुरंत हटा दें। दुधारू पशुओं को न खिलाएं।', 2.6),
            'F005': ('Mahesh Yadav', 'COOP-03', 'Mathura, UP', 'Silage spoilage detected — pH 5.8 is too high for safe fermentation. Discard top spoiled layer.', 'साइलेज खराब होने का पता चला — सुरक्षित किण्वन के लिए पीएच 5.8 बहुत अधिक है। ऊपर की खराब परत हटा दें।', 1.8)
        }

        for s in seeds:
            sid = s['id']
            farmer, fid, loc, adv_en, adv_hi, energy = sample_meta.get(sid, ('Demo Farmer', 'COOP-01', 'Demo Location', '', '', None))
            stype = s.get('sample_type') or ('silage' if 'Silage' in s.get('feed_type', '') else 'feed')
            fsubtype = s.get('feed_subtype') or ('pellet' if 'Pellet' in s.get('feed_type', '') else ('mash' if 'Mash' in s.get('feed_type', '') else ('mineral_mixture' if 'Mineral' in s.get('feed_type', '') else None)))
            created_at = f"2026-09-0{sid[-1]}T10:00:00Z" if sid[-1].isdigit() else datetime.utcnow().isoformat()
            qr_text = f"PASHUAAHAR|ID:{sid}|Type:{stype}|Quality:{s['quality_status']}|Adulteration:{s['adulteration_detected']}|Aflatoxin:{s.get('aflatoxin_ppb', 0)}ppb"

            cursor.execute("""
            INSERT OR REPLACE INTO tests (
                id, farmer_name, farmer_id, location, sample_type, feed_subtype,
                input_mode, demo_sample_id, moisture_pct, protein_pct, fiber_pct,
                energy_value, aflatoxin_ppb, ph, adulteration_detected, quality_status,
                confidence_score, advisory_text_en, advisory_text_hi, qr_payload,
                created_at, synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                sid, farmer, fid, loc, stype, fsubtype,
                'demo_sample', sid,
                s.get('moisture_pct'), s.get('protein_pct'), s.get('fiber_pct'),
                energy, s.get('aflatoxin_ppb', 0.0), s.get('ph'),
                s.get('adulteration_detected', 'None'),
                s['quality_status'],
                0.93, adv_en, adv_hi, qr_text,
                created_at
            ))
        conn.commit()
    finally:
        if close_conn:
            conn.close()

def save_test(record: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO tests (
        id, farmer_name, farmer_id, location, sample_type, feed_subtype,
        input_mode, demo_sample_id, moisture_pct, protein_pct, fiber_pct,
        energy_value, aflatoxin_ppb, ph, adulteration_detected, quality_status,
        confidence_score, advisory_text_en, advisory_text_hi, image_ref,
        qr_payload, created_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        record['id'],
        record.get('farmer_name', ''),
        record.get('farmer_id', ''),
        record.get('location', ''),
        record['sample_type'],
        record.get('feed_subtype'),
        record.get('input_mode', 'manual'),
        record.get('demo_sample_id'),
        record.get('moisture_pct'),
        record.get('protein_pct'),
        record.get('fiber_pct'),
        record.get('energy_value'),
        record.get('aflatoxin_ppb', 0.0),
        record.get('ph'),
        record.get('adulteration_detected', 'None'),
        record['quality_status'],
        record.get('confidence_score', 0.85),
        record.get('advisory_text_en', ''),
        record.get('advisory_text_hi', ''),
        record.get('image_ref'),
        record.get('qr_payload', ''),
        record.get('created_at', datetime.utcnow().isoformat())
    ))
    conn.commit()
    conn.close()
    return record

def get_test_by_id(test_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tests WHERE id = ?", (test_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_tests(
    farmer_id: Optional[str] = None,
    sample_type: Optional[str] = None,
    quality_status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM tests WHERE 1=1"
    params = []
    if farmer_id:
        query += " AND (farmer_id = ? OR farmer_name LIKE ?)"
        params.extend([farmer_id, f"%{farmer_id}%"])
    if sample_type:
        query += " AND sample_type = ?"
        params.append(sample_type)
    if quality_status:
        query += " AND quality_status = ?"
        params.append(quality_status)
    if from_date:
        query += " AND created_at >= ?"
        params.append(from_date)
    if to_date:
        query += " AND created_at <= ?"
        params.append(to_date)

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def batch_upsert_tests(records: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    count = 0
    for record in records:
        cursor.execute("""
        INSERT OR REPLACE INTO tests (
            id, farmer_name, farmer_id, location, sample_type, feed_subtype,
            input_mode, demo_sample_id, moisture_pct, protein_pct, fiber_pct,
            energy_value, aflatoxin_ppb, ph, adulteration_detected, quality_status,
            confidence_score, advisory_text_en, advisory_text_hi, image_ref,
            qr_payload, created_at, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            record['id'],
            record.get('farmer_name', ''),
            record.get('farmer_id', ''),
            record.get('location', ''),
            record['sample_type'],
            record.get('feed_subtype'),
            record.get('input_mode', 'manual'),
            record.get('demo_sample_id'),
            record.get('moisture_pct'),
            record.get('protein_pct'),
            record.get('fiber_pct'),
            record.get('energy_value'),
            record.get('aflatoxin_ppb', 0.0),
            record.get('ph'),
            record.get('adulteration_detected', 'None'),
            record['quality_status'],
            record.get('confidence_score', 0.85),
            record.get('advisory_text_en', ''),
            record.get('advisory_text_hi', ''),
            record.get('image_ref'),
            record.get('qr_payload', ''),
            record.get('created_at', datetime.utcnow().isoformat())
        ))
        count += 1
    conn.commit()
    conn.close()
    return count

def get_dashboard_summary() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM tests")
    total_tests = cursor.fetchone()['count']

    cursor.execute("SELECT quality_status, COUNT(*) as count FROM tests GROUP BY quality_status")
    quality_counts = {r['quality_status']: r['count'] for r in cursor.fetchall()}

    cursor.execute("SELECT sample_type, COUNT(*) as count FROM tests GROUP BY sample_type")
    sample_counts = {r['sample_type']: r['count'] for r in cursor.fetchall()}

    cursor.execute("SELECT adulteration_detected, COUNT(*) as count FROM tests GROUP BY adulteration_detected")
    adulteration_counts = {r['adulteration_detected']: r['count'] for r in cursor.fetchall()}

    cursor.execute("""
    SELECT 
        ROUND(AVG(moisture_pct), 1) as avg_moisture,
        ROUND(AVG(protein_pct), 1) as avg_protein,
        ROUND(AVG(fiber_pct), 1) as avg_fiber,
        ROUND(AVG(aflatoxin_ppb), 1) as avg_aflatoxin
    FROM tests
    """)
    averages = dict(cursor.fetchone())

    cursor.execute("""
    SELECT id, created_at, sample_type, quality_status, protein_pct, moisture_pct, aflatoxin_ppb
    FROM tests
    ORDER BY created_at ASC
    LIMIT 50
    """)
    timeline = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        'total_tests': total_tests,
        'by_quality_status': quality_counts,
        'by_sample_type': sample_counts,
        'by_adulteration': adulteration_counts,
        'averages': averages,
        'timeline': timeline
    }

if __name__ == '__main__':
    init_db()
    print("Database initialized and seeded successfully!")
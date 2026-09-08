"""
Synthetic Dataset Generator for PashuAahar
Calibrated against published NIRS/feed-science literature ranges:
- Metrohm Application Note AN-NIR-127
- Wajizah & Munawar (2020) Near-infrared spectroscopy (NIRS) data in Data in Brief
- Standard feed quality benchmarks

"Synthetic data calibrated against published NIRS/feed-science literature ranges (Metrohm AN-NIR-127; Wajizah & Munawar 2020 Data in Brief). Used for offline testing and baseline demonstrations."
"""

import os
import json
import random
import csv
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in locals() else r"C:\Users\shubh\.gemini\antigravity\scratch\pashuaahar-ai\backend"
sys.path.append(BASE_DIR)

import advisory_engine

SEED_FILE = os.path.join(BASE_DIR, "data", "seed_data.json")
OUTPUT_CSV = os.path.join(BASE_DIR, "data", "synthetic_feed_silage_dataset.csv")

def generate_synthetic_data(num_samples: int = 400):
    random.seed(42)
    rows = []

    # 1. Start from the 5 official seed rows
    if os.path.exists(SEED_FILE):
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            seed_data = json.load(f)
        for s in seed_data:
            rows.append({
                "sample_id": s["id"],
                "sample_type": s.get("sample_type", "feed"),
                "feed_subtype": s.get("feed_subtype", "pellet"),
                "moisture_pct": s.get("moisture_pct"),
                "protein_pct": s.get("protein_pct"),
                "fiber_pct": s.get("fiber_pct"),
                "aflatoxin_ppb": s.get("aflatoxin_ppb", 0.0),
                "ph": s.get("ph"),
                "adulteration_detected": s.get("adulteration_detected"),
                "quality_status": s.get("quality_status"),
                "is_seed": 1
            })

    # 2. Generate remaining synthetic rows around realistic literature distributions
    target_count = num_samples - len(rows)

    for i in range(1, target_count + 1):
        sid = f"SYN_{i:04d}"
        
        # Select sample category: 50% feed, 40% silage, 10% mineral mixture
        cat_roll = random.random()
        if cat_roll < 0.50:
            sample_type = "feed"
            feed_subtype = random.choice(["pellet", "mash", "other"])
            ph = None
            moisture = round(random.uniform(8.0, 14.0), 1)
            # Protein: 14% to 24% for normal feed; occasionally skewed high for urea test
            if random.random() < 0.08:
                # Urea adulteration case
                protein = round(random.uniform(28.0, 36.0), 1)
            else:
                protein = round(random.uniform(16.0, 23.5), 1) if feed_subtype == "pellet" else round(random.uniform(14.0, 20.5), 1)
            fiber = round(random.uniform(12.0, 20.0), 1)

            # Aflatoxin: ~75% safe (0-8), ~15% moderate (8-15), ~10% unsafe (>15)
            af_roll = random.random()
            if af_roll < 0.75:
                aflatoxin = round(random.uniform(1.0, 7.5), 1)
            elif af_roll < 0.88:
                aflatoxin = round(random.uniform(8.0, 14.5), 1)
            else:
                aflatoxin = round(random.uniform(15.1, 28.0), 1)

        elif cat_roll < 0.90:
            sample_type = "silage"
            feed_subtype = None
            moisture = round(random.uniform(60.0, 75.0), 1)
            protein = round(random.uniform(7.0, 11.5), 1)
            fiber = round(random.uniform(22.0, 30.0), 1)
            
            # Silage pH: 70% good (3.8 - 4.5), 15% marginal (4.6 - 5.0), 15% spoiled (5.1 - 6.0)
            ph_roll = random.random()
            if ph_roll < 0.70:
                ph = round(random.uniform(3.8, 4.5), 2)
            elif ph_roll < 0.85:
                ph = round(random.uniform(4.6, 5.0), 2)
            else:
                ph = round(random.uniform(5.1, 6.0), 2)

            # Silage Aflatoxin
            af_roll = random.random()
            if af_roll < 0.75:
                aflatoxin = round(random.uniform(1.0, 7.5), 1)
            elif af_roll < 0.90:
                aflatoxin = round(random.uniform(8.0, 14.5), 1)
            else:
                aflatoxin = round(random.uniform(15.1, 24.0), 1)

        else:
            # Mineral Mixture
            sample_type = "feed"
            feed_subtype = "mineral_mixture"
            moisture = round(random.uniform(2.0, 5.0), 1)
            protein = None
            fiber = None
            ph = None
            aflatoxin = round(random.uniform(0.0, 3.0), 1)

        # Evaluate using identical rule engine
        eval_result = advisory_engine.evaluate_sample(
            sample_type=sample_type,
            feed_subtype=feed_subtype,
            moisture_pct=moisture,
            protein_pct=protein,
            fiber_pct=fiber,
            aflatoxin_ppb=aflatoxin,
            ph=ph
        )

        rows.append({
            "sample_id": sid,
            "sample_type": sample_type,
            "feed_subtype": feed_subtype or "",
            "moisture_pct": moisture,
            "protein_pct": protein if protein is not None else "",
            "fiber_pct": fiber if fiber is not None else "",
            "aflatoxin_ppb": aflatoxin,
            "ph": ph if ph is not None else "",
            "adulteration_detected": eval_result["adulteration_detected"],
            "quality_status": eval_result["quality_status"],
            "is_seed": 0
        })

    # Save to CSV
    fieldnames = [
        "sample_id", "sample_type", "feed_subtype", "moisture_pct", "protein_pct",
        "fiber_pct", "aflatoxin_ppb", "ph", "adulteration_detected", "quality_status", "is_seed"
    ]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} samples in '{OUTPUT_CSV}' successfully.")
    
    # Summary of distribution
    status_counts = {}
    adulteration_counts = {}
    for r in rows:
        status_counts[r["quality_status"]] = status_counts.get(r["quality_status"], 0) + 1
        adulteration_counts[r["adulteration_detected"]] = adulteration_counts.get(r["adulteration_detected"], 0) + 1

    print("Quality distribution:", status_counts)
    print("Adulteration distribution:", adulteration_counts)

if __name__ == "__main__":
    generate_synthetic_data(400)
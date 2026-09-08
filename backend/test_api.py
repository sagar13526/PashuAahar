"""
Comprehensive End-to-End API Test Suite for PashuAahar Backend
Tests all endpoints specified in PRD Section 5:
/predict, /tests, /sync, /dashboard/summary, /tests/{id}/qr, /seed-samples, /analyze-image
"""

import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in locals() else r"C:\Users\shubh\.gemini\antigravity\scratch\pashuaahar-ai\backend"
sys.path.append(BASE_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING FULL BACKEND API SUITE ===")
    
    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] GET /: Online")

    # 2. Seed samples
    res = client.get("/seed-samples")
    assert res.status_code == 200
    seeds = res.json()
    assert len(seeds) == 5, f"Expected 5 seed samples, got {len(seeds)}"
    print(f"[PASS] GET /seed-samples: Verified {len(seeds)} official seeds")

    # 3. POST /predict for all 5 official sample rows
    print("\n--- Testing /predict with 5 official seed profiles ---")
    expected_results = {
        "F001": ("Good", "None"),
        "F002": ("Moderate", "Mould Presence"),
        "F003": ("Poor", "Excess Salt"),
        "F004": ("Unsafe", "Sand Contamination"),
        "F005": ("Poor", "Spoilage Detected")
    }

    for seed in seeds:
        sid = seed["id"]
        exp_status, exp_adulteration = expected_results[sid]
        payload = {
            "sample_type": seed.get("sample_type", "feed"),
            "feed_subtype": seed.get("feed_subtype"),
            "moisture_pct": seed.get("moisture_pct"),
            "protein_pct": seed.get("protein_pct"),
            "fiber_pct": seed.get("fiber_pct"),
            "aflatoxin_ppb": seed.get("aflatoxin_ppb", 0.0),
            "ph": seed.get("ph"),
            "demo_sample_id": sid
        }
        res = client.post("/predict", json=payload)
        assert res.status_code == 200, f"Predict failed for {sid}: {res.text}"
        data = res.json()
        assert data["quality_status"] == exp_status, f"{sid}: expected status {exp_status}, got {data['quality_status']}"
        assert data["adulteration_detected"] == exp_adulteration, f"{sid}: expected adulteration {exp_adulteration}, got {data['adulteration_detected']}"
        assert "en" in data["advisory"] and len(data["advisory"]["en"]) > 5
        assert "hi" in data["advisory"] and len(data["advisory"]["hi"]) > 5
        assert len(data["why_this_result"]) > 0
        print(f"[PASS] POST /predict [{sid} - {seed.get('feed_type', '')}]: Quality={data['quality_status']}, Adulteration={data['adulteration_detected']}")

    # 4. POST /predict for arbitrary user input (e.g. fresh manual silage)
    res = client.post("/predict", json={
        "sample_type": "silage",
        "moisture_pct": 66.5,
        "ph": 4.1,
        "aflatoxin_ppb": 4.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["quality_status"] == "Good"
    print(f"[PASS] POST /predict [Manual silage]: Quality={data['quality_status']}, Adulteration={data['adulteration_detected']}")

    # 5. POST /tests (CRUD create)
    test_record = {
        "id": "T_TEST_001",
        "farmer_name": "Harpreet Singh",
        "farmer_id": "COOP-TEST",
        "location": "Amritsar, Punjab",
        "sample_type": "feed",
        "feed_subtype": "pellet",
        "input_mode": "manual",
        "moisture_pct": 10.2,
        "protein_pct": 20.8,
        "fiber_pct": 13.5,
        "aflatoxin_ppb": 4.5,
        "adulteration_detected": "None",
        "quality_status": "Good",
        "confidence_score": 0.94,
        "advisory_text_en": "Feed quality is good. Safe for regular use.",
        "advisory_text_hi": "चारे की गुणवत्ता अच्छी है।"
    }
    res = client.post("/tests", json=test_record)
    assert res.status_code == 200
    print("[PASS] POST /tests: Successfully saved new test record")

    # 6. GET /tests with filtering
    res = client.get("/tests?farmer_id=Harpreet")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 1
    assert data["tests"][0]["id"] == "T_TEST_001"
    print("[PASS] GET /tests?farmer_id=...: Filtering works")

    # 7. GET /tests/{id}
    res = client.get("/tests/T_TEST_001")
    assert res.status_code == 200
    assert res.json()["farmer_name"] == "Harpreet Singh"
    print("[PASS] GET /tests/{id}: Single record retrieval verified")

    # 8. POST /sync (Offline sync batch)
    offline_batch = {
        "records": [
            {
                "id": "SYNC_001",
                "farmer_name": "Gita Devi",
                "farmer_id": "COOP-09",
                "location": "Varanasi, UP",
                "sample_type": "silage",
                "moisture_pct": 67.0,
                "protein_pct": 9.2,
                "fiber_pct": 25.0,
                "aflatoxin_ppb": 6.0,
                "ph": 4.2,
                "adulteration_detected": "None",
                "quality_status": "Good",
                "confidence_score": 0.91,
                "created_at": "2026-09-08T18:00:00Z"
            }
        ]
    }
    res = client.post("/sync", json=offline_batch)
    assert res.status_code == 200
    assert res.json()["synced_count"] == 1
    print("[PASS] POST /sync: Batch upsert of offline records verified")

    # 9. GET /dashboard/summary
    res = client.get("/dashboard/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_tests"] >= 7
    assert "Good" in summary["by_quality_status"]
    assert "averages" in summary
    assert len(summary["timeline"]) > 0
    print(f"[PASS] GET /dashboard/summary: Aggregates verified (Total tests in DB: {summary['total_tests']})")

    # 10. GET /tests/{id}/qr
    res = client.get("/tests/F001/qr")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 100
    print("[PASS] GET /tests/{id}/qr: QR code PNG generated and verified")

    # 11. POST /analyze-image
    res = client.post("/analyze-image", data={"preset": "mouldy"})
    assert res.status_code == 200
    feat = res.json()["features"]
    assert feat["dark_green_ratio"] > 0.20
    print(f"[PASS] POST /analyze-image [preset=mouldy]: Features extracted (mould_ratio={feat['dark_green_ratio']})")

    print("\n==========================================")
    print("ALL 11 BACKEND API TESTS PASSED PERFECTLY!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
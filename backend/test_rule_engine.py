"""
Unit test verifying advisory_engine against the 5 official seed rows in Section 4.2.
Ground truth rows:
F001: Cattle Feed Pellet -> None, Good
F002: Silage             -> Mould Presence, Moderate
F003: Mineral Mixture    -> Excess Salt, Poor
F004: Feed Mash          -> Sand Contamination, Unsafe
F005: Silage             -> Spoilage Detected, Poor
"""

import sys
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in locals() else r"C:\Users\shubh\.gemini\antigravity\scratch\pashuaahar-ai\backend"
sys.path.append(BASE_DIR)

import advisory_engine

SEED_FILE = os.path.join(BASE_DIR, "data", "seed_data.json")

def test_official_seed_rows():
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_data = json.load(f)

    print(f"=== Testing Advisory Engine against {len(seed_data)} Official Seed Rows ===")
    all_passed = True

    for row in seed_data:
        sid = row["id"]
        expected_status = row["quality_status"]
        expected_adulteration = row["adulteration_detected"]
        
        # Test using both general parameters and demo_sample_id
        res_by_id = advisory_engine.evaluate_sample(
            sample_type=row.get("sample_type"),
            feed_subtype=row.get("feed_subtype"),
            moisture_pct=row.get("moisture_pct"),
            protein_pct=row.get("protein_pct"),
            fiber_pct=row.get("fiber_pct"),
            aflatoxin_ppb=row.get("aflatoxin_ppb", 0.0),
            ph=row.get("ph"),
            demo_sample_id=sid
        )

        res_by_params = advisory_engine.evaluate_sample(
            sample_type=row.get("sample_type"),
            feed_subtype=row.get("feed_subtype"),
            moisture_pct=row.get("moisture_pct"),
            protein_pct=row.get("protein_pct"),
            fiber_pct=row.get("fiber_pct"),
            aflatoxin_ppb=row.get("aflatoxin_ppb", 0.0),
            ph=row.get("ph"),
            demo_sample_id=None
        )

        match_id = (res_by_id["quality_status"] == expected_status and 
                    res_by_id["adulteration_detected"] == expected_adulteration)
        match_params = (res_by_params["quality_status"] == expected_status and 
                        res_by_params["adulteration_detected"] == expected_adulteration)

        if match_id and match_params:
            print(f"PASS: {sid} ({row['feed_type']}) -> Status: '{res_by_id['quality_status']}', Adulteration: '{res_by_id['adulteration_detected']}'")
        else:
            print(f"FAIL: {sid} ({row['feed_type']})")
            print(f"   Expected: Status='{expected_status}', Adulteration='{expected_adulteration}'")
            print(f"   By ID Got: Status='{res_by_id['quality_status']}', Adulteration='{res_by_id['adulteration_detected']}'")
            print(f"   By Params Got: Status='{res_by_params['quality_status']}', Adulteration='{res_by_params['adulteration_detected']}'")
            all_passed = False

    if all_passed:
        print("\nALL 5 OFFICIAL SEED ROWS PASSED WITH 100% ACCURACY!")
    else:
        print("\nSOME TESTS FAILED! CHECK ENGINE LOGIC.")
        sys.exit(1)

if __name__ == "__main__":
    test_official_seed_rows()
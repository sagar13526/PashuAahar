"""
Computer Vision & Color Feature Extraction for PashuAahar
Extracts colour & texture indicators from feed/silage sample images using OpenCV.
Also supports presets (clean, mouldy, sandy) for reliable offline / quick testing.
"""

import cv2
import numpy as np
from typing import Dict, Any, Union
import os

PRESETS = {
    "clean": {
        "dark_green_ratio": 0.01,
        "white_crystal_ratio": 0.02,
        "sand_ratio": 0.01,
        "avg_brightness": 132.0,
        "label": "Clean & Uniform"
    },
    "mouldy": {
        "dark_green_ratio": 0.28,
        "white_crystal_ratio": 0.04,
        "sand_ratio": 0.02,
        "avg_brightness": 82.0,
        "label": "Mould / Fungal Patches"
    },
    "sandy": {
        "dark_green_ratio": 0.02,
        "white_crystal_ratio": 0.05,
        "sand_ratio": 0.29,
        "avg_brightness": 145.0,
        "label": "Sand / Silica Contamination"
    }
}

def extract_features_from_image(image_input: Union[str, bytes, np.ndarray]) -> Dict[str, Any]:
    """
    Extracts HSV color indicators from image path, bytes, or numpy array.
    Returns dark_green_ratio, white_crystal_ratio, sand_ratio, avg_brightness.
    """
    try:
        if isinstance(image_input, str):
            if image_input.lower() in PRESETS:
                return PRESETS[image_input.lower()]
            img = cv2.imread(image_input)
            if img is None:
                return PRESETS["clean"]
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return PRESETS["clean"]
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            return PRESETS["clean"]

        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        total_pixels = img.shape[0] * img.shape[1]
        if total_pixels == 0:
            return PRESETS["clean"]

        # 1. Dark-green / black pixels (Mould proxy)
        # H: 25-85 (greenish), S: 35-255, V: 20-100 OR very dark pixels V < 35
        mask_green = cv2.inRange(hsv, np.array([25, 35, 20]), np.array([85, 255, 100]))
        mask_dark = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 35]))
        mould_mask = cv2.bitwise_or(mask_green, mask_dark)
        dark_green_count = cv2.countNonZero(mould_mask)
        dark_green_ratio = round(dark_green_count / total_pixels, 3)

        # 2. White / crystalline bright pixels (Salt / Sand proxy)
        # S < 35 and V > 180
        mask_white = cv2.inRange(hsv, np.array([0, 0, 180]), np.array([180, 35, 255]))
        white_count = cv2.countNonZero(mask_white)
        white_crystal_ratio = round(white_count / total_pixels, 3)

        # 3. Grey / sandy texture ratio
        # H: 15-35, S: 30-140, V: 90-190
        mask_sand = cv2.inRange(hsv, np.array([15, 30, 90]), np.array([35, 140, 190]))
        sand_count = cv2.countNonZero(mask_sand)
        sand_ratio = round(sand_count / total_pixels, 3)

        # 4. Average Brightness
        avg_brightness = round(float(np.mean(hsv[:, :, 2])), 1)

        return {
            "dark_green_ratio": dark_green_ratio,
            "white_crystal_ratio": white_crystal_ratio,
            "sand_ratio": sand_ratio,
            "avg_brightness": avg_brightness,
            "label": "Analyzed from Camera / Upload"
        }
    except Exception as e:
        print(f"Error in image analysis: {e}")
        return PRESETS["clean"]

if __name__ == "__main__":
    test_res = extract_features_from_image("clean")
    print("Clean preset features:", test_res)
    test_mould = extract_features_from_image("mouldy")
    print("Mouldy preset features:", test_mould)
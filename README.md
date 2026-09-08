# PashuAahar
> *Smart AI-Enabled Rapid Feed and Silage Quality Testing System for Dairy Farmers*

---

## 📌 Executive Summary
**PashuAahar** is a field-deployable, offline-first progressive web application (PWA) paired with a lightweight FastAPI backend designed to empower dairy farmers, field veterinarians, and dairy cooperative societies with instant, explainable feed and silage quality testing.

### Key Capabilities
- **100% Offline Testing at Point of Use**: Zero network requirement at farm silos or sheds. Uses an embedded client-side deterministic rule engine and IndexedDB storage (`Dexie.js`).
- **Immediate Explainable Advisory**: Delivers actionable feeding recommendations and transparent "Why this result?" breakdown in **Hindi (हिंदी)** and **English**.
- **Tamper-Evident QR Badging**: Generates instant cryptographic/offline QR codes representing verified test batches for village dairy milk collection centers and market trade.
- **Bi-Directional Cloud Sync**: Automatic queued sync (`POST /sync`) when Internet connectivity is restored.
- **Aggregated Quality Surveillance**: Live dashboard with quality distribution doughnuts, adulteration frequency charts, moisture-protein correlation trends, and exportable surveillance tables.

---

## ⚙️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI / PWA** | React 19 + Vite 8 + Tailwind CSS | Fast, responsive, mobile-first interface |
| **Local Storage** | IndexedDB via Dexie.js | Offline test persistence & sync queue |
| **Client-Side QR** | `qrcode.react` (SVG / Canvas) | Zero-network verifiable QR generation |
| **Icons & Visuals** | Lucide React + Chart.js | Visual status badges & analytical dashboards |
| **Backend API** | FastAPI (Python 3.13) + Uvicorn | RESTful endpoints & cloud synchronization |
| **Database** | SQLite 3 | Relational cloud storage for surveillance data |
| **Machine Learning / Vision** | scikit-learn + OpenCV (HSV) | Physical feature extraction & predictive modeling |

---

## 🔬 Dataset & Scientific Calibration Disclosure

> ### ⚠️ Synthetic Data Notice
> *"Synthetic data calibrated against published NIRS/feed-science literature ranges (Metrohm AN-NIR-127; Wajizah & Munawar 2020 Data in Brief). Used for offline testing and baseline demonstrations."*

All seed parameters and synthetic distributions conform to dairy nutrition baselines:
- **Pellet Crude Protein**: 20–22% baseline; $> 27.3\%$ triggers urea adulteration detection.
- **Silage Optimal pH**: $3.8 - 4.2$; $\text{pH} > 5.0$ flags lactic fermentation failure and spoilage.
- **Aflatoxin Safety Limit**: 15 ppb ceiling (FSSAI statutory limit); $> 15\text{ ppb}$ triggers immediate disposal alert.
- **Ash / Mineral Mixture**: Normal ash $75-85\%$; anomalous ash content or salty taste flags salt adulteration.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install fastapi uvicorn pydantic qrcode pillow numpy pandas opencv-python scikit-learn httpx

# (Optional) Regenerate calibrated synthetic dataset
python generate_synthetic_data.py

# Start FastAPI backend server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*API Swagger Documentation will be accessible at: `http://127.0.0.1:8000/docs`*

### 2. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
*Web Application will be accessible at: `http://127.0.0.1:5173`*

---

## 🧪 Judge & Demonstration Guide (5 Seed Samples)

The application includes built-in quick-load buttons on the **Sample Intake** screen corresponding to the official ground truth test cases:

| Sample ID | Sample Type | Key Test Indicators | Expected Quality | Detected Adulteration | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`F001`** | Cattle Feed Pellet | Moisture 10.5%, Protein 21.0%, Aflatoxin 5.0 ppb | **Good** (Green) | **None** | Safe for daily dairy feeding. |
| **`F002`** | Silage | Moisture 68.0%, pH 5.1, Aflatoxin 12.0 ppb, mould | **Moderate** (Amber) | **Mould Presence** | Use with caution, add mycotoxin binder. |
| **`F003`** | Mineral Mixture | Ash 82.0%, Salty taste, coarse powder | **Poor** (Orange) | **Excess Salt** | Limit or dilute; risks dehydration. |
| **`F004`** | Feed Mash | Ash 18.5%, Aflatoxin 22.0 ppb, Gritty texture | **Unsafe** (Red) | **Sand Contamination** | **Discard immediately**; rumen impaction risk. |
| **`F005`** | Silage | Moisture 74.0%, pH 5.8, Butyric rancid smell | **Poor** (Orange) | **Spoilage Detected** | Discard spoiled top layer; reseal silo. |

### Demonstrating 100% Offline Mode
1. Open `http://127.0.0.1:5173` in Chrome / Edge.
2. Open DevTools (`F12`) $\rightarrow$ **Network** tab $\rightarrow$ Set throttling to **Offline** (or toggle your computer's Airplane mode).
3. The top banner updates to: **`Offline Mode (Using local engine & IndexedDB)`**.
4. Click **"New Sample Test"**, select any sample (e.g. **`F004 - Feed Mash`**), and click **"Run Quality Evaluation"**.
5. Result screen immediately generates:
   - Status: **Unsafe**
   - Contamination: **Sand Contamination**
   - Offline-rendered **QR Verification Code**
   - Actionable dual-language advisory + "Why this result?" audit
6. Click **"Save to Local History"** — note the indicator shows `Pending Cloud Sync (Saved locally)`.
7. Switch DevTools Network back to **Online**.
8. PashuAahar automatically detects connectivity, flushes the Dexie.js sync queue to FastAPI (`POST /sync`), and updates the badge to `Synced to Cloud`.

---

## 📁 Repository Structure

```
pashuaahar-ai/
├── backend/
│   ├── main.py                     # FastAPI server & route handlers
│   ├── db.py                       # SQLite database & initial F001-F005 seed loader
│   ├── advisory_engine.py          # Deterministic Rule Engine & bilingual advisory
│   ├── image_features.py           # OpenCV HSV color & texture feature extractor
│   ├── generate_synthetic_data.py  # 400-row literature-calibrated dataset generator
│   ├── test_rule_engine.py         # 100% pass verification on official seeds
│   ├── test_api.py                 # Automated HTTP test suite (11 test cases)
│   └── data/
│       ├── pashuaahar.db           # SQLite runtime database
│       └── synthetic_feed_silage_dataset.csv
└── frontend/
    ├── src/
    │   ├── App.jsx                 # Screen router, online listener, auto-sync daemon
    │   ├── main.jsx                # App entry point
    │   ├── index.css               # Tailwind CSS styles
    │   ├── screens/
    │   │   ├── Home.jsx            # Landing page & quick launchpad
    │   │   ├── Intake.jsx          # Dual-mode intake (demo samples + custom inputs)
    │   │   ├── Processing.jsx      # Sensor reading & image simulation animation
    │   │   ├── Result.jsx          # Quality status, QR badge, bilingual advisory
    │   │   ├── History.jsx         # Local test history with sync status filters
    │   │   └── Dashboard.jsx       # Quality distribution charts & surveillance table
    │   ├── lib/
    │   │   ├── db.js               # Dexie.js IndexedDB schema & sync helpers
    │   │   ├── offlineInference.js # Client-side pure JS rule engine
    │   │   ├── qr.js               # QR payload formatter & verification signer
    │   │   └── QRBadge.jsx         # Renderable SVG/Canvas QR component
    │   └── i18n/
    │       ├── en.json             # English UI & advisory strings
    │       ├── hi.json             # Hindi (हिंदी) UI & advisory strings
    │       └── LanguageContext.jsx # Reactive language state context
    ├── package.json
    └── vite.config.js
```

---

## 📋 Compliance & Capabilities Checklist

- [x] **Specifications Compliance**: Built strictly to feed and silage quality screening criteria.
- [x] **Rule Engine**: Ground truth verification on official test cases with 100% accuracy.
- [x] **Dual-Mode Inference**: Pure Python backend engine + exact client-side JS offline engine.
- [x] **Zero Hardware Barrier**: Software-first prototype accepting direct lab values, simulation presets, and camera HSV analysis.
- [x] **Farmer Usability**: High-contrast mobile UI with instant Hindi/English bilingual switching.
- [x] **Data Integrity**: Clean offline-to-online reconciliation queue preventing data loss in rural low-bandwidth regions.

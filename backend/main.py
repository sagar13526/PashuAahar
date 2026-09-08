"""
PashuAahar - FastAPI Backend Application
Smart AI-Enabled Rapid Feed and Silage Quality Testing System
Ministry of Fisheries, Animal Husbandry & Dairying
"""

import os
import io
import json
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, Field
import qrcode

import db
import advisory_engine
import image_features

# =====================================================================
# Lifespan / Startup
# =====================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and Seed Data
    db.init_db()
    yield

app = FastAPI(
    title="PashuAahar - Feed & Silage Testing API",
    description="Smart AI-Enabled Rapid Feed & Silage Quality Testing API for Dairy Farmers",
    version="1.0.0",
    lifespan=lifespan
)

# Open CORS for rapid local testing and mobile PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Pydantic Request & Response Schemas
# =====================================================================
class PredictRequest(BaseModel):
    sample_type: str = Field(..., description="'feed' or 'silage'")
    feed_subtype: Optional[str] = Field(None, description="'pellet', 'mash', 'mineral_mixture', 'other'")
    moisture_pct: Optional[float] = Field(None, description="Moisture percentage")
    protein_pct: Optional[float] = Field(None, description="Crude Protein percentage (optional)")
    fiber_pct: Optional[float] = Field(None, description="Crude Fiber percentage (optional)")
    aflatoxin_ppb: Optional[float] = Field(0.0, description="Aflatoxin contamination in ppb (optional)")
    ph: Optional[float] = Field(None, description="pH reading (mainly for silage)")
    color_features: Optional[Dict[str, float]] = Field(None, description="Extracted CV color metrics")
    demo_sample_id: Optional[str] = Field(None, description="'F001' to 'F005' preset selector")

class AdvisoryOutput(BaseModel):
    en: str
    hi: str

class PredictResponse(BaseModel):
    protein_pct: Optional[float]
    moisture_pct: float
    fiber_pct: Optional[float]
    ph: Optional[float]
    aflatoxin_ppb: float
    estimated_energy_value: str
    energy_mcal_kg: Optional[float]
    mineral_status: Optional[str] = "Balanced Mineral Profile (Standard Proxy)"
    fermentation_quality: Optional[str] = None
    spoilage_risk: Optional[str] = None
    mould_risk: Optional[str] = None
    adulteration_detected: str
    quality_status: str
    confidence_score: float
    advisory: AdvisoryOutput
    why_this_result: List[str]

class TestRecord(BaseModel):
    id: Optional[str] = None
    farmer_name: Optional[str] = ""
    farmer_id: Optional[str] = ""
    location: Optional[str] = ""
    sample_type: str
    feed_subtype: Optional[str] = None
    input_mode: Optional[str] = "manual"
    demo_sample_id: Optional[str] = None
    moisture_pct: float
    protein_pct: Optional[float] = None
    fiber_pct: Optional[float] = None
    energy_value: Optional[float] = None
    aflatoxin_ppb: Optional[float] = 0.0
    ph: Optional[float] = None
    mineral_status: Optional[str] = None
    fermentation_quality: Optional[str] = None
    spoilage_risk: Optional[str] = None
    mould_risk: Optional[str] = None
    adulteration_detected: Optional[str] = "None"
    quality_status: str
    confidence_score: Optional[float] = 0.85
    advisory_text_en: Optional[str] = ""
    advisory_text_hi: Optional[str] = ""
    image_ref: Optional[str] = None
    qr_payload: Optional[str] = ""
    created_at: Optional[str] = None
    synced: Optional[bool] = True

class SyncBatchRequest(BaseModel):
    records: List[Dict[str, Any]]

# =====================================================================
# API Endpoints
# =====================================================================

@app.get("/", tags=["Health"])
def health_check():
    return {
        "service": "PashuAahar Backend",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "docs_url": "/docs"
    }

@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
def predict_quality(req: PredictRequest):
    """
    Run instant AI / rule-based inference on sample parameters.
    Predicts quality status, adulteration flags, nutrient proxies, confidence,
    multilingual advisory, and rule explanation.
    """
    result = advisory_engine.evaluate_sample(
        sample_type=req.sample_type,
        feed_subtype=req.feed_subtype,
        moisture_pct=req.moisture_pct,
        protein_pct=req.protein_pct,
        fiber_pct=req.fiber_pct,
        aflatoxin_ppb=req.aflatoxin_ppb,
        ph=req.ph,
        color_features=req.color_features,
        demo_sample_id=req.demo_sample_id
    )
    return result

@app.post("/tests", tags=["Tests CRUD"])
def create_test(record: TestRecord):
    """
    Save a completed test record into the database.
    """
    rec_dict = record.model_dump()
    if not rec_dict.get("id"):
        rec_dict["id"] = str(uuid.uuid4())
    if not rec_dict.get("created_at"):
        rec_dict["created_at"] = datetime.utcnow().isoformat()
    if not rec_dict.get("qr_payload"):
        rec_dict["qr_payload"] = (
            f"PASHUAAHAR|ID:{rec_dict['id']}|Sample:{rec_dict['sample_type']}|"
            f"Quality:{rec_dict['quality_status']}|Adulteration:{rec_dict.get('adulteration_detected')}|"
            f"Protein:{rec_dict.get('protein_pct')}%|Moisture:{rec_dict.get('moisture_pct')}%"
        )

    saved = db.save_test(rec_dict)
    return {"status": "success", "record": saved}

@app.get("/tests", tags=["Tests CRUD"])
def list_tests(
    farmer_id: Optional[str] = Query(None, description="Filter by farmer ID or name"),
    sample_type: Optional[str] = Query(None, description="Filter by 'feed' or 'silage'"),
    quality_status: Optional[str] = Query(None, description="Filter by 'Good', 'Moderate', 'Poor', 'Unsafe'"),
    from_date: Optional[str] = Query(None, alias="from", description="ISO start date filter"),
    to_date: Optional[str] = Query(None, alias="to", description="ISO end date filter")
):
    """
    Retrieve past tests with optional filtering.
    """
    tests = db.get_tests(
        farmer_id=farmer_id,
        sample_type=sample_type,
        quality_status=quality_status,
        from_date=from_date,
        to_date=to_date
    )
    return {"count": len(tests), "tests": tests}

@app.get("/tests/{test_id}", tags=["Tests CRUD"])
def get_single_test(test_id: str):
    """
    Retrieve single test by its ID.
    """
    item = db.get_test_by_id(test_id)
    if not item:
        raise HTTPException(status_code=404, detail="Test record not found")
    return item

@app.post("/sync", tags=["Offline Sync"])
def sync_offline_records(payload: SyncBatchRequest):
    """
    Batch upsert offline-queued records from IndexedDB into server SQLite.
    """
    count = db.batch_upsert_tests(payload.records)
    return {
        "status": "success",
        "synced_count": count,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/dashboard/summary", tags=["Dashboard"])
def dashboard_summary():
    """
    Aggregates for the cooperative/web dashboard:
    Quality breakdown, sample types, adulteration categories, averages, and trend timeline.
    """
    summary = db.get_dashboard_summary()
    return summary

@app.get("/tests/{test_id}/qr", tags=["Traceability"])
def get_test_qr(test_id: str):
    """
    Generate and stream a PNG QR code for a test record.
    """
    record = db.get_test_by_id(test_id)
    if not record:
        qr_content = f"PASHUAAHAR|ID:{test_id}|NOT_FOUND"
    else:
        qr_content = record.get("qr_payload") or (
            f"PASHUAAHAR|ID:{test_id}|Sample:{record.get('sample_type')}|"
            f"Quality:{record.get('quality_status')}|Adulteration:{record.get('adulteration_detected')}"
        )

    # Generate QR Code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(qr_content)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_buffer.seek(0)

    return Response(content=img_buffer.getvalue(), media_type="image/png")

@app.get("/seed-samples", tags=["Demo Support"])
def get_seed_samples():
    """
    Returns the official 5 seed rows (F001-F005) for quick demo selection in the UI.
    """
    seed_file = os.path.join(os.path.dirname(__file__), "data", "seed_data.json")
    if os.path.exists(seed_file):
        with open(seed_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.post("/analyze-image", tags=["Image Analysis"])
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    preset: Optional[str] = Form(None)
):
    """
    Extract color features (% dark green/mould, % white crystal, % sand) from image or preset.
    """
    if preset and preset in image_features.PRESETS:
        features = image_features.extract_features_from_image(preset)
        return {"status": "success", "features": features}

    if file:
        file_bytes = await file.read()
        features = image_features.extract_features_from_image(file_bytes)
        return {"status": "success", "features": features}

    # Default to clean preset
    return {"status": "success", "features": image_features.PRESETS["clean"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
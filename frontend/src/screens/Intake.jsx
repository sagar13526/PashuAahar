import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { 
  ArrowLeft, Sparkles, Sliders, Camera, FileText, Check, 
  AlertCircle, Info, Upload, Trash2, RefreshCw 
} from "lucide-react";
import { extractFeaturesFromImageFile, IMAGE_PRESETS } from "../lib/imageFeatures";

const DEMO_PRESETS = {
  F001: {
    id: "F001",
    feed_type: "Cattle Feed Pellet",
    sample_type: "feed",
    feed_subtype: "pellet",
    moisture_pct: 10.0,
    protein_pct: 21.0,
    fiber_pct: 14.0,
    aflatoxin_ppb: 5.0,
    ph: null,
    farmer_name: "Ramesh Kumar",
    location: "Meerut, UP",
    desc: "Clean standard cattle feed pellet. Low aflatoxin, balanced protein."
  },
  F002: {
    id: "F002",
    feed_type: "Silage",
    sample_type: "silage",
    feed_subtype: null,
    moisture_pct: 68.0,
    protein_pct: 9.0,
    fiber_pct: 24.0,
    aflatoxin_ppb: 12.0,
    ph: 4.1,
    farmer_name: "Suresh Patel",
    location: "Anand, Gujarat",
    desc: "Silage fodder with fungal mould presence. Optimal pH but moderate toxin."
  },
  F003: {
    id: "F003",
    feed_type: "Mineral Mixture",
    sample_type: "feed",
    feed_subtype: "mineral_mixture",
    moisture_pct: 3.0,
    protein_pct: null,
    fiber_pct: null,
    aflatoxin_ppb: 0.0,
    ph: null,
    farmer_name: "Kisan Dairy Farm",
    location: "Karnal, Haryana",
    desc: "Mineral mixture with excess salt adulteration."
  },
  F004: {
    id: "F004",
    feed_type: "Feed Mash",
    sample_type: "feed",
    feed_subtype: "mash",
    moisture_pct: 12.0,
    protein_pct: 18.0,
    fiber_pct: 16.0,
    aflatoxin_ppb: 20.0,
    ph: null,
    farmer_name: "Balwinder Singh",
    location: "Ludhiana, Punjab",
    desc: "Feed mash with sand contamination and critical aflatoxins (>15 ppb)."
  },
  F005: {
    id: "F005",
    feed_type: "Silage",
    sample_type: "silage",
    feed_subtype: null,
    moisture_pct: 72.0,
    protein_pct: 8.0,
    fiber_pct: 28.0,
    aflatoxin_ppb: 8.0,
    ph: 5.8,
    farmer_name: "Mahesh Yadav",
    location: "Mathura, UP",
    desc: "Spoiled silage with high pH (5.8) indicating failed fermentation."
  }
};

export default function Intake({ initialSampleType = "feed", initialDemoId = null, onBack, onSubmit }) {
  const { t, lang } = useLanguage();

  const [sampleType, setSampleType] = useState(initialSampleType);
  const [feedSubtype, setFeedSubtype] = useState(initialSampleType === "feed"  ?  "pellet" : null);
  const [inputMode, setInputMode] = useState(initialDemoId  ?  "demo" : "manual");
  const [selectedDemoId, setSelectedDemoId] = useState(initialDemoId || "F001");

  // Farmer Info
  const [farmerName, setFarmerName] = useState("Ramesh Kumar");
  const [farmerId, setFarmerId] = useState("COOP-01");
  const [location, setLocation] = useState("Meerut, UP");

  // Measured Parameters
  const [moisture, setMoisture] = useState(initialSampleType === "silage"  ?  68.0 : 10.5);
  const [protein, setProtein] = useState(initialSampleType === "silage"  ?  8.5 : 20.0);
  const [fiber, setFiber] = useState(initialSampleType === "silage"  ?  25.0 : 14.0);
  const [aflatoxin, setAflatoxin] = useState(5.0);
  const [ph, setPh] = useState(initialSampleType === "silage"  ?  4.2 : null);

  // Photo preset & Real Image Upload state
  const [photoProfile, setPhotoProfile] = useState("clean");
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadedImage({
      file,
      name: file.name,
      size: file.size,
      type: file.type || "image",
      previewUrl,
      features: null,
      thumbnail: null,
      isAnalyzing: true
    });
    setPhotoProfile(null);

    try {
      const result = await extractFeaturesFromImageFile(file);
      setUploadedImage((prev) => prev ? {
        ...prev,
        features: result.features,
        thumbnail: result.thumbnail,
        isAnalyzing: false
      } : null);
    } catch (err) {
      console.error("Image analysis failed:", err);
      setUploadedImage((prev) => prev ? {
        ...prev,
        features: IMAGE_PRESETS.clean,
        isAnalyzing: false
      } : null);
    }
  };

  const handleRemoveImage = () => {
    if (uploadedImage?.previewUrl) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    setPhotoProfile("clean");
  };

  const handleSelectDemoProfile = (profileId) => {
    if (uploadedImage?.previewUrl) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    setPhotoProfile(profileId);
  };

  useEffect(() => {
    return () => {
      if (uploadedImage?.previewUrl) {
        URL.revokeObjectURL(uploadedImage.previewUrl);
      }
    };
  }, [uploadedImage]);

  // Update defaults when switching sampleType
  const handleTypeChange = (type) => {
    setSampleType(type);
    if (type === "silage") {
      setFeedSubtype(null);
      setMoisture(68.0);
      setProtein(8.5);
      setFiber(25.0);
      setPh(4.2);
    } else {
      setFeedSubtype("pellet");
      setMoisture(10.5);
      setProtein(20.0);
      setFiber(14.0);
      setPh(null);
    }
  };

  // Sync demo selection
  const handleDemoSelect = (sid) => {
    setSelectedDemoId(sid);
    const d = DEMO_PRESETS[sid];
    if (d) {
      setSampleType(d.sample_type);
      setFeedSubtype(d.feed_subtype);
      setMoisture(d.moisture_pct !== null  ?  d.moisture_pct : 10.0);
      setProtein(d.protein_pct);
      setFiber(d.fiber_pct);
      setAflatoxin(d.aflatoxin_ppb);
      setPh(d.ph);
      setFarmerName(d.farmer_name);
      setLocation(d.location);
    }
  };

  // Trigger demo load on mount if provided
  useEffect(() => {
    if (initialDemoId && DEMO_PRESETS[initialDemoId]) {
      handleDemoSelect(initialDemoId);
      setInputMode("demo");
    }
  }, [initialDemoId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let colorFeatures = null;
    let imageRef = null;

    if (inputMode === "photo") {
      if (uploadedImage && uploadedImage.features) {
        colorFeatures = uploadedImage.features;
        imageRef = uploadedImage.thumbnail || uploadedImage.name;
      } else if (photoProfile === "mouldy") {
        colorFeatures = IMAGE_PRESETS.mouldy;
      } else if (photoProfile === "sandy") {
        colorFeatures = IMAGE_PRESETS.sandy;
      } else {
        colorFeatures = IMAGE_PRESETS.clean;
      }
    }

    const payload = {
      sample_type: sampleType,
      feed_subtype: sampleType === "feed"  ?  feedSubtype : null,
      input_mode: inputMode === "demo" ? "demo_sample" : (inputMode === "photo" ? "photo" : "manual"),
      demo_sample_id: inputMode === "demo"  ?  selectedDemoId : null,
      farmer_name: farmerName,
      farmer_id: farmerId,
      location: location,
      moisture_pct: moisture !== ""  ?  Number(moisture) : null,
      protein_pct: protein !== "" && protein !== null  ?  Number(protein) : null,
      fiber_pct: fiber !== "" && fiber !== null  ?  Number(fiber) : null,
      aflatoxin_ppb: aflatoxin !== ""  ?  Number(aflatoxin) : 0.0,
      ph: sampleType === "silage" && ph !== ""  ?  Number(ph) : null,
      color_features: inputMode === "photo"  ?  colorFeatures : null,
      image_ref: imageRef
    };

    onSubmit(payload);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "वापस" : "Back"}</span>
        </button>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          {lang === "hi" ? "चरण 1 / 2: नमूना विवरण (Sample Intake)" : "Step 1 of 2: Sample Intake"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sample Category Toggle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {lang === "hi" ? "नमूने की श्रेणी (Sample Category)" : "Sample Category"}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("feed")}
              className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all ${
                sampleType === "feed"
                   ?  "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              🌾 {lang === "hi" ? "सूखा चारा / दाना (Feed)" : "Cattle Feed / Concentrate"}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("silage")}
              className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all ${
                sampleType === "silage"
                   ?  "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              🌱 {lang === "hi" ? "साइलेज हरा चारा (Silage)" : "Silage Fodder"}
            </button>
          </div>

          {/* Feed Subtype if Feed */}
          {sampleType === "feed" && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 mb-2">
                {t("intake.feedSubtype")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "pellet", label: t("intake.pellet") },
                  { id: "mash", label: t("intake.mash") },
                  { id: "mineral_mixture", label: t("intake.mineral") },
                  { id: "other", label: t("intake.other") }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFeedSubtype(item.id);
                      if (item.id === "mineral_mixture") {
                        setProtein(null);
                        setFiber(null);
                        setMoisture(3.0);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      feedSubtype === item.id
                         ?  "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Mode Selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t("intake.selectMode")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "demo", label: lang === "hi" ? "🎯 डेमो कार्ड" : "🎯 Demo Preset", icon: Sparkles },
              { id: "manual", label: lang === "hi" ? "✍️ मैन्युअल मान" : "✍️ Manual Values", icon: Sliders },
              { id: "photo", label: "📷 Camera / CV", icon: Camera }
            ].map((m) => {
              const Icon = m.icon;
              const active = inputMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    active
                       ?  "bg-emerald-50 text-emerald-800 border-emerald-500 font-bold shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active  ?  "text-emerald-600" : "text-slate-500"}`} />
                  <span className="text-xs">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* MODE 1: Official Demo Card Selection */}
          {inputMode === "demo" && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "आधिकारिक टेस्ट नमूना चुनें:" : "Pick an Official Test Sample:"}
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded">Ground Truth</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(DEMO_PRESETS).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleDemoSelect(item.id)}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      selectedDemoId === item.id
                         ?  "bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-200"
                        : "bg-white/60 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{item.id}: {item.feed_type}</span>
                      {selectedDemoId === item.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODE 2: Manual Parameter Sliders / Inputs */}
          {inputMode === "manual" && (
            <div className="mt-5 space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Moisture % */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{t("manual.moisture")}</span>
                    <span className="text-emerald-700 font-mono">{moisture}%</span>
                  </div>
                  <input
                    type="range"
                    min={sampleType === "silage"  ?  50 : 5}
                    max={sampleType === "silage"  ?  85 : 20}
                    step="0.5"
                    value={moisture}
                    onChange={(e) => setMoisture(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                {/* Crude Protein % */}
                {feedSubtype !== "mineral_mixture" && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{t("manual.protein")}</span>
                      <span className="text-emerald-700 font-mono">
                        {protein !== null  ?  `${protein}%` : (lang === "hi" ? "अनुमानित छोड़ें" : "Omit (Estimate)")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="0.5"
                      value={protein || 18}
                      onChange={(e) => setProtein(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                )}

                {/* Fiber % */}
                {feedSubtype !== "mineral_mixture" && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{t("manual.fiber")}</span>
                      <span className="text-emerald-700 font-mono">
                        {fiber !== null  ?  `${fiber}%` : (lang === "hi" ? "अनुमानित छोड़ें" : "Omit (Estimate)")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="35"
                      step="0.5"
                      value={fiber || 15}
                      onChange={(e) => setFiber(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                )}

                {/* Aflatoxin ppb */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{t("manual.aflatoxin")}</span>
                    <span className={"font-mono font-bold " + (aflatoxin > 15 ? "text-rose-600" : (aflatoxin >= 8 ? "text-amber-600" : "text-emerald-700"))}>
                      {aflatoxin} ppb {aflatoxin > 15 && (lang === "hi" ? " (सुरक्षित सीमा से अधिक)" : " (Violates Safe Limit)")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={aflatoxin}
                    onChange={(e) => setAflatoxin(Number(e.target.value))}
                    className={`w-full ${aflatoxin > 15  ?  "accent-rose-600" : "accent-emerald-600"}`}
                  />
                </div>

                {/* Silage pH */}
                {sampleType === "silage" && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{t("manual.ph")}</span>
                      <span className={`font-mono font-bold ${ph > 5.0  ?  "text-rose-600" : "text-emerald-700"}`}>
                        pH {ph} {ph > 5.0 && (lang === "hi" ? " (खराबी का खतरा)" : " (Spoilage Risk)")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3.5"
                      max="7.0"
                      step="0.1"
                      value={ph || 4.2}
                      onChange={(e) => setPh(Number(e.target.value))}
                      className={`w-full ${ph > 5.0  ?  "accent-rose-600" : "accent-teal-600"}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 3: Camera / Photo Analysis */}
          {inputMode === "photo" && (
            <div className="mt-5 space-y-4 pt-2">
              {/* Hidden file input for desktop file picker & mobile gallery */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {/* Hidden camera input for mobile direct camera capture */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Primary Image Upload / Camera Card */}
              {!uploadedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-center gap-1.5">
                      {lang === "hi" ? "फ़ोटो खींचें / इमेज अपलोड करें" : "Take Photo / Upload Image"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === "hi" 
                        ? "इमेज चुनें (JPG, JPEG, PNG, WEBP) या सीधे कैमरे से फ़ोटो लें" 
                        : "Supports JPG, JPEG, PNG, WEBP • Captures via camera or selects from device"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      {lang === "hi"
                        ? "ऑफ़लाइन Heuristic CV: सतही रंग, फफूंद धब्बे व किरकिरी रेत का विश्लेषण"
                        : "Offline Heuristic CV: Analyzes surface color, fungal mycelia & sediment ratios"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "कैमरा (फ़ोटो लें)" : "Take Photo"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "फ़ाइल चुनें" : "Upload Image"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedImage.previewUrl}
                        alt="Selected sample"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-emerald-300 shadow-xs bg-white shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[170px] sm:max-w-xs">
                            {uploadedImage.name}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                            {lang === "hi" ? "लोड हुआ" : "Loaded"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {(uploadedImage.size / 1024).toFixed(1)} KB • {uploadedImage.type} • {lang === "hi" ? "जाँच के लिए तैयार" : "Ready for analysis"}
                        </p>

                        {uploadedImage.isAnalyzing ? (
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>{lang === "hi" ? "Heuristic CV फ़ीचर्स का विश्लेषण..." : "Extracting heuristic CV features..."}</span>
                          </div>
                        ) : uploadedImage.features ? (
                          <div className="text-[10px] text-slate-600 mt-1.5 flex flex-wrap gap-1">
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Mould: {(uploadedImage.features.dark_green_ratio * 100).toFixed(1)}%
                            </span>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Silica: {(uploadedImage.features.sand_ratio * 100).toFixed(1)}%
                            </span>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Brightness: {uploadedImage.features.avg_brightness}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-500" />
                        <span>{lang === "hi" ? "बदलें" : "Replace"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{lang === "hi" ? "हटाएं" : "Remove"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider absolute">
                  OR
                </span>
              </div>

              {/* Demo Image Profiles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "डेमो इमेज प्रोफ़ाइल:" : "Demo Image Profiles:"}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded">
                    {lang === "hi" ? "त्वरित सिमुलेशन" : "Quick Simulation"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "clean", title: t("intake.cleanProfile"), desc: lang === "hi" ? "साफ रंग, फफूंद या रेत नहीं" : "Uniform color, no mould, no sediment", badge: "Normal" },
                    { id: "mouldy", title: t("intake.mouldyProfile"), desc: lang === "hi" ? "गहरा हरा व स्लेटी फफूंद (spores)" : "Dark green & grey fungal mycelia detected", badge: "Spores" },
                    { id: "sandy", title: t("intake.sandyProfile"), desc: lang === "hi" ? "सफेद क्रिस्टल नमक या किरकिरी रेत" : "Crystalline white salt / grey gritty silica", badge: "Inorganic" }
                  ].map((p) => {
                    const isSelected = !uploadedImage && photoProfile === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectDemoProfile(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between font-bold text-xs text-slate-800">
                          <span>{p.title}</span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{p.badge}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Farmer Information Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            {lang === "hi" ? "किसान एवं बैच ट्रेसेबिलिटी (Traceability)" : "Farmer & Batch Traceability"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t("intake.farmerName")}</label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder={t("intake.farmerNamePlaceholder")}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t("intake.farmerId")}</label>
              <input
                type="text"
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder={t("intake.farmerIdPlaceholder")}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t("intake.location")}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("intake.locationPlaceholder")}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span>{t("btn.analyze")}</span>
        </button>
      </form>
    </div>
  );
}
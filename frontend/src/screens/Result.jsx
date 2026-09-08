import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { QRBadge } from "../lib/QRBadge";
import { formatQRPayload } from "../lib/qr";
import { 
  CheckCircle2, AlertTriangle, XCircle, AlertOctagon, 
  ChevronDown, ChevronUp, QrCode, Share2, Save, RotateCcw, 
  Sparkles, ShieldAlert, Activity, ArrowLeft, Download, Check,
  Layers, Thermometer, Droplets, Clock, Radio, ListChecks
} from "lucide-react";

export default function Result({ result, onSave, onNewTest, onBack }) {
  const { t, lang, setLang } = useLanguage();
  const [showWhy, setShowWhy] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!result) return null;

  const {
    id,
    farmer_name,
    farmer_id,
    location,
    sample_type,
    feed_subtype,
    quality_status,
    adulteration_detected,
    confidence_score,
    protein_pct,
    moisture_pct,
    fiber_pct,
    aflatoxin_ppb,
    ph,
    estimated_energy_value,
    energy_mcal_kg,
    mineral_status,
    fermentation_quality,
    spoilage_risk,
    mould_risk,
    advisory,
    advisory_text_en,
    advisory_text_hi,
    why_this_result,
    image_ref,
    created_at
  } = result;

  // Status Styling Configuration
  const statusConfigs = {
    Good: {
      badgeBg: "bg-emerald-500",
      lightBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      accentBorder: "border-emerald-500",
      icon: CheckCircle2,
      labelEn: "Good Quality — Safe",
      labelHi: "Good — सुरक्षित (Safe for Feeding)",
      heroGradient: "from-emerald-600 to-teal-700"
    },
    Moderate: {
      badgeBg: "bg-amber-500",
      lightBg: "bg-amber-50 border-amber-200 text-amber-900",
      accentBorder: "border-amber-500",
      icon: AlertTriangle,
      labelEn: "Moderate — Caution Advised",
      labelHi: "Moderate — सावधानी आवश्यक (Caution)",
      heroGradient: "from-amber-600 to-yellow-700"
    },
    Poor: {
      badgeBg: "bg-orange-500",
      lightBg: "bg-orange-50 border-orange-200 text-orange-900",
      accentBorder: "border-orange-500",
      icon: AlertOctagon,
      labelEn: "Poor — Sub-standard",
      labelHi: "Poor — मानक से कम (Sub-standard)",
      heroGradient: "from-orange-600 to-amber-700"
    },
    Unsafe: {
      badgeBg: "bg-rose-600",
      lightBg: "bg-rose-50 border-rose-200 text-rose-900",
      accentBorder: "border-rose-500",
      icon: XCircle,
      labelEn: "Unsafe — Do Not Feed!",
      labelHi: "Unsafe — पशु को न खिलाएं (Do Not Feed!)",
      heroGradient: "from-rose-600 to-red-800"
    }
  };

  const currentCfg = statusConfigs[quality_status] || statusConfigs.Good;
  const StatusIcon = currentCfg.icon;

  // Active advisory text
  const advText = lang === "hi"
     ?  (advisory?.hi || advisory_text_hi || advisory?.en || advisory_text_en)
    : (advisory?.en || advisory_text_en || advisory?.hi || advisory_text_hi);

  // Structured 3-step advisory: (1) What found? (2) Why? (3) Actionable steps?
  const getStructuredAdvisory = () => {
    const isSilage = sample_type === "silage";
    const hasAdulterant = adulteration_detected && adulteration_detected !== "None";

    let whatFound = "";
    let whyReason = "";
    let actionSteps = [];

    if (quality_status === "Good") {
      if (lang === "hi") {
        whatFound = isSilage
          ? "उत्कृष्ट गुणवत्ता साइलेज — ताजा, सु-किण्वित पौष्टिक हरा चारा।"
          : "मानक ग्रेड-A पशु आहार — स्वच्छ, सूखा एवं संतुलित पोषण युक्त चारा।";
        whyReason = isSilage
          ? `साइलेज pH (${ph ?? 4.0}) लैक्टिक एसिड के सही किण्वन को दर्शाता है। Aflatoxin (${aflatoxin_ppb} ppb) सुरक्षित सीमा में है।`
          : `नमी (${moisture_pct}%) सुरक्षित भंडारण मानकों (<12%) के अनुरूप है। प्रोटीन (${protein_pct ?? 20}%) और Aflatoxin (${aflatoxin_ppb} ppb) सुरक्षित सीमा में हैं।`;
        actionSteps = [
          "दुधारू पशुओं को सीधे खिलाने के लिए पूर्णतः सुरक्षित है।",
          "सूखे व हवादार स्थान पर जमीन से ऊपर लकड़ी के तख्ते (pallets) पर रखें।",
          "साइलो से चारा निकालने के बाद गड्ढे को तुरंत तिरपाल से वायुरोधी (airtight) ढकें।"
        ];
      } else {
        whatFound = isSilage 
          ? "Optimal Quality Silage — Fresh, well-fermented green fodder." 
          : "Standard Grade-A Feed — Clean, dry, nutritionally balanced fodder.";
        whyReason = isSilage
          ? `Silage pH (${ph ?? 4.0}) indicates optimal lactic acid acidification without clostridial decay. Aflatoxin (${aflatoxin_ppb} ppb) is within safe limits.`
          : `Moisture (${moisture_pct}%) complies with safe storage standards (<12%). Protein (${protein_pct ?? 20}%) and aflatoxin (${aflatoxin_ppb} ppb) are well within BIS thresholds.`;
        actionSteps = [
          "Safe to feed directly to lactating and high-yielding dairy cattle.",
          "Store in a dry, ventilated area on raised wooden pallets.",
          "Ensure airtight sealing of silo pits after daily extraction to prevent secondary aerobic spoilage."
        ];
      }
    } else if (quality_status === "Moderate") {
      if (lang === "hi") {
        whatFound = `मध्यम गुणवत्ता — सावधानी आवश्यक (${hasAdulterant ? adulteration_detected : "सामान्य से भिन्न स्तर"})।`;
        whyReason = `Aflatoxin स्तर (${aflatoxin_ppb} ppb) अथवा नमी (${moisture_pct}%) चेतावनी सीमा पर है, जिससे फफूंद या खराबी का प्रारंभिक जोखिम है।`;
        actionSteps = [
          "पशु को खिलाने से पहले ताजे सूखे चारे के साथ (कम से कम 1:1 अनुपात में) मिलाकर दें।",
          "पशु आहार में प्रमाणित mycotoxin binder (मायकोटॉक्सिन बाइंडर) मिलाएं।",
          "लंबे समय तक भंडारण न करें; 3-5 दिनों के भीतर सूखे स्थान पर रखकर उपयोग करें।"
        ];
      } else {
        whatFound = `Moderate Quality — Caution Advised (${hasAdulterant ? adulteration_detected : "Sub-optimal parameters"}).`;
        whyReason = `Aflatoxin level (${aflatoxin_ppb} ppb) or moisture (${moisture_pct}%) is bordering cautionary thresholds, presenting early deterioration risk.`;
        actionSteps = [
          "Dilute and blend with clean, fresh dry feed (at least 1:1 ratio) before feeding.",
          "Incorporate a certified mycotoxin binder / aluminosilicate adsorbent into the ration.",
          "Do not store for prolonged periods; consume within 3–5 days in dry shelter."
        ];
      }
    } else if (quality_status === "Poor") {
      if (lang === "hi") {
        whatFound = `निम्न गुणवत्ता — अमानक चारा (${hasAdulterant ? adulteration_detected : "पोषक तत्वों में कमी"})।`;
        whyReason = hasAdulterant
          ? `स्क्रीनिंग में ${adulteration_detected} पाया गया। नमी (${moisture_pct}%) अथवा ऐश स्तर पाचन क्षमता और पशु स्वास्थ्य को प्रभावित करते हैं।`
          : `नमी (${moisture_pct}%) असंतुलित है और प्रोटीन स्तर कम है, जिससे दूध उत्पादन प्रभावित हो सकता है।`;
        actionSteps = [
          "गाभिन या दुधारू पशुओं को न खिलाएं; इससे दूध उत्पादन गिर सकता है और पेट खराब हो सकता है।",
          "यदि नमक या अकार्बनिक मिलावट है, तो इस लॉट को अलग रखें और सप्लायर से शिकायत करें।",
          "थोक खरीद स्वीकार करने से पहले प्रमाणित प्रयोगशाला में रासायनिक जांच कराएं।"
        ];
      } else {
        whatFound = `Poor Quality — Sub-standard Feed (${hasAdulterant ? adulteration_detected : "Degraded nutrition"}).`;
        whyReason = hasAdulterant
          ? `Screening flagged ${adulteration_detected}. Moisture (${moisture_pct}%) or ash levels compromise digestive efficiency and metabolic safety.`
          : `Moisture (${moisture_pct}%) is out of target bounds and crude protein is deficient, limiting production yield.`;
        actionSteps = [
          "Do NOT feed to pregnant or lactating animals; restricts milk yield and may cause digestive upset.",
          "If contaminated with salt or inorganic ash, isolate batch and seek supplier replacement.",
          "Perform certified laboratory wet-chemistry testing before accepting bulk shipments."
        ];
      }
    } else {
      // Unsafe
      if (lang === "hi") {
        whatFound = `पशुओं के लिए असुरक्षित — गंभीर मिलावट/खराबी चिह्नित (${hasAdulterant ? adulteration_detected : "उच्च जोखिम"})।`;
        whyReason = `Aflatoxin (${aflatoxin_ppb} ppb) सुरक्षित सीमा (>15 ppb) से अधिक है अथवा अत्यधिक रेत/खराबी पाई गई है। इससे पशु के लिवर को नुकसान और दूध में टॉक्सिन आने का गंभीर खतरा है।`;
        actionSteps = [
          "पशु को बिल्कुल न खिलाएं! इस बैच का उपयोग तुरंत रोक दें।",
          "इस चारे को तुरंत अलग (quarantine) करें ताकि साफ चारे में संक्रमण न फैले।",
          "प्रमाणित लैब में HPLC/ELISA जांच कराएं और सहकारी समिति/पशु चिकित्सक को सूचित करें।"
        ];
      } else {
        whatFound = `UNSAFE FOR HERD CONSUMPTION — Severe Contamination Detected (${hasAdulterant ? adulteration_detected : "High Risk"}).`;
        whyReason = `Aflatoxin (${aflatoxin_ppb} ppb) exceeds safety ceiling (>15 ppb) or high inorganic sand/spoilage detected. High risk of aflatoxicosis, hepatic injury, and milk contamination.`;
        actionSteps = [
          "DO NOT FEED! Immediately halt feeding this batch to all livestock.",
          "Quarantine and seal this feed lot to avoid cross-contamination of clean stock.",
          "Send an emergency split-sample for HPLC/ELISA laboratory confirmation and notify dairy cooperative inspector."
        ];
      }
    }

    return { whatFound, whyReason, actionSteps };
  };

  const structuredAdvisory = getStructuredAdvisory();

  const handleSave = async () => {
    if (onSave && !isSaved) {
      await onSave(result);
      setIsSaved(true);
    }
  };

  const handleShare = () => {
    const sub = feed_subtype  ?  " (" + feed_subtype + ")" : "";
    const summary = "PashuAahar Report\nID: " + (id || "N/A") +
      "\nSample: " + sample_type + sub +
      "\nStatus: " + quality_status +
      "\nAdulteration: " + adulteration_detected +
      "\nProtein: " + (protein_pct != null  ?  protein_pct + "%" : "N/A") +
      " | Moisture: " + moisture_pct + "%" +
      "\nAflatoxin: " + aflatoxin_ppb + " ppb" +
      "\nAdvisory: " + advText;
    
    if (navigator.share) {
      navigator.share({
        title: "PashuAahar Quality Report",
        text: summary
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const qrPayload = result.qr_payload || formatQRPayload(result);

  return (
    <div className="space-y-6 pb-16">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack || onNewTest}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "नया परीक्षण" : "New Test"}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en"  ?  "hi" : "en")}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
          >
            {lang === "en"  ?  "🇮🇳 हिन्दी में देखें" : "🇬🇧 Switch English"}
          </button>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className={"bg-gradient-to-br " + currentCfg.heroGradient + " text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 overflow-hidden">
                {image_ref ? (
                  <img src={image_ref} alt="Sample" className="w-full h-full object-cover" />
                ) : (
                  <StatusIcon className="w-10 h-10 text-white" />
                )}
              </div>
              {image_ref && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-xs">
                  <StatusIcon className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                  {t("result.status")}
                </span>
                {(id?.startsWith("F00") || (id && ["F001", "F002", "F003", "F004", "F005"].includes(id))) && (
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md shadow-xs">
                    Official Benchmark Seed
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                {lang === "hi"  ?  currentCfg.labelHi : currentCfg.labelEn}
              </h1>
              <p className="text-xs text-white/80 mt-1 font-medium">
                Sample ID: {id || "DEMO"} - {farmer_name ? (farmer_name + ", " + location) : (lang === "hi" ? "फार्म स्क्रीनिंग" : "Farm Screening")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:self-start bg-black/25 backdrop-blur-sm px-3.5 py-2 rounded-2xl border border-white/15 self-start">
            <Activity className={`w-4 h-4 ${(confidence_score || 0.9) < 0.88 ? "text-amber-300" : "text-emerald-300"}`} />
            <div className="text-right">
              <div className="text-[10px] text-white/70 font-semibold">{t("result.confidence")}</div>
              <div className="text-sm font-black font-mono leading-tight">{Math.round((confidence_score || 0.90) * 100)}%</div>
              <div className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                (confidence_score || 0.9) < 0.88 
                  ? "bg-amber-400 text-amber-950" 
                  : "bg-emerald-400/30 text-emerald-200 border border-emerald-400/30"
              }`}>
                {(confidence_score || 0.9) < 0.88 
                  ? (lang === "hi" ? "कम विश्वास (Low Confidence)" : "Low Confidence") 
                  : (lang === "hi" ? "उच्च विश्वास (High)" : "High Confidence")}
              </div>
            </div>
          </div>
        </div>

        {/* Adulteration Banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-yellow-300" />
            <span className="text-xs font-bold text-white/90">
              {t("result.adulteration")}:
            </span>
            <span className={"text-xs font-black px-2.5 py-0.5 rounded-full " + (
              adulteration_detected && adulteration_detected !== "None"
                ? "bg-white text-rose-700 font-extrabold shadow-xs"
                : "bg-white/20 text-white"
            )}>
              {adulteration_detected && adulteration_detected !== "None" ? adulteration_detected : (lang === "hi" ? "कोई मिलावट नहीं" : "None Detected")}
            </span>
          </div>

          <div className="text-[11px] text-white/80 font-mono">
            {created_at  ?  created_at.split("T")[0] : new Date().toISOString().split("T")[0]}
          </div>
        </div>
      </div>

      {/* Structured Farmer Advisory Card: 1. Found 2. Why 3. Action */}
      <div className={"p-5 sm:p-6 rounded-2xl border-2 " + currentCfg.lightBg + " shadow-sm space-y-4"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t("result.advisory")}</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
            {lang === "hi" ? "3-चरणीय कार्ययोजना एवं मार्गदर्शन" : "3-Step Actionable Farmer Advisory"}
          </span>
        </div>

        {/* 1. What did the system find? */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>{lang === "hi" ? "1. प्रणाली को क्या मिला? (What was found?)" : "1. What did the system find?"}</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug pl-3.5">
            {structuredAdvisory.whatFound}
          </p>
        </div>

        {/* 2. Why? */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>{lang === "hi" ? "2. यह परिणाम क्यों आया? (Why this rating?)" : "2. Why this rating?"}</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug pl-3.5">
            {structuredAdvisory.whyReason}
          </p>
        </div>

        {/* 3. What should the farmer do? */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{lang === "hi" ? "3. किसान को क्या करना चाहिए? (What should the farmer do?)" : "3. What should the farmer do?"}</span>
          </div>
          <ul className="space-y-1.5 pl-3.5">
            {structuredAdvisory.actionSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-slate-800 font-semibold flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Laboratory Confirmation Recommendation Notice (High-Risk, Flagged, or Low Confidence) */}
      {(quality_status === "Unsafe" || (adulteration_detected && adulteration_detected !== "None") || aflatoxin_ppb > 15.0 || (confidence_score && confidence_score < 0.88)) && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-black uppercase tracking-wider text-amber-900 flex items-center gap-2 flex-wrap">
              <span>{lang === "hi" ? "प्रयोगशाला पुष्टि की अनुशंसा" : "Laboratory Confirmation Recommended"}</span>
              {confidence_score && confidence_score < 0.88 && (
                <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-400">
                  {lang === "hi" ? "⚠️ कम विश्वास स्कोर (<88%)" : "⚠️ Low Confidence (<88%)"}
                </span>
              )}
            </div>
            <p className="text-amber-800 leading-relaxed font-medium">
              {lang === "hi" 
                ? "यह परिणाम ऑन-डिवाइस AI स्क्रीनिंग एवं प्रॉक्सी नियमों पर आधारित है। पशु आहार में अत्यधिक मिलावट, उच्च टॉक्सिन जोखिम या कम विश्वास स्कोर (<88%) पाए जाने पर प्रमाणित वेटनरी लैब से रासायनिक पुष्टि (Wet Chemistry / HPLC / ELISA) अवश्य कराएं।"
                : "This result is generated by rapid on-device AI screening proxies. For flagged anomalies, high toxin concentrations, or low confidence screenings (<88%), certified laboratory chemical confirmation (Wet Chemistry / HPLC / ELISA) is strongly recommended before herd feeding."}
            </p>
          </div>
        </div>
      )}

      {/* Nutrient Profile Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {lang === "hi" ? "पोषण एवं गुणवत्ता पैरामीटर्स" : "Nutritional & Quality Parameters"}
          </h3>
          <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
            {lang === "hi" ? "AI स्क्रीनिंग अनुमान" : "AI Screening Estimates"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Protein */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Crude Protein (CP)</div>
            <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
              {protein_pct !== null && protein_pct !== undefined ? (protein_pct + "%") : "N/A"}
            </div>
            <div className="text-[10px] text-slate-400">
              {lang === "hi" ? "मानक: 18–22% • AI अनुमान" : "Target: 18–22% • AI Estimate"}
            </div>
          </div>

          {/* Moisture */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">
              {lang === "hi" ? "Moisture (नमी)" : "Moisture Content"}
            </div>
            <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
              {moisture_pct}%
            </div>
            <div className="text-[10px] text-slate-400">
              {sample_type === "silage" 
                ? (lang === "hi" ? "सामान्य: 65–70%" : "Normal: 65–70%") 
                : (lang === "hi" ? "सुरक्षित: <12%" : "Safe: <12%")}
            </div>
          </div>

          {/* Fiber */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">
              {lang === "hi" ? "Crude Fiber (फाइबर)" : "Crude Fiber"}
            </div>
            <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
              {fiber_pct !== null && fiber_pct !== undefined ? (fiber_pct + "%") : "N/A"}
            </div>
            <div className="text-[10px] text-slate-400">
              {lang === "hi" ? "पाचन क्षमता सूचकांक" : "Digestibility proxy"}
            </div>
          </div>

          {/* Aflatoxin */}
          <div className={"p-3.5 rounded-xl border " + (
            aflatoxin_ppb > 15 
              ? "bg-rose-50 border-rose-200 text-rose-900" 
              : (aflatoxin_ppb >= 8 ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-100")
          )}>
            <div className="text-[11px] font-semibold opacity-80">Aflatoxin B1 / M1</div>
            <div className="text-lg font-black font-mono mt-0.5">
              {aflatoxin_ppb} <span className="text-xs">ppb</span>
            </div>
            <div className="text-[10px] font-semibold">
              {aflatoxin_ppb > 15 
                ? (lang === "hi" ? "CRITICAL: >15 ppb (गंभीर)" : "CRITICAL: >15 ppb") 
                : (aflatoxin_ppb >= 8 
                  ? (lang === "hi" ? "CAUTION: 8-15 ppb (सावधानी)" : "CAUTION: 8-15 ppb") 
                  : (lang === "hi" ? "SAFE: <8 ppb (सुरक्षित)" : "SAFE: <8 ppb"))}
            </div>
          </div>

          {/* Mineral Status / Deficiency */}
          <div className={"p-3.5 rounded-xl border " + (
            (mineral_status && (mineral_status.includes("Anomaly") || mineral_status.includes("Excess") || mineral_status.includes("Degraded") || mineral_status.includes("Sand")))
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-slate-50 border-slate-100"
          )}>
            <div className="text-[11px] font-semibold text-slate-500">
              {lang === "hi" ? "खनिज स्थिति (Mineral Status)" : "Mineral Status / Deficiency"}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 leading-snug">
              {mineral_status || (sample_type === "silage" ? "Normal Silage Ash" : "Balanced Mineral Profile")}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {lang === "hi" ? "ऐश एवं खनिज प्रॉक्सी" : "Ash & mineral proxy"}
            </div>
          </div>

          {/* Energy Value */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">{t("result.energy")}</div>
            <div className="text-base font-black text-slate-800 mt-1">
              {estimated_energy_value || "Medium"}
            </div>
            <div className="text-[10px] text-slate-400">
              {energy_mcal_kg ? (energy_mcal_kg + " Mcal/kg Net") : (lang === "hi" ? "मानक ऊर्जा" : "Standard Energy")}
            </div>
          </div>
        </div>
      </div>

      {/* Silage Monitoring Panel (Dedicated for Silage Fodder) */}
      {sample_type === "silage" && (
        <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>{lang === "hi" ? "साइलेज किण्वन एवं गुणवत्ता निगरानी" : "Silage Fermentation & Quality Monitoring"}</span>
            </h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
              Silage Fodder
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">{lang === "hi" ? "किण्वन pH" : "Fermentation pH"}</div>
              <div className="text-base font-black font-mono text-slate-800 mt-0.5">pH {ph ?? "N/A"}</div>
              <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                {ph <= 4.2 ? "Optimal (<=4.2)" : (ph <= 5.0 ? "Marginal (4.3-5.0)" : "Failed (>5.0)")}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">{lang === "hi" ? "किण्वन गुणवत्ता" : "Fermentation Quality"}</div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {ph <= 4.2 ? "Optimal Lactic" : (ph <= 5.0 ? "Marginal Aerobic" : "Clostridial Putrefaction")}
              </div>
              <div className="text-[10px] text-slate-400">Target pH: 3.8–4.2</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">{lang === "hi" ? "खराबी का खतरा" : "Spoilage Risk"}</div>
              <div className={`text-xs font-bold mt-1 ${ph > 5.0 || moisture_pct > 72 ? "text-rose-600" : "text-emerald-700"}`}>
                {ph > 5.0 || moisture_pct > 72 ? (lang === "hi" ? "उच्च (High Risk)" : "High Spoilage Risk") : (lang === "hi" ? "कम (Low Risk)" : "Low Spoilage Risk")}
              </div>
              <div className="text-[10px] text-slate-400">Anaerobic stability</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">{lang === "hi" ? "Mould वृद्धि जोखिम" : "Mould Growth Risk"}</div>
              <div className={`text-xs font-bold mt-1 ${aflatoxin_ppb >= 8.0 ? "text-amber-600" : "text-emerald-700"}`}>
                {aflatoxin_ppb >= 15 ? "Critical (>15 ppb)" : (aflatoxin_ppb >= 8 ? "Moderate (8-15 ppb)" : "Low (<8 ppb)")}
              </div>
              <div className="text-[10px] text-slate-400">Fungal spore proxy</div>
            </div>
          </div>
        </div>
      )}

      {/* Storage Monitoring & Ambient Telemetry Panel (Simulated IoT Sensors) */}
      <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
              {lang === "hi" ? "भंडारण निगरानी एवं परिवेशीय टेलीमेट्री" : "Storage Monitoring & Ambient Telemetry"}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 self-start">
            <span>📡 {lang === "hi" ? "सिम्युलेटेड टेलीमेट्री (IoT Sensor Preview)" : "Simulated Telemetry (IoT Sensor Preview)"}</span>
          </span>
        </div>

        {/* Honest Transparency Disclaimer */}
        <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
          <span className="font-bold">{lang === "hi" ? "पारदर्शिता नोट: " : "Transparency Note: "}</span>
          {lang === "hi" 
            ? "यह अनुभाग भविष्य के ब्लूटूथ (BLE) / LoRaWAN तापमान और आर्द्रता प्रोब के लिए डेटा पाइपलाइन को प्रदर्शित करता है। वर्तमान मान शेड परिवेश का सिम्युलेशन हैं।" 
            : "Demonstrating the field telemetry pipeline for upcoming Bluetooth (BLE) / LoRaWAN storage probes. Values reflect simulated ambient shed conditions."}
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Temperature */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === "hi" ? "परिवेश तापमान" : "Storage Temp"}</span>
            </div>
            <div className="text-base font-black font-mono text-slate-800 mt-1">27.4°C</div>
            <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
              {lang === "hi" ? "सामान्य (20–30°C)" : "Safe (20–30°C)"}
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>{lang === "hi" ? "सापेक्ष आर्द्रता (RH)" : "Relative Humidity"}</span>
            </div>
            <div className="text-base font-black font-mono text-slate-800 mt-1">68% RH</div>
            <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
              {lang === "hi" ? "मध्यम नमी (चेक करें)" : "Elevated RH (>65%)"}
            </div>
          </div>

          {/* Storage Duration */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === "hi" ? "भंडारण अवधि" : "Storage Age"}</span>
            </div>
            <div className="text-base font-black font-mono text-slate-800 mt-1">19 Days</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {sample_type === "silage" 
                ? (lang === "hi" ? "किण्वन परिपक्व" : "Silo cured") 
                : (lang === "hi" ? "सुरक्षित शेल्फ-लाइफ" : "Safe shelf-life")}
            </div>
          </div>

          {/* Mould Proliferation Risk */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>{lang === "hi" ? "फफूंद प्रोलिफरेशन" : "Mould Risk"}</span>
            </div>
            <div className={`text-xs font-black mt-1 ${aflatoxin_ppb > 15 || moisture_pct > 14 ? "text-rose-600" : (aflatoxin_ppb >= 8 ? "text-amber-600" : "text-emerald-700")}`}>
              {aflatoxin_ppb > 15 || moisture_pct > 14 
                ? (lang === "hi" ? "उच्च जोखिम (High)" : "High Risk") 
                : (aflatoxin_ppb >= 8 ? (lang === "hi" ? "मध्यम (Moderate)" : "Moderate") : (lang === "hi" ? "निम्न (Low)" : "Low"))}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {sample_type === "silage" 
                ? (ph > 4.6 ? "Aerobic exposure" : "Anaerobic seal ok") 
                : (moisture_pct > 12 ? "Damp storage risk" : "Dry storage ok")}
            </div>
          </div>
        </div>
      </div>

      {/* "Why this result?" Explainable AI Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {t("result.why")}
            </span>
          </div>
          {showWhy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showWhy && (
          <div className="p-4 pt-1 bg-slate-50/70 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-500">
              {lang === "hi" 
                ? "इस निर्णय इंजन ने ICAR / Metrohm मानकों पर आधारित जैविक एवं रासायनिक सीमाओं का मिलान किया है:" 
                : "The decision engine applied calibrated biological & chemical thresholds from ICAR / Metrohm benchmarks:"}
            </p>
            <ul className="space-y-1.5 mt-2">
              {(why_this_result || []).map((reason, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* QR Code Traceability Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className="shrink-0">
          <QRBadge payload={qrPayload} size={130} />
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <QrCode className="w-3.5 h-3.5" />
            <span>{lang === "hi" ? "डिजिटल ट्रेसेबिलिटी रिकॉर्ड" : "Digital Traceability Record"}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {lang === "hi" ? "बैच सत्यापन के लिए किसी भी फ़ोन कैमरे से QR स्कैन करें" : "Scan with any phone camera to verify batch"}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "hi" 
              ? "डेयरी सहकारी समिति की ऑडिट व प्रमाणिकता के लिए नमूना ID, परीक्षण तिथि, गुणवत्ता रेटिंग और पोषक मान कूटबद्ध हैं।" 
              : "Encodes sample ID, test date, quality rating, and nutrient readings for dairy cooperative compliance and audit proof."}
          </p>
          <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
            {qrPayload}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleSave}
          disabled={isSaved}
          className={"py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm " + (
            isSaved
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/20"
          )}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? t("btn.saved") : t("btn.save")}</span>
        </button>

        <button
          onClick={handleShare}
          className="py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs"
        >
          <Share2 className="w-4 h-4" />
          <span>{copySuccess ? (lang === "hi" ? "क्लिपबोर्ड पर कॉपी हुआ!" : "Copied to Clipboard!") : (lang === "hi" ? "रिपोर्ट शेयर करें" : "Share Summary")}</span>
        </button>

        <button
          onClick={onNewTest}
          className="py-3.5 px-4 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t("btn.newTest")}</span>
        </button>
      </div>
    </div>
  );
}
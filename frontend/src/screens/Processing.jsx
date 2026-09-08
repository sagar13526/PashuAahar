import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle, Cpu } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function Processing({ onComplete }) {
  const { lang } = useLanguage();
  const [step, setStep] = useState(0);

  const stepsEn = [
    "Reading moisture & spectral reflectance...",
    "Scanning for Aflatoxin B1 / M1 risk bands...",
    "Evaluating fermentation pH & mould spores...",
    "Computing protein & energy density...",
    "Generating localized advisory & traceability QR..."
  ];

  const stepsHi = [
    "नमी एवं स्पेक्ट्रल रीडिंग जाँची जा रही है...",
    "Aflatoxin B1 / M1 रिस्क बैंड्स की स्कैनिंग...",
    "किण्वन pH एवं mould की स्थिति का मूल्यांकन...",
    "प्रोटीन और ऊर्जा घनत्व की गणना जारी...",
    "स्थानीय सलाह एवं ट्रेसेबिलिटी QR तैयार हो रहा है..."
  ];

  const steps = lang === "hi" ? stepsHi : stepsEn;

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 250);
    const timer2 = setTimeout(() => setStep(2), 500);
    const timer3 = setTimeout(() => setStep(3), 750);
    const timer4 = setTimeout(() => setStep(4), 1000);
    const timerEnd = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timerEnd);
    };
  }, [onComplete]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="relative">
        {/* Outer glowing pulsing circle */}
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Cpu className="w-8 h-8 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-extrabold text-slate-800">
          {lang === "hi" ? "AI मॉडल नमूने का विश्लेषण कर रहा है..." : "AI Model Analyzing Sample..."}
        </h2>
        <p className="text-xs text-slate-500">
          {lang === "hi" 
            ? "ऑन-डिवाइस नियम इंजन एवं NIRS प्रॉक्सी से जाँच जारी" 
            : "Running on-device rule engine & NIRS proxy regression"}
        </p>
      </div>

      {/* Dynamic progress message */}
      <div className="bg-white px-4 py-2.5 rounded-full border border-emerald-200 shadow-2xs inline-flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-xs font-semibold text-emerald-800 transition-all">
          {steps[step]}
        </span>
      </div>
    </div>
  );
}
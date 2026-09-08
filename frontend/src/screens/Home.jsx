import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { Wheat, Layers, Sparkles, CheckCircle2, Wifi, WifiOff, History, LayoutDashboard, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Home({ onSelectSampleType, onSelectDemoSample, onNavigate, isOnline, pendingSyncCount }) {
  const { t, lang, setLang } = useLanguage();

  const demoSamples = [
    { id: "F001", feedType: "Pellet Feed", desc: "Balanced Nutrition", status: "Good", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { id: "F002", feedType: "Silage", desc: "Mould Presence", status: "Moderate", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { id: "F003", feedType: "Mineral Mix", desc: "Excess Salt", status: "Poor", color: "text-orange-700 bg-orange-50 border-orange-200" },
    { id: "F004", feedType: "Feed Mash", desc: "Sand + Aflatoxin", status: "Unsafe", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { id: "F005", feedType: "Silage", desc: "pH 5.8 Spoilage", status: "Poor", color: "text-orange-700 bg-orange-50 border-orange-200" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Wheat className="w-64 h-64" />
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Feed & Silage Quality System</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en"  ?  "hi" : "en")}
              className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
            >
              {lang === "en"  ?  "🇮🇳 हिन्दी" : "🇬🇧 English"}
            </button>
          </div>
        </div>

        <div className="mt-5 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-2 text-emerald-100 text-sm sm:text-base leading-relaxed">
            {t("home.heroSub")}
          </p>
        </div>

        {/* Offline Status Pill */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isOnline  ?  "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30" : "bg-amber-500/20 text-amber-200 border border-amber-400/30"
          }`}>
            {isOnline  ?  <Wifi className="w-3.5 h-3.5 text-emerald-300" /> : <WifiOff className="w-3.5 h-3.5 text-amber-300" />}
            <span>{isOnline  ?  t("app.online") : t("app.offline")}</span>
          </div>

          {pendingSyncCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{pendingSyncCount} {t("sync.pending")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Testing Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelectSampleType("feed")}
          className="group text-left bg-white p-6 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Wheat className="w-6 h-6" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
              {t("home.testFeed")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'hi' 
                ? 'Pellets, cattle mash, mineral mix की गुणवत्ता। प्रोटीन, फाइबर, नमी और यूरिया मिलावट देखें।' 
                : 'Pellets, cattle mash, mineral mixtures. Check protein, fiber, moisture & urea.'}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 gap-1">
            <span>{lang === 'hi' ? "परीक्षण शुरू करें" : "Start Test"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => onSelectSampleType("silage")}
          className="group text-left bg-white p-6 rounded-2xl border-2 border-teal-100 hover:border-teal-500 shadow-sm hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Layers className="w-6 h-6" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
              {t("home.testSilage")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'hi' 
                ? 'मक्का/हरे चारे का Silage। किण्वन (fermentation) स्वास्थ्य, pH स्थिति एवं mould की त्वरित जाँच।' 
                : 'Maize/fodder silage. Instant fermentation health, pH status & mould check.'}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-teal-600 gap-1">
            <span>{lang === 'hi' ? "परीक्षण शुरू करें" : "Start Test"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Official Judge Demo Samples Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {t("home.tryDemo")}
            </h2>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
            Official Seed Rows
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          {lang === 'hi'
            ? "किसी भी sample card पर क्लिक करके verified ground-truth के साथ AI inspection model को तुरंत चलाएँ।"
            : "Click any sample card to immediately run the AI inspection model with verified ground truth:"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {demoSamples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectDemoSample(sample.id)}
              className={`p-3 rounded-xl border text-left transition-all hover:scale-102 active:scale-98 ${sample.color}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black tracking-wider shrink-0 font-mono">{sample.id}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/95 border border-current/15 shadow-2xs shrink-0">
                  {sample.status}
                </span>
              </div>
              <div className="text-xs font-bold truncate text-slate-800">{sample.feedType}</div>
              <div className="text-[11px] opacity-85 truncate font-medium">{sample.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("history")}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs text-left"
        >
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">{t("nav.history")}</div>
            <div className="text-xs text-slate-500">
              {lang === 'hi' ? "डिवाइस में सुरक्षित" : "Stored on device"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs text-left"
        >
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">{t("nav.dashboard")}</div>
            <div className="text-xs text-slate-500">
              {lang === 'hi' ? "सहकारी संस्था के आँकड़े" : "Cooperative analytics"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
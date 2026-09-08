import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "./i18n/LanguageContext";
import Home from "./screens/Home";
import Intake from "./screens/Intake";
import Processing from "./screens/Processing";
import Result from "./screens/Result";
import History from "./screens/History";
import Dashboard from "./screens/Dashboard";
import { evaluateSampleOffline } from "./lib/offlineInference";
import { 
  saveTestLocally, 
  getAllLocalTests, 
  getUnsyncedTests, 
  markAsSynced, 
  seedLocalDataIfEmpty 
} from "./lib/db";
import { formatQRPayload } from "./lib/qr";
import { 
  Wheat, Wifi, WifiOff, History as HistoryIcon, 
  LayoutDashboard, RefreshCw, Home as HomeIcon, CheckCircle2 
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function App() {
  const { t, lang, setLang } = useLanguage();

  // Navigation state: "home" | "intake" | "processing" | "result" | "history" | "dashboard"
  const [screen, setScreen] = useState("home");
  const [returnScreen, setReturnScreen] = useState("home");

  const [initialSampleType, setInitialSampleType] = useState("feed");
  const [initialDemoId, setInitialDemoId] = useState(null);

  // Active result state
  const [activeResult, setActiveResult] = useState(null);

  // Network & Sync Queue State
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);

  const updatePendingCount = async () => {
    try {
      const unsynced = await getUnsyncedTests();
      setPendingSyncCount(unsynced.length);
      return unsynced.length;
    } catch (e) {
      console.warn("Could not check unsynced count:", e);
      return 0;
    }
  };

  // Sync queued tests to server
  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    try {
      const unsynced = await getUnsyncedTests();
      if (unsynced.length === 0) return;

      setIsSyncing(true);
      const res = await fetch(`${BACKEND_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: unsynced })
      });

      if (res.ok) {
        const data = await res.json();
        const ids = unsynced.map(t => t.id);
        await markAsSynced(ids);
        await updatePendingCount();
        setSyncToast(
          lang === "hi" 
            ? `${data.synced_count || ids.length} रिकॉर्ड क्लाउड पर सिंक हुए!` 
            : `Synced ${data.synced_count || ids.length} records to cloud!`
        );
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (err) {
      console.warn("Sync failed (will retry when online):", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Monitor network status & periodic retry
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Seed local IndexedDB on first run
    seedLocalDataIfEmpty().then(() => updatePendingCount());

    // Periodic sync check every 25 seconds when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        updatePendingCount().then((count) => {
          if (count > 0) triggerSync();
        });
      }
    }, 25000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Launch test from Home
  const handleSelectSampleType = (type) => {
    setInitialSampleType(type);
    setInitialDemoId(null);
    setScreen("intake");
  };

  const handleSelectDemoSample = (demoId) => {
    setInitialDemoId(demoId);
    setScreen("intake");
  };

  // Submit sample from Intake
  const handleSubmitSample = async (payload) => {
    setScreen("processing");

    // 1. Run client-side offline inference immediately
    let inferenceResult = evaluateSampleOffline(payload);

    // 2. If online, optionally verify/refine with FastAPI backend
    if (navigator.onLine) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(`${BACKEND_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const serverResult = await res.json();
          inferenceResult = { ...inferenceResult, ...serverResult };
        }
      } catch (e) {
        // Fallback transparently to on-device result
      }
    }

    const testId = payload.demo_sample_id || `TEST_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random()*900+100)}`;
    const fullRecord = {
      id: testId,
      farmer_name: payload.farmer_name || "Screening Sample",
      farmer_id: payload.farmer_id || "COOP-01",
      location: payload.location || "Local Farm",
      sample_type: payload.sample_type,
      feed_subtype: payload.feed_subtype,
      input_mode: payload.input_mode,
      demo_sample_id: payload.demo_sample_id,
      image_ref: payload.image_ref || null,
      moisture_pct: inferenceResult.moisture_pct,
      protein_pct: inferenceResult.protein_pct,
      fiber_pct: inferenceResult.fiber_pct,
      energy_value: inferenceResult.energy_mcal_kg,
      estimated_energy_value: inferenceResult.estimated_energy_value,
      aflatoxin_ppb: inferenceResult.aflatoxin_ppb,
      ph: inferenceResult.ph,
      adulteration_detected: inferenceResult.adulteration_detected,
      quality_status: inferenceResult.quality_status,
      confidence_score: inferenceResult.confidence_score,
      advisory: inferenceResult.advisory,
      advisory_text_en: inferenceResult.advisory.en,
      advisory_text_hi: inferenceResult.advisory.hi,
      why_this_result: inferenceResult.why_this_result,
      qr_payload: formatQRPayload({
        id: testId,
        farmer_name: payload.farmer_name,
        sample_type: payload.sample_type,
        feed_subtype: payload.feed_subtype,
        quality_status: inferenceResult.quality_status,
        adulteration_detected: inferenceResult.adulteration_detected,
        protein_pct: inferenceResult.protein_pct,
        moisture_pct: inferenceResult.moisture_pct,
        aflatoxin_ppb: inferenceResult.aflatoxin_ppb,
        ph: inferenceResult.ph
      }),
      created_at: new Date().toISOString(),
      synced: false
    };

    setActiveResult(fullRecord);
  };

  // Processing spinner finished
  const handleProcessingComplete = () => {
    setReturnScreen("home");
    setScreen("result");
  };

  // Save result to IndexedDB
  const handleSaveResult = async (record) => {
    await saveTestLocally(record);
    await updatePendingCount();

    if (navigator.onLine) {
      triggerSync();
    }
  };

  // Inspect past test from History or Dashboard
  const handleInspectPastTest = (testRecord, origin = "history") => {
    setActiveResult(testRecord);
    setReturnScreen(origin);
    setScreen("result");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            onClick={() => setScreen("home")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>PashuAahar</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {lang === "hi" ? "चारा एवं साइलेज गुणवत्ता प्रणाली" : "Feed & Silage Quality System"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync Now Button if pending */}
            {pendingSyncCount > 0 && isOnline && (
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                title="Sync offline records to cloud"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{lang === "hi" ? `सिंक (${pendingSyncCount})` : `Sync (${pendingSyncCount})`}</span>
              </button>
            )}

            {/* Online / Offline Pill */}
            <div 
              title={isOnline  ?  "Online — Cloud Synchronized" : "Offline Mode — Operating on Local Storage"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                isOnline  ?  "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {isOnline  ?  <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isOnline  ?  t("app.online") : t("app.offline")}</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en"  ?  "hi" : "en")}
              className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              {lang === "en"  ?  "🇮🇳 हिन्दी" : "🇬🇧 EN"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 mb-16">
        {screen === "home" && (
          <Home
            onSelectSampleType={handleSelectSampleType}
            onSelectDemoSample={handleSelectDemoSample}
            onNavigate={(dest) => setScreen(dest)}
            isOnline={isOnline}
            pendingSyncCount={pendingSyncCount}
          />
        )}

        {screen === "intake" && (
          <Intake
            initialSampleType={initialSampleType}
            initialDemoId={initialDemoId}
            onBack={() => setScreen("home")}
            onSubmit={handleSubmitSample}
          />
        )}

        {screen === "processing" && (
          <Processing onComplete={handleProcessingComplete} />
        )}

        {screen === "result" && (
          <Result
            result={activeResult}
            onSave={handleSaveResult}
            onNewTest={() => setScreen("home")}
            onBack={() => setScreen(returnScreen)}
          />
        )}

        {screen === "history" && (
          <History
            onSelectTest={(rec) => handleInspectPastTest(rec, "history")}
            onBack={() => setScreen("home")}
            isOnline={isOnline}
            onSyncComplete={updatePendingCount}
          />
        )}

        {screen === "dashboard" && (
          <Dashboard
            onBack={() => setScreen("home")}
            onSelectTest={(rec) => handleInspectPastTest(rec, "dashboard")}
            isOnline={isOnline}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 z-40 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setScreen("home")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              screen === "home" || screen === "intake" || screen === "processing"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[11px]">{t("nav.home")}</span>
          </button>

          <button
            onClick={() => setScreen("history")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              screen === "history"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <HistoryIcon className="w-5 h-5" />
            <span className="text-[11px]">{t("nav.history")}</span>
            {pendingSyncCount > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setScreen("dashboard")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              screen === "dashboard"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[11px]">{t("nav.dashboard")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
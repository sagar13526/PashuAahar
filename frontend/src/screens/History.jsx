import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { getAllLocalTests, markAsSynced, getUnsyncedTests } from "../lib/db";
import { 
  History as HistoryIcon, Search, Cloud, CloudOff, RefreshCw, 
  ArrowLeft, CheckCircle2, AlertTriangle, AlertOctagon, XCircle, 
  ChevronRight, Sparkles, Filter, Check
} from "lucide-react";

export default function History({ onSelectTest, onBack, isOnline, onSyncComplete }) {
  const { t, lang } = useLanguage();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState("");

  const loadTests = async () => {
    setLoading(true);
    try {
      const items = await getAllLocalTests();
      setTests(items);
    } catch (e) {
      console.error("Failed to load local tests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleManualSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    setSyncSuccessMsg("");
    try {
      const unsynced = await getUnsyncedTests();
      if (unsynced.length === 0) {
        setSyncSuccessMsg("No pending records to sync.");
        setTimeout(() => setSyncSuccessMsg(""), 3000);
        return;
      }

      const res = await fetch("https://pashuaahar-api.onrender.com/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: unsynced })
      });

      if (res.ok) {
        const ids = unsynced.map(x => x.id);
        await markAsSynced(ids);
        await loadTests();
        if (onSyncComplete) onSyncComplete();
        setSyncSuccessMsg(t("history.syncedSuccess"));
        setTimeout(() => setSyncSuccessMsg(""), 4000);
      } else {
        setSyncSuccessMsg("Sync failed (Server responded with error).");
      }
    } catch (err) {
      setSyncSuccessMsg("Sync failed (Server offline or unreachable).");
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter & Search
  const filteredTests = tests.filter(test => {
    const matchesSearch = 
      (test.farmer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.adulteration_detected || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "ALL"  ?  true : 
      (statusFilter === "UNSYNCED"  ?  !test.synced : test.quality_status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const unsyncedCount = tests.filter(t => !t.synced).length;

  const statusBadges = {
    Good: { bg: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
    Moderate: { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle },
    Poor: { bg: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertOctagon },
    Unsafe: { bg: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "मुख्य पृष्ठ" : "Back to Home"}</span>
        </button>

        {unsyncedCount > 0 ? (
          <button
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all ${
              isOnline 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? t("history.syncing") : `${t("history.syncAll")} (${unsyncedCount})`}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === "hi" ? "सभी सिंक" : "All Synced"}</span>
          </div>
        )}
      </div>

      {/* Sync Notification Banner */}
      {syncSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Title & Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-emerald-600" />
              <span>{t("history.title")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t("history.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                {lang === "hi" ? "कुल रिकॉर्ड" : "Total Records"}
              </div>
              <div className="text-base font-black text-slate-800 font-mono">{tests.length}</div>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                {lang === "hi" ? "सिंक बाकी" : "Unsynced"}
              </div>
              <div className={`text-base font-black font-mono ${unsyncedCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {unsyncedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("history.search")}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {[
            { id: "ALL", label: lang === "hi" ? "सभी" : "All" },
            { id: "Good", label: "Good" },
            { id: "Moderate", label: "Moderate" },
            { id: "Poor", label: "Poor" },
            { id: "Unsafe", label: "Unsafe" },
            { id: "UNSYNCED", label: lang === "hi" ? `सिंक प्रतीक्षित (${unsyncedCount})` : `Pending Sync (${unsyncedCount})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {lang === "hi" ? "सुरक्षित टेस्ट लोड हो रहे हैं..." : "Loading stored tests..."}
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <HistoryIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">{t("history.empty")}</p>
          </div>
        ) : (
          filteredTests.map((tItem) => {
            const badge = statusBadges[tItem.quality_status] || statusBadges.Good;
            const Icon = badge.icon;
            return (
              <div
                key={tItem.id}
                onClick={() => onSelectTest(tItem)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${badge.bg}`}>
                      <Icon className="w-3 h-3" />
                      <span>{tItem.quality_status}</span>
                    </span>

                    <span className="text-xs font-black text-slate-800 font-mono">
                      {tItem.id}
                    </span>

                    {Boolean(tItem.id?.startsWith("F00") || tItem.id?.includes("DEMO")) && (
                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded shrink-0">
                        {lang === "hi" ? "मानक डेमो बीज" : "Official Seed"}
                      </span>
                    )}

                    {tItem.synced ? (
                      <span title="Synced with Cloud" className="text-emerald-600 flex items-center gap-0.5 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        <Cloud className="w-3 h-3" />
                        <span className="hidden sm:inline">{lang === "hi" ? "सिंक हुआ" : "Synced"}</span>
                      </span>
                    ) : (
                      <span title="Pending Sync" className="text-amber-600 flex items-center gap-0.5 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                        <CloudOff className="w-3 h-3" />
                        <span className="hidden sm:inline">{lang === "hi" ? "बाकी" : "Pending"}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-800 truncate">
                    {tItem.farmer_name || "Demo Screening"} • {tItem.location || "Village"}
                  </div>

                  {/* Metrics preview */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <span className="capitalize font-semibold text-slate-700">
                      {tItem.sample_type} {tItem.feed_subtype ? `(${tItem.feed_subtype})` : ""}
                    </span>
                    <span>•</span>
                    <span>Moisture: <b className="text-slate-700 font-mono">{tItem.moisture_pct}%</b></span>
                    {tItem.protein_pct !== null && (
                      <>
                        <span>•</span>
                        <span>CP: <b className="text-slate-700 font-mono">{tItem.protein_pct}%</b></span>
                      </>
                    )}
                    <span>•</span>
                    <span>Aflatoxin: <b className={`font-mono ${tItem.aflatoxin_ppb > 15 ? "text-rose-600 font-bold" : "text-slate-700"}`}>{tItem.aflatoxin_ppb} ppb</b></span>
                    {tItem.ph && (
                      <>
                        <span>•</span>
                        <span>pH: <b className="text-slate-700 font-mono">{tItem.ph}</b></span>
                      </>
                    )}
                  </div>

                  {tItem.adulteration_detected && tItem.adulteration_detected !== "None" && (
                    <div className="inline-block text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                      {lang === "hi" ? "मिलावट: " : "Flagged: "}{tItem.adulteration_detected}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1 text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <span className="text-xs font-bold hidden sm:inline">{lang === "hi" ? "विवरण" : "Inspect"}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

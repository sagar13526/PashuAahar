import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title 
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { 
  LayoutDashboard, RefreshCw, Filter, ArrowLeft, 
  TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, 
  XCircle, AlertOctagon, Download, Search
} from "lucide-react";

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title
);

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Dashboard({ onBack, onSelectTest, isOnline }) {
  const { t, lang } = useLanguage();

  const [summary, setSummary] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [farmerFilter, setFarmerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchData = async () => {
    try {
      setRefreshing(true);
      // 1. Fetch Aggregates
      const sumRes = await fetch(`${BACKEND_URL}/dashboard/summary`);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      // 2. Fetch Filtered Tests
      let url = `${BACKEND_URL}/tests?`;
      const params = new URLSearchParams();
      if (farmerFilter) params.append("farmer_id", farmerFilter);
      if (statusFilter) params.append("quality_status", statusFilter);
      if (typeFilter) params.append("sample_type", typeFilter);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const testsRes = await fetch(`${BACKEND_URL}/tests?${params.toString()}`);
      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setTests(testsData.tests || []);
      }
    } catch (e) {
      console.warn("Could not fetch server dashboard data, using fallback:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [farmerFilter, statusFilter, typeFilter, fromDate, toDate]);

  const handleResetFilters = () => {
    setFarmerFilter("");
    setStatusFilter("");
    setTypeFilter("");
    setFromDate("");
    setToDate("");
  };

  // Safe Pass Rate Calculation
  const total = summary?.total_tests || tests.length || 1;
  const goodCount = summary?.by_quality_status?.Good || 0;
  const passRate = Math.round((goodCount / total) * 100);
  const contaminatedCount = total - (summary?.by_adulteration?.None || 0);
  const contaminationRate = Math.round((contaminatedCount / total) * 100);

  // --- Chart 1: Quality Doughnut ---
  const qualityData = {
    labels: ["Good", "Moderate", "Poor", "Unsafe"],
    datasets: [
      {
        data: [
          summary?.by_quality_status?.Good || 0,
          summary?.by_quality_status?.Moderate || 0,
          summary?.by_quality_status?.Poor || 0,
          summary?.by_quality_status?.Unsafe || 0
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }
    ]
  };

  // --- Chart 2: Contamination Bar ---
  const adultLabels = Object.keys(summary?.by_adulteration || { None: 5 });
  const adultValues = Object.values(summary?.by_adulteration || { None: 5 });

  const contaminationData = {
    labels: adultLabels,
    datasets: [
      {
        label: "Detected Samples",
        data: adultValues,
        backgroundColor: adultLabels.map(l => l === "None"  ?  "#10b981" : "#f43f5e"),
        borderRadius: 6
      }
    ]
  };

  // --- Chart 3: Timeline Trends ---
  const timeline = summary?.timeline || [];
  const lineData = {
    labels: timeline.map(item => item.created_at  ?  item.created_at.slice(5, 10) : ""),
    datasets: [
      {
        label: "Crude Protein %",
        data: timeline.map(item => item.protein_pct || null),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        pointRadius: 4
      },
      {
        label: "Moisture %",
        data: timeline.map(item => item.moisture_pct || null),
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        tension: 0.3,
        pointRadius: 4
      },
      {
        label: "Aflatoxin (ppb)",
        data: timeline.map(item => item.aflatoxin_ppb || null),
        borderColor: "#ef4444",
        borderDash: [4, 4],
        pointRadius: 3
      }
    ]
  };

  const statusColors = {
    Good: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Moderate: "bg-amber-100 text-amber-800 border-amber-200",
    Poor: "bg-orange-100 text-orange-800 border-orange-200",
    Unsafe: "bg-rose-100 text-rose-800 border-rose-200"
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "मुख्य पृष्ठ" : "Back to App"}</span>
        </button>

        <button
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs cursor-pointer active:scale-98"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? "animate-spin" : ""}`} />
          <span>{t("dashboard.refresh")}</span>
        </button>
      </div>

      {/* Dashboard Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === "hi" ? "सहकारी गुणवत्ता निगरानी पोर्टल" : "Cooperative Quality Surveillance Portal"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {t("dashboard.subtitle")}
            </p>
          </div>

          <div className="text-right bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm border border-white/10 self-start sm:self-auto">
            <div className="text-[10px] text-slate-300 font-bold uppercase">
              {lang === "hi" ? "कुल जाँचे गए नमूने" : "Total Feed Samples"}
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">{summary?.total_tests || tests.length}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("dashboard.passRate")}</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{passRate}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {lang === "hi" ? "Grade A (Good) गुणवत्ता" : "Grade A (Good) quality"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("dashboard.contaminationRate")}</div>
          <div className={`text-2xl font-black font-mono mt-1 ${contaminationRate > 15 ? "text-rose-600" : "text-amber-600"}`}>
            {contaminationRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {lang === "hi" ? "चिह्नित मिलावट/खराबी" : "Flagged anomalies"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("dashboard.avgProtein")}</div>
          <div className="text-2xl font-black text-slate-800 font-mono mt-1">
            {summary?.averages?.avg_protein ?? 16.5}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {lang === "hi" ? "औसत कच्चा प्रोटीन (CP)" : "Crude protein mean"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("dashboard.avgMoisture")}</div>
          <div className="text-2xl font-black text-slate-800 font-mono mt-1">
            {summary?.averages?.avg_moisture ?? 32.0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {lang === "hi" ? "चारा एवं साइलेज दोनों" : "Across feed & silage"}
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Chart 1: Quality Doughnut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t("dashboard.qualityChart")}</span>
          </h3>
          <div className="h-56 flex items-center justify-center">
            <Doughnut 
              data={qualityData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } } 
              }} 
            />
          </div>
        </div>

        {/* Chart 2: Contamination Types */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{t("dashboard.contaminationChart")}</span>
          </h3>
          <div className="h-56">
            <Bar 
              data={contaminationData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { font: { size: 10 } } },
                  y: { beginAtZero: true, ticks: { precision: 0 } }
                }
              }} 
            />
          </div>
        </div>

        {/* Chart 3: Trends Line Chart (Spans full width) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:col-span-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{t("dashboard.timelineChart")}</span>
          </h3>
          <div className="h-60">
            <Line 
              data={lineData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } } },
                scales: {
                  y: { beginAtZero: true }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>{lang === "hi" ? "निगरानी रजिस्टर फ़िल्टर करें" : "Filter Surveillance Registry"}</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
          >
            {t("dashboard.resetFilters")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Farmer */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("dashboard.filterFarmer")}</label>
            <input
              type="text"
              value={farmerFilter}
              onChange={(e) => setFarmerFilter(e.target.value)}
              placeholder="e.g. Ramesh / COOP-01"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quality */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("dashboard.filterStatus")}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{lang === "hi" ? "सभी स्थितियाँ" : "All Statuses"}</option>
              <option value="Good">Good</option>
              <option value="Moderate">Moderate</option>
              <option value="Poor">Poor</option>
              <option value="Unsafe">Unsafe</option>
            </select>
          </div>

          {/* Sample Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("dashboard.filterType")}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{lang === "hi" ? "सभी प्रकार" : "All Types"}</option>
              <option value="feed">{lang === "hi" ? "सूखा चारा / दाना (Feed)" : "Feed / Concentrate"}</option>
              <option value="silage">{lang === "hi" ? "साइलेज हरा चारा (Silage)" : "Silage Fodder"}</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("dashboard.dateFrom")}</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t("dashboard.tableTitle")} ({tests.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {lang === "hi" ? "केंद्रीय डेटाबेस रिकॉर्ड" : "Central Database Records"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Sample ID</th>
                <th className="py-3 px-4">{lang === "hi" ? "किसान / समिति" : "Farmer / Society"}</th>
                <th className="py-3 px-4">{lang === "hi" ? "प्रकार" : "Type"}</th>
                <th className="py-3 px-4">{lang === "hi" ? "गुणवत्ता स्तर" : "Quality Status"}</th>
                <th className="py-3 px-4">{lang === "hi" ? "मिलावट" : "Adulteration"}</th>
                <th className="py-3 px-4">CP %</th>
                <th className="py-3 px-4">Moisture %</th>
                <th className="py-3 px-4">Aflatoxin</th>
                <th className="py-3 px-4">{lang === "hi" ? "दिनांक" : "Date"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {lang === "hi" ? "फ़िल्टर के अनुसार कोई रिकॉर्ड नहीं मिला।" : "No screening records matching filters."}
                  </td>
                </tr>
              ) : (
                tests.map((row) => (
                  <tr 
                    key={row.id} 
                    onClick={() => onSelectTest && onSelectTest(row)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{row.id}</span>
                        {Boolean(row.id?.startsWith("F00") || row.id?.includes("DEMO")) && (
                          <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded shrink-0">
                            {lang === "hi" ? "मानक बीज" : "Official Seed"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{row.farmer_name || "Demo Screening"}</div>
                      <div className="text-[10px] text-slate-400">{row.farmer_id || row.location || ""}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">
                      {row.sample_type} {row.feed_subtype  ?  `(${row.feed_subtype})` : ""}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusColors[row.quality_status] || "bg-slate-100"}`}>
                        {row.quality_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold ${
                        row.adulteration_detected && row.adulteration_detected !== "None" 
                          ? "text-rose-600 font-bold" 
                          : "text-slate-500"
                      }`}>
                        {row.adulteration_detected && row.adulteration_detected !== "None" ? row.adulteration_detected : (lang === "hi" ? "कोई नहीं" : "None")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {row.protein_pct !== null && row.protein_pct !== undefined  ?  `${row.protein_pct}%` : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {row.moisture_pct}%
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={row.aflatoxin_ppb > 15  ?  "text-rose-600 font-bold" : "text-slate-700"}>
                        {row.aflatoxin_ppb ?? 0} ppb
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {row.created_at  ?  row.created_at.slice(0, 10) : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
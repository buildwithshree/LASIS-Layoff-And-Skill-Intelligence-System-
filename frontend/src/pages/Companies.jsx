import { useState, useEffect } from "react";
import api from "../services/api";

const riskConfig = {
  critical: { label: "Critical", bg: "bg-red-100",   text: "text-red-900",   dot: "bg-red-600"   },
  high:     { label: "High",     bg: "bg-red-50",    text: "text-red-700",   dot: "bg-red-400"   },
  medium:   { label: "Medium",   bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-400" },
  low:      { label: "Low",      bg: "bg-green-50",  text: "text-green-700", dot: "bg-green-500" },
};

function RiskBadge({ level }) {
  const cfg = riskConfig[level?.toLowerCase()] || riskConfig.low;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [risks, setRisks]         = useState({});
  const [mlScores, setMlScores]   = useState({});
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [compRes, riskRes] = await Promise.all([
        api.get("/companies"),
        api.get("/risk/all"),
      ]);

      const companyList = compRes.data.data || [];
      setCompanies(companyList);

      const riskMap = {};
      (riskRes.data.data || []).forEach((r) => {
        riskMap[r.companyId] = r;
      });
      setRisks(riskMap);

      companyList.forEach((c) => fireMlPrediction(c));
    } catch (err) {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  async function fireMlPrediction(company) {
    try {
      const res = await api.post("/ml/predict-risk", {
        total_laid_off: 500,
        funds_raised: company.fundsRaised || 100,
        industry: company.sector || "Tech",
        stage: company.fundingStage || "Series B",
        country: "United States",
      });
      setMlScores((prev) => ({
        ...prev,
        [company.companyId]: res.data.data,
      }));
    } catch (_) {
      // ML service down — graceful degradation
    }
  }

  const filtered = companies.filter((c) => {
    const risk  = risks[c.companyId];
    const level = risk?.riskLevel?.toLowerCase() || "low";
    const matchesFilter = filter === "all" || level === filter;
    const matchesSearch = c.companyName?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading companies...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Company Risk Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time layoff risk assessment powered by ML
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-teal-500"
        />
        <div className="flex gap-2">
          {["all", "low", "medium", "high", "critical"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Company list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-12">
            No companies found.
          </div>
        )}

        {filtered.map((company) => {
          const risk     = risks[company.companyId];
          const ml       = mlScores[company.companyId];
          const level    = risk?.riskLevel?.toLowerCase() || "low";
          const isOpen   = selected?.companyId === company.companyId;

          return (
            <div
              key={company.companyId}
              onClick={() => setSelected(isOpen ? null : company)}
              className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-teal-300 transition-all"
            >
              {/* Summary row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                    {company.companyName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.companyName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {company.sector} · {company.fundingStage || "—"} · {company.headquarters || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Risk index</p>
                    <p className="text-sm font-medium text-gray-800">
                      {risk?.riskIndex != null ? Number(risk.riskIndex).toFixed(1) : "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">ML prediction</p>
                    <p className="text-sm font-medium text-gray-800">
                      {ml?.predicted_layoff_percentage != null
                        ? `${(ml.predicted_layoff_percentage * 100).toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>

                  <RiskBadge level={level} />

                  <span className="text-xs text-gray-300">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400">Sector</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{company.sector || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400">Funding stage</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{company.fundingStage || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400">Layoff frequency</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {risk?.layoffFrequency != null ? risk.layoffFrequency : "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400">Automation score</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {risk?.automationScore != null ? risk.automationScore : "—"}
                    </p>
                  </div>

                  {ml && (
                    <div className="col-span-2 lg:col-span-4 bg-teal-50 border border-teal-100 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-2">ML risk assessment</p>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-700">
                          Predicted layoff rate:
                          <span className="font-medium text-teal-700 ml-1">
                            {(ml.predicted_layoff_percentage * 100).toFixed(1)}%
                          </span>
                        </p>
                        <RiskBadge level={ml.risk_level} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
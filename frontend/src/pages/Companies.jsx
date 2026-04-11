import { useState, useEffect } from "react";
import api from "../services/api";

const riskConfig = {
  critical: { label: "Critical", bg: "bg-red-100",   text: "text-red-900",   dot: "bg-red-600"   },
  high:     { label: "High",     bg: "bg-red-50",    text: "text-red-700",   dot: "bg-red-400"   },
  medium:   { label: "Medium",   bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-400" },
  low:      { label: "Low",      bg: "bg-green-50",  text: "text-green-700", dot: "bg-green-500" },
};

// Derive estimated total_laid_off from layoff frequency and company type
function estimateLaidOff(risk, company) {
  if (!risk) return 200;
  const freq = Number(risk.layoffFrequency) || 0;
  const baseByStage = {
    "Public":   5000,
    "Series D": 2000,
    "Series C": 1000,
    "Series B": 500,
    "Series A": 200,
    "Seed":     50,
    "Private":  3000,
  };
  const base = baseByStage[company.fundingStage] || 500;
  return Math.round(base * (freq / 10));
}

// Derive estimated funds raised from funding stage
function estimateFundsRaised(company) {
  const fundsByStage = {
    "Public":   10000,
    "Series D": 500,
    "Series C": 200,
    "Series B": 80,
    "Series A": 25,
    "Seed":     5,
    "Private":  1000,
  };
  return fundsByStage[company.fundingStage] || 100;
}

// Parse country from headquarters string
function parseCountry(headquarters) {
  if (!headquarters) return "United States";
  const hq = headquarters.toLowerCase();
  if (hq.includes("india") || hq.includes("bangalore") ||
      hq.includes("mumbai") || hq.includes("delhi") ||
      hq.includes("hyderabad") || hq.includes("pune") ||
      hq.includes("chennai")) return "India";
  if (hq.includes("uk") || hq.includes("london") ||
      hq.includes("england")) return "United Kingdom";
  if (hq.includes("germany") || hq.includes("berlin") ||
      hq.includes("munich")) return "Germany";
  if (hq.includes("canada") || hq.includes("toronto") ||
      hq.includes("vancouver")) return "Canada";
  if (hq.includes("singapore")) return "Singapore";
  if (hq.includes("australia") || hq.includes("sydney") ||
      hq.includes("melbourne")) return "Australia";
  return "United States";
}

// Map sector to ML model's expected industry labels
function mapSectorToIndustry(sector) {
  if (!sector) return "Other";
  const s = sector.toLowerCase();
  if (s.includes("tech") || s.includes("software") ||
      s.includes("saas")) return "Technology";
  if (s.includes("finance") || s.includes("fintech") ||
      s.includes("banking") || s.includes("crm")) return "Finance";
  if (s.includes("health") || s.includes("medical") ||
      s.includes("pharma") || s.includes("biotech")) return "Healthcare";
  if (s.includes("retail") || s.includes("ecommerce") ||
      s.includes("commerce")) return "Retail";
  if (s.includes("media") || s.includes("entertainment") ||
      s.includes("streaming")) return "Media";
  if (s.includes("transport") || s.includes("logistics") ||
      s.includes("delivery")) return "Transportation";
  if (s.includes("food") || s.includes("restaurant") ||
      s.includes("hospitality")) return "Food";
  if (s.includes("real estate") || s.includes("property")) return "Real Estate";
  if (s.includes("education") || s.includes("edtech")) return "Education";
  if (s.includes("energy") || s.includes("oil") ||
      s.includes("renewable")) return "Energy";
  return "Other";
}

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

      // Fire ML prediction for each company using real derived inputs
      companyList.forEach((c) => {
        const risk = riskMap[c.companyId];
        fireMlPrediction(c, risk);
      });
    } catch (err) {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  async function fireMlPrediction(company, risk) {
    try {
      const totalLaidOff  = estimateLaidOff(risk, company);
      const fundsRaised   = estimateFundsRaised(company);
      const industry      = mapSectorToIndustry(company.sector);
      const country       = parseCountry(company.headquarters);
      const stage         = company.fundingStage || "Series B";

      const res = await api.post("/ml/predict-risk", {
        total_laid_off: totalLaidOff,
        funds_raised:   fundsRaised,
        industry:       industry,
        stage:          stage,
        country:        country,
      });

      setMlScores((prev) => ({
        ...prev,
        [company.companyId]: {
          ...res.data.data,
          _inputs: {
            totalLaidOff,
            fundsRaised,
            industry,
            country,
            stage,
          },
        },
      }));
    } catch (_) {
      // ML service down — graceful degradation, show — in UI
    }
  }

  const filtered = companies.filter((c) => {
    const risk  = risks[c.companyId];
    const ml    = mlScores[c.companyId];
    // For filtering: prefer ML risk level, fall back to DB risk level
    const mlLevel = ml?.risk_level?.toLowerCase();
    const dbLevel = risk?.riskLevel?.toLowerCase() || "low";
    const level = mlLevel || dbLevel;
    const matchesFilter = filter === "all" || level === filter;
    const matchesSearch = c.companyName?.toLowerCase().includes(
      search.toLowerCase()
    );
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
        <h1 className="text-xl font-medium text-gray-900">
          Company Risk Intelligence
        </h1>
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
          const risk    = risks[company.companyId];
          const ml      = mlScores[company.companyId];
          const dbLevel = risk?.riskLevel?.toLowerCase() || "low";

          // ✅ THE FIX: badge in list view uses ML risk_level when available,
          // falls back to DB riskLevel only while ML is still loading
          const badgeLevel = ml?.risk_level?.toLowerCase() || dbLevel;

          const isOpen  = selected?.companyId === company.companyId;

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
                    <p className="text-sm font-medium text-gray-900">
                      {company.companyName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {company.sector} · {company.fundingStage || "—"} ·{" "}
                      {company.headquarters || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Risk index</p>
                    <p className="text-sm font-medium text-gray-800">
                      {risk?.riskIndex != null
                        ? Number(risk.riskIndex).toFixed(1)
                        : "—"}
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

                  {/* ✅ FIXED: now shows ML risk level, not DB risk level */}
                  <RiskBadge level={badgeLevel} />

                  <span className="text-xs text-gray-300">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* Risk profile metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-400">Sector</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        {company.sector || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-400">Funding stage</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        {company.fundingStage || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-400">Layoff frequency</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        {risk?.layoffFrequency != null
                          ? risk.layoffFrequency
                          : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-400">Automation score</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        {risk?.automationScore != null
                          ? risk.automationScore
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* ML assessment panel */}
                  {ml ? (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-3">
                        ML risk assessment — inputs derived from company profile
                      </p>
                      <div className="flex items-center gap-4 mb-3">
                        <p className="text-sm text-gray-700">
                          Predicted layoff rate:
                          <span className="font-medium text-teal-700 ml-1">
                            {(ml.predicted_layoff_percentage * 100).toFixed(1)}%
                          </span>
                        </p>
                        <RiskBadge level={ml.risk_level} />
                      </div>
                      {ml._inputs && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-2">
                          <div className="bg-white rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Industry</p>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">
                              {ml._inputs.industry}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Stage</p>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">
                              {ml._inputs.stage}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Country</p>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">
                              {ml._inputs.country}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Est. laid off</p>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">
                              {ml._inputs.totalLaidOff.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Est. funds</p>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">
                              ${ml._inputs.fundsRaised}M
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                      <p className="text-xs text-gray-400">
                        ML assessment loading or unavailable.
                        Ensure Python ML server is running on port 5000.
                      </p>
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
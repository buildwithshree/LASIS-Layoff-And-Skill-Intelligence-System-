import { useState, useEffect } from "react";
import api from "../services/api";

const SIGNAL_TYPES = [
  "LAYOFF", "HIRING_FREEZE", "FUNDING_CUT",
  "BANKRUPTCY_RISK", "RAPID_GROWTH", "NEW_FUNDING",
];

const signalTypeColors = {
  LAYOFF:          { bg: "bg-red-50",    text: "text-red-700"    },
  HIRING_FREEZE:   { bg: "bg-amber-50",  text: "text-amber-700"  },
  FUNDING_CUT:     { bg: "bg-orange-50", text: "text-orange-700" },
  BANKRUPTCY_RISK: { bg: "bg-red-100",   text: "text-red-900"    },
  RAPID_GROWTH:    { bg: "bg-green-50",  text: "text-green-700"  },
  NEW_FUNDING:     { bg: "bg-teal-50",   text: "text-teal-700"   },
};

function SignalBadge({ type }) {
  const cfg = signalTypeColors[type] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

export default function LiveFeed() {
  const [companies, setCompanies]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [manualForm, setManualForm]       = useState({
    companyId: "", signalType: "LAYOFF", headline: "",
    signalSource: "", severityScore: "5",
    affectedCount: "0", signalDate: new Date().toISOString().split("T")[0],
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess]       = useState(null);
  const [manualError, setManualError]           = useState(null);
  const [scrapeCompanyId, setScrapeCompanyId]   = useState("");
  const [scrapeApiKey, setScrapeApiKey]         = useState("");
  const [scraping, setScraping]                 = useState(false);
  const [scrapeResults, setScrapeResults]       = useState([]);
  const [scrapeError, setScrapeError]           = useState(null);
  const [savingSignals, setSavingSignals]       = useState({});
  const [savedSignals, setSavedSignals]         = useState({});

  useEffect(() => {
    api.get("/companies")
      .then((r) => setCompanies(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleManualField(e) {
    setManualForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submitManualSignal(e) {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);
    if (!manualForm.companyId) { setManualError("Please select a company."); return; }
    if (!manualForm.headline.trim()) { setManualError("Headline is required."); return; }
    const severity = parseFloat(manualForm.severityScore);
    if (isNaN(severity) || severity < 1 || severity > 10) {
      setManualError("Severity must be between 1 and 10."); return;
    }
    setManualSubmitting(true);
    try {
      await api.post(`/risk/signal/${manualForm.companyId}`, {
        signalType:    manualForm.signalType,
        headline:      manualForm.headline.trim(),
        signalSource:  manualForm.signalSource.trim() || null,
        severityScore: severity,
        affectedCount: parseInt(manualForm.affectedCount) || 0,
        signalDate:    manualForm.signalDate,
        isVerified:    true,
      });
      await api.get(`/risk/recalculate/${manualForm.companyId}`);
      const company = companies.find((c) => c.companyId === Number(manualForm.companyId));
      setManualSuccess(`Signal added and risk recalculated for ${company?.companyName || "company"}.`);
      setManualForm((prev) => ({
        ...prev, headline: "", signalSource: "",
        severityScore: "5", affectedCount: "0",
        signalDate: new Date().toISOString().split("T")[0],
      }));
    } catch (err) {
      setManualError(err.response?.data?.message || "Failed to save signal.");
    } finally {
      setManualSubmitting(false);
    }
  }

  async function runNewsScraper() {
    setScrapeError(null);
    setScrapeResults([]);
    setSavedSignals({});
    if (!scrapeCompanyId) { setScrapeError("Please select a company."); return; }
    const company = companies.find((c) => c.companyId === Number(scrapeCompanyId));
    if (!company) return;
    setScraping(true);
    try {
      const res = await api.post("/ml/scrape-news", {
        company_name: company.companyName,
        api_key: scrapeApiKey.trim() || undefined,
      });
      const data = res.data;
      if (data.success) {
        setScrapeResults(data.signals || []);
        if ((data.signals || []).length === 0) {
          setScrapeError(`No layoff signals found for ${company.companyName} in the last 30 days.`);
        }
      } else {
        setScrapeError(data.message || "Scraper returned no results.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("timed out")) setScrapeError("News API timed out. Check your internet connection.");
      else if (msg.includes("Cannot reach")) setScrapeError("Cannot reach news API.");
      else setScrapeError("Failed to scrape. Get a free API key at gnews.io and enter it above.");
    } finally {
      setScraping(false);
    }
  }

  async function saveScrapedSignal(signal, index) {
    setSavingSignals((prev) => ({ ...prev, [index]: true }));
    try {
      await api.post(`/risk/signal/${scrapeCompanyId}`, {
        signalType:    signal.signalType,
        headline:      signal.headline,
        signalSource:  signal.signalSource,
        severityScore: signal.severityScore,
        affectedCount: signal.affectedCount,
        signalDate:    signal.signalDate,
        isVerified:    false,
      });
      await api.get(`/risk/recalculate/${scrapeCompanyId}`);
      setSavedSignals((prev) => ({ ...prev, [index]: true }));
    } catch (err) {
      setScrapeError(err.response?.data?.message || "Failed to save signal.");
    } finally {
      setSavingSignals((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function saveAllScrapedSignals() {
    for (let i = 0; i < scrapeResults.length; i++) {
      if (!savedSignals[i]) await saveScrapedSignal(scrapeResults[i], i);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-medium text-gray-900">Live risk feed</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add layoff signals manually or scrape live news to update company risk scores in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual signal entry */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-800 mb-1">Add signal manually</h2>
          <p className="text-xs text-gray-400 mb-5">
            Add a layoff signal from a news article. Risk score recalculates automatically.
          </p>
          {manualSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              {manualSuccess}
            </div>
          )}
          {manualError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {manualError}
            </div>
          )}
          <form onSubmit={submitManualSignal} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Company <span className="text-red-500">*</span></label>
              <select name="companyId" value={manualForm.companyId} onChange={handleManualField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white">
                <option value="">Select company</option>
                {companies.map((c) => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Signal type <span className="text-red-500">*</span></label>
              <select name="signalType" value={manualForm.signalType} onChange={handleManualField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white">
                {SIGNAL_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Headline <span className="text-red-500">*</span></label>
              <input name="headline" value={manualForm.headline} onChange={handleManualField}
                placeholder="e.g. Google lays off 12,000 employees"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Source URL (optional)</label>
              <input name="signalSource" value={manualForm.signalSource} onChange={handleManualField}
                placeholder="https://techcrunch.com/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Severity (1–10)</label>
                <input name="severityScore" type="number" min="1" max="10" step="0.1"
                  value={manualForm.severityScore} onChange={handleManualField}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Affected</label>
                <input name="affectedCount" type="number" min="0"
                  value={manualForm.affectedCount} onChange={handleManualField}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date</label>
                <input name="signalDate" type="date" value={manualForm.signalDate} onChange={handleManualField}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
              </div>
            </div>
            <button type="submit" disabled={manualSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
              {manualSubmitting ? "Saving and recalculating..." : "Add signal + recalculate risk"}
            </button>
          </form>
        </div>

        {/* News scraper */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-800 mb-1">Scrape live news</h2>
          <p className="text-xs text-gray-400 mb-5">
            Pulls latest layoff headlines from GNews. Get free API key at{" "}
            <a href="https://gnews.io" target="_blank" rel="noreferrer"
              className="text-teal-600 underline" onClick={(e) => e.stopPropagation()}>
              gnews.io
            </a>{" "}(100 requests/day free).
          </p>
          <div className="space-y-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Company to scrape <span className="text-red-500">*</span></label>
              <select value={scrapeCompanyId}
                onChange={(e) => { setScrapeCompanyId(e.target.value); setScrapeResults([]); setScrapeError(null); setSavedSignals({}); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white">
                <option value="">Select company</option>
                {companies.map((c) => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">GNews API key (optional)</label>
              <input type="text" value={scrapeApiKey} onChange={(e) => setScrapeApiKey(e.target.value)}
                placeholder="Your GNews API key"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
              <p className="text-xs text-gray-400 mt-1">Without a key results may be limited.</p>
            </div>
            <button onClick={runNewsScraper} disabled={scraping}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
              {scraping ? "Scraping news..." : "Scrape latest news"}
            </button>
          </div>
          {scrapeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{scrapeError}</div>
          )}
          {scrapeResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{scrapeResults.length} signal{scrapeResults.length > 1 ? "s" : ""} found</p>
                <button onClick={saveAllScrapedSignals}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 underline">
                  Save all + recalculate
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {scrapeResults.map((signal, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs text-gray-800 font-medium leading-snug flex-1">{signal.headline}</p>
                      {savedSignals[idx]
                        ? <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Saved</span>
                        : <button onClick={() => saveScrapedSignal(signal, idx)} disabled={savingSignals[idx]}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex-shrink-0 disabled:opacity-50">
                            {savingSignals[idx] ? "Saving..." : "Save"}
                          </button>
                      }
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <SignalBadge type={signal.signalType} />
                      <span className="text-xs text-gray-400">Severity: {signal.severityScore}/10</span>
                      {signal.affectedCount > 0 && (
                        <span className="text-xs text-gray-400">{signal.affectedCount.toLocaleString()} affected</span>
                      )}
                      <span className="text-xs text-gray-400">{signal.signalDate}</span>
                    </div>
                    {signal.signalSource && (
                      <a href={signal.signalSource} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-teal-600 hover:underline mt-1 block truncate">
                        {signal.signalSource}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
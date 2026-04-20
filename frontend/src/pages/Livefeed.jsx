import { useState, useEffect } from "react";
import api from "../services/api";

export default function LiveFeed() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/companies")
      .then((res) => setCompanies(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Live risk feed</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manual signal entry and GNews news scraper — full rebuild coming in Phase 22a restoration.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* manual signal panel placeholder */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Manual signal entry</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="animate-pulse h-8 bg-gray-100 rounded-lg" />)}
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Company</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 mb-4">
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                ))}
              </select>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                Full signal entry form (type, severity, headline, source, affected count) coming in Phase 22a restoration.
              </div>
            </div>
          )}
        </div>

        {/* news scraper panel placeholder */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">GNews scraper</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
            GNews API integration with auto-signal detection coming in Phase 22a restoration.
            Get your free API key at gnews.io (100 requests/day).
          </div>
        </div>
      </div>
    </div>
  );
}
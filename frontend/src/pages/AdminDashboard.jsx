import { useState, useEffect } from "react";
import api from "../services/api";

const STATUS_COLORS = {
  APPLIED:     { bg: "bg-blue-50",   text: "text-blue-700"   },
  INTERVIEWED: { bg: "bg-purple-50", text: "text-purple-700" },
  SELECTED:    { bg: "bg-green-50",  text: "text-green-700"  },
  REJECTED:    { bg: "bg-red-50",    text: "text-red-700"    },
};

function StatCard({ label, value, color, loading }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {loading
        ? <div className="animate-pulse h-8 w-12 bg-gray-200 rounded" />
        : <p className={`text-2xl font-medium ${color}`}>{value}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]           = useState({ students: 0, companies: 0, jobs: 0, applications: 0 });
  const [students, setStudents]     = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [applications, setApps]     = useState([]);
  const [risks, setRisks]           = useState({});
  const [tab, setTab]               = useState("students");
  const [loading, setLoading]       = useState(true);
  const [scanning, setScanning]     = useState(false);
  const [scanMsg, setScanMsg]       = useState(null);
  const [recalcMsg, setRecalcMsg]   = useState({});
  const [search, setSearch]         = useState("");
  const [deleteMsg, setDeleteMsg]   = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sRes, cRes, jRes, aRes, rRes] = await Promise.allSettled([
        api.get("/students"),
        api.get("/companies"),
        api.get("/jobs"),
        api.get("/applications"),
        api.get("/risk/all"),
      ]);
      const s = sRes.status === "fulfilled" ? sRes.value.data?.data || [] : [];
      const c = cRes.status === "fulfilled" ? cRes.value.data?.data || [] : [];
      const j = jRes.status === "fulfilled" ? jRes.value.data?.data || [] : [];
      const a = aRes.status === "fulfilled" ? aRes.value.data?.data || [] : [];
      const r = rRes.status === "fulfilled" ? rRes.value.data?.data || [] : [];
      setStudents(s);
      setCompanies(c);
      setJobs(j);
      setApps(a);
      const rMap = {};
      r.forEach((rp) => { rMap[rp.companyId] = rp; });
      setRisks(rMap);
      setStats({ students: s.length, companies: c.length, jobs: j.length, applications: a.length });
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }

  async function deleteStudent(id) {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    try {
      await api.delete(`/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.studentId !== id));
      setStats((prev) => ({ ...prev, students: prev.students - 1 }));
      setDeleteMsg("Student deleted.");
      setTimeout(() => setDeleteMsg(null), 3000);
    } catch {
      setDeleteMsg("Delete failed — check if student has applications.");
      setTimeout(() => setDeleteMsg(null), 4000);
    }
  }

  async function deleteCompany(id) {
    if (!window.confirm("Delete this company? This cannot be undone.")) return;
    try {
      await api.delete(`/companies/${id}`);
      setCompanies((prev) => prev.filter((c) => c.companyId !== id));
      setStats((prev) => ({ ...prev, companies: prev.companies - 1 }));
      setDeleteMsg("Company deleted.");
      setTimeout(() => setDeleteMsg(null), 3000);
    } catch {
      setDeleteMsg("Delete failed — check if company has jobs.");
      setTimeout(() => setDeleteMsg(null), 4000);
    }
  }

  async function deleteJob(id) {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.jobId !== id));
      setStats((prev) => ({ ...prev, jobs: prev.jobs - 1 }));
      setDeleteMsg("Job deleted.");
      setTimeout(() => setDeleteMsg(null), 3000);
    } catch {
      setDeleteMsg("Delete failed — check if job has applications.");
      setTimeout(() => setDeleteMsg(null), 4000);
    }
  }

  async function recalculateRisk(companyId, companyName) {
    setRecalcMsg((prev) => ({ ...prev, [companyId]: "Recalculating..." }));
    try {
      await api.get(`/risk/recalculate/${companyId}`);
      const rRes = await api.get("/risk/all");
      const r = rRes.data?.data || [];
      const rMap = {};
      r.forEach((rp) => { rMap[rp.companyId] = rp; });
      setRisks(rMap);
      setRecalcMsg((prev) => ({ ...prev, [companyId]: `✓ ${companyName} recalculated` }));
      setTimeout(() => setRecalcMsg((prev) => ({ ...prev, [companyId]: null })), 3000);
    } catch {
      setRecalcMsg((prev) => ({ ...prev, [companyId]: "Failed — check ML server" }));
      setTimeout(() => setRecalcMsg((prev) => ({ ...prev, [companyId]: null })), 3000);
    }
  }

  async function triggerFullScan() {
    setScanMsg("Scanning all companies for layoff signals...");
    setScanning(true);
    try {
      for (const company of companies) {
        try {
          await api.post("/ml/scrape-news", { company_name: company.companyName });
          await api.get(`/risk/recalculate/${company.companyId}`);
        } catch { /* skip failed company */ }
      }
      const rRes = await api.get("/risk/all");
      const r = rRes.data?.data || [];
      const rMap = {};
      r.forEach((rp) => { rMap[rp.companyId] = rp; });
      setRisks(rMap);
      setScanMsg(`✓ Scan complete — ${companies.length} companies updated.`);
      setTimeout(() => setScanMsg(null), 5000);
    } catch {
      setScanMsg("Scan failed — ensure Python ML server is running on port 5000.");
      setTimeout(() => setScanMsg(null), 5000);
    } finally {
      setScanning(false);
    }
  }

  const RISK_COLORS = {
    low:      "bg-green-50 text-green-700",
    medium:   "bg-amber-50 text-amber-700",
    high:     "bg-red-50 text-red-700",
    critical: "bg-red-100 text-red-900",
  };

  const filteredStudents  = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCompanies = companies.filter((c) =>
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredJobs = jobs.filter((j) =>
    j.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
    j.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = ["students", "companies", "jobs", "applications", "live feed"];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Admin dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage students, companies, jobs and live risk signals</p>
        </div>
        <button
          onClick={triggerFullScan}
          disabled={scanning}
          className="text-sm font-medium px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "⚡ Run full risk scan"}
        </button>
      </div>

      {/* Scan message */}
      {scanMsg && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-4 py-3 mb-4">
          {scanMsg}
        </div>
      )}

      {/* Delete message */}
      {deleteMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-4">
          {deleteMsg}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total students"    value={stats.students}     color="text-teal-700"   loading={loading} />
        <StatCard label="Companies"         value={stats.companies}    color="text-purple-700" loading={loading} />
        <StatCard label="Active jobs"       value={stats.jobs}         color="text-blue-700"   loading={loading} />
        <StatCard label="Applications"      value={stats.applications} color="text-amber-700"  loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== "applications" && tab !== "live feed" && (
        <input
          type="text"
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:border-teal-500 mb-4"
        />
      )}

      {/* ── STUDENTS TAB ── */}
      {tab === "students" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ID", "Name", "Email", "Department", "GPA", "Backlogs", "Placed", "Action"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="animate-pulse h-4 bg-gray-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-400">{s.studentId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.fullName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.departmentName || "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium text-teal-700">{s.gpa}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.backlogs ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.isPlaced ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {s.isPlaced ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteStudent(s.studentId)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
              }
              {!loading && filteredStudents.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── COMPANIES TAB ── */}
      {tab === "companies" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ID", "Company", "Sector", "Stage", "Risk index", "Risk level", "Action"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="animate-pulse h-4 bg-gray-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredCompanies.map((c) => {
                    const risk = risks[c.companyId];
                    const level = risk?.riskLevel?.toLowerCase() || "low";
                    return (
                      <tr key={c.companyId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400">{c.companyId}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.companyName}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.sector}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.fundingStage || "—"}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-800">
                          {risk?.riskIndex != null ? Number(risk.riskIndex).toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {risk ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RISK_COLORS[level] || "bg-gray-100 text-gray-600"}`}>
                              {risk.riskLevel}
                            </span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => recalculateRisk(c.companyId, c.companyName)}
                              className="text-xs text-teal-600 hover:text-teal-700 transition-colors"
                            >
                              {recalcMsg[c.companyId] || "Recalculate"}
                            </button>
                            <button
                              onClick={() => deleteCompany(c.companyId)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
              {!loading && filteredCompanies.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No companies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── JOBS TAB ── */}
      {tab === "jobs" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ID", "Title", "Company", "Type", "Min GPA", "Deadline", "Active", "Action"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="animate-pulse h-4 bg-gray-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredJobs.map((j) => (
                    <tr key={j.jobId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-400">{j.jobId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{j.jobTitle}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{j.companyName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{j.jobType || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{j.requiredGpa || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${j.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {j.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteJob(j.jobId)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
              }
              {!loading && filteredJobs.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No jobs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── APPLICATIONS TAB ── */}
      {tab === "applications" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ID", "Student", "Job", "Status", "Applied at"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(5).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="animate-pulse h-4 bg-gray-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : applications.map((a) => {
                    const cfg = STATUS_COLORS[a.status] || { bg: "bg-gray-100", text: "text-gray-600" };
                    return (
                      <tr key={a.applicationId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400">{a.applicationId}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{a.studentName || `Student #${a.studentId}`}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{a.jobTitle || `Job #${a.jobId}`}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })
              }
              {!loading && applications.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── LIVE FEED TAB ── */}
      {tab === "live feed" && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-700">
            Click <strong>⚡ Run full risk scan</strong> above to automatically scrape layoff news
            for all {companies.length} companies and recalculate their risk scores.
            Each company's risk index updates immediately after the scan.
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Company", "Current risk index", "Risk level", "Action"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c) => {
                  const risk  = risks[c.companyId];
                  const level = risk?.riskLevel?.toLowerCase() || "low";
                  return (
                    <tr key={c.companyId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.companyName}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {risk?.riskIndex != null ? Number(risk.riskIndex).toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {risk ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RISK_COLORS[level] || "bg-gray-100 text-gray-600"}`}>
                            {risk.riskLevel}
                          </span>
                        ) : <span className="text-xs text-gray-400">No data</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => recalculateRisk(c.companyId, c.companyName)}
                          className="text-xs text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {recalcMsg[c.companyId] || "Recalculate risk"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
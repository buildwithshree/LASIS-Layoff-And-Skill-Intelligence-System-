import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const parseError = (err) => {
  const msg = err?.response?.data?.message || err?.response?.data || err?.message || "";
  if (!err?.response) return "Cannot reach server. Check that all servers are running.";
  if (err.response.status === 403) return "You do not have permission to perform this action.";
  if (typeof msg === "string") {
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already exists"))
      return "This record already exists.";
    if (msg.toLowerCase().includes("overflow") || msg.toLowerCase().includes("numeric"))
      return "A numeric value is out of range. Please check your inputs.";
    if (msg.trim().length > 0) return msg;
  }
  return "A server error occurred. Please try again.";
};

const fmt = (n) => (n ?? 0).toLocaleString();

const riskBadge = (level) => {
  const map = {
    LOW:      "bg-green-50 text-green-700",
    MEDIUM:   "bg-amber-50 text-amber-700",
    HIGH:     "bg-red-50 text-red-700",
    CRITICAL: "bg-red-100 text-red-900",
  };
  return map[level?.toUpperCase()] || "bg-gray-100 text-gray-600";
};

const statusBadge = (status) => {
  const map = {
    SELECTED:    "bg-green-50 text-green-700",
    INTERVIEWED: "bg-purple-50 text-purple-700",
    REJECTED:    "bg-red-50 text-red-700",
    APPLIED:     "bg-gray-100 text-gray-600",
  };
  return map[status?.toUpperCase()] || "bg-gray-100 text-gray-600";
};

// ─── Shared UI primitives ────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ErrorBox = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
    {message}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex items-center justify-center py-16 text-sm text-gray-400">
    {message}
  </div>
);

const MetricCard = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-3xl font-medium text-gray-900 mt-2">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
      active
        ? "bg-teal-600 text-white font-medium"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`}
  >
    {label}
  </button>
);

// ─── Overview Tab ────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [students, companies, jobs, apps] = await Promise.all([
          api.get("/students"),
          api.get("/companies"),
          api.get("/jobs/active"),
          api.get("/applications"),
        ]);
        const appData = apps.data?.data || [];
        const selected = appData.filter((a) => a.status === "SELECTED").length;
        const interviewed = appData.filter((a) => a.status === "INTERVIEWED").length;
        setData({
          students: (students.data?.data || []).length,
          companies: (companies.data?.data || []).length,
          jobs: (jobs.data?.data || []).length,
          applications: appData.length,
          selected,
          interviewed,
        });
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total students"     value={fmt(data.students)}     sub="registered" />
        <MetricCard label="Total companies"    value={fmt(data.companies)}    sub="in system" />
        <MetricCard label="Active job postings" value={fmt(data.jobs)}        sub="open roles" />
        <MetricCard label="Total applications" value={fmt(data.applications)} sub={`${fmt(data.selected)} selected · ${fmt(data.interviewed)} interviewed`} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Application pipeline</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Applied",     value: data.applications - data.selected - data.interviewed, color: "bg-gray-200" },
            { label: "Interviewed", value: data.interviewed, color: "bg-purple-400" },
            { label: "Selected",    value: data.selected,    color: "bg-teal-500" },
            { label: "Placement rate", value: data.applications > 0 ? `${Math.round((data.selected / data.applications) * 100)}%` : "0%", color: null },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400">{item.label}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.color && <div className={`w-2 h-2 rounded-full ${item.color}`} />}
                <p className="text-xl font-medium text-gray-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Companies Tab ───────────────────────────────────────────────────────────

const CompaniesTab = () => {
  const [companies, setCompanies]   = useState([]);
  const [riskMap, setRiskMap]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [recalcIds, setRecalcIds]   = useState({});
  const [signalForms, setSignalForms] = useState({});
  const [signalErrors, setSignalErrors] = useState({});
  const [signalSuccess, setSignalSuccess] = useState({});
  const [recruiterForms, setRecruiterForms] = useState({});
  const [recruiterSaving, setRecruiterSaving] = useState({});
  const [recruiterErrors, setRecruiterErrors] = useState({});
  const [recruiterSuccess, setRecruiterSuccess] = useState({});

  const SIGNAL_TYPES = ["LAYOFF", "HIRING_FREEZE", "FUNDING_CUT", "REVENUE_DROP", "RESTRUCTURING", "POSITIVE_GROWTH"];

  const blankSignal = { signalType: "LAYOFF", severity: 5, sourceUrl: "", notes: "" };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [cRes, rRes] = await Promise.all([
          api.get("/companies"),
          api.get("/risk/all"),
        ]);
        const cList = cRes.data?.data || [];
        const rList = rRes.data?.data || [];
        setCompanies(cList);
        const map = {};
        rList.forEach((r) => { map[r.companyId] = r; });
        setRiskMap(map);
        // init forms
        const sf = {};
        const rf = {};
        cList.forEach((c) => {
          sf[c.companyId] = { ...blankSignal };
          rf[c.companyId] = c.recruiterEmail || "";
        });
        setSignalForms(sf);
        setRecruiterForms(rf);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recalculate = async (companyId) => {
    setRecalcIds((p) => ({ ...p, [companyId]: true }));
    try {
      const res = await api.get(`/risk/recalculate/${companyId}`);
      const updated = res.data?.data;
      if (updated) {
        setRiskMap((p) => ({ ...p, [companyId]: updated }));
      }
    } catch (err) {
      // silently fail — non-critical action
    } finally {
      setRecalcIds((p) => ({ ...p, [companyId]: false }));
    }
  };

  const submitSignal = async (companyId) => {
    const form = signalForms[companyId];
    setSignalErrors((p) => ({ ...p, [companyId]: "" }));
    setSignalSuccess((p) => ({ ...p, [companyId]: "" }));

    if (!form.signalType) {
      setSignalErrors((p) => ({ ...p, [companyId]: "Signal type is required." }));
      return;
    }
    if (form.severity < 1 || form.severity > 10) {
      setSignalErrors((p) => ({ ...p, [companyId]: "Severity must be between 1 and 10." }));
      return;
    }

    try {
      await api.post(`/risk/signal/${companyId}`, {
        signalType: form.signalType,
        severity: Number(form.severity),
        sourceUrl: form.sourceUrl || null,
        notes: form.notes || null,
      });
      setSignalSuccess((p) => ({ ...p, [companyId]: "Risk signal added successfully." }));
      setSignalForms((p) => ({ ...p, [companyId]: { ...blankSignal } }));
      // recalculate risk automatically after new signal
      await recalculate(companyId);
    } catch (err) {
      setSignalErrors((p) => ({ ...p, [companyId]: parseError(err) }));
    }
  };

  const saveRecruiterEmail = async (companyId) => {
    const email = recruiterForms[companyId]?.trim();
    setRecruiterErrors((p) => ({ ...p, [companyId]: "" }));
    setRecruiterSuccess((p) => ({ ...p, [companyId]: "" }));

    if (!email) {
      setRecruiterErrors((p) => ({ ...p, [companyId]: "Email cannot be empty." }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRecruiterErrors((p) => ({ ...p, [companyId]: "Please enter a valid email address." }));
      return;
    }

    setRecruiterSaving((p) => ({ ...p, [companyId]: true }));
    try {
      const company = companies.find((c) => c.companyId === companyId);
      if (!company) return;
      await api.put(`/companies/${companyId}`, { ...company, recruiterEmail: email });
      setCompanies((prev) =>
        prev.map((c) => c.companyId === companyId ? { ...c, recruiterEmail: email } : c)
      );
      setRecruiterSuccess((p) => ({ ...p, [companyId]: "Recruiter email updated." }));
    } catch (err) {
      setRecruiterErrors((p) => ({ ...p, [companyId]: parseError(err) }));
    } finally {
      setRecruiterSaving((p) => ({ ...p, [companyId]: false }));
    }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} />;
  if (!companies.length) return <EmptyState message="No companies found." />;

  return (
    <div className="space-y-3">
      {companies.map((company) => {
        const risk      = riskMap[company.companyId];
        const expanded  = expandedId === company.companyId;
        const isRecalc  = recalcIds[company.companyId];
        const sigForm   = signalForms[company.companyId] || { ...blankSignal };
        const sigErr    = signalErrors[company.companyId] || "";
        const sigOk     = signalSuccess[company.companyId] || "";
        const recEmail  = recruiterForms[company.companyId] ?? "";
        const recSaving = recruiterSaving[company.companyId];
        const recErr    = recruiterErrors[company.companyId] || "";
        const recOk     = recruiterSuccess[company.companyId] || "";

        return (
          <div key={company.companyId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Row */}
            <button
              onClick={() => setExpandedId(expanded ? null : company.companyId)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{company.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{company.sector} · {company.headquarters}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {risk ? (
                  <>
                    <span className="text-xs text-gray-400">Risk {risk.riskIndex?.toFixed(1)}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskBadge(risk.riskLevel)}`}>
                      {risk.riskLevel}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">No risk data</span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-6 bg-gray-50">

                {/* Risk actions */}
                <div className="grid grid-cols-2 gap-6">

                  {/* Recalculate + Add signal */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk management</p>
                      <button
                        onClick={() => recalculate(company.companyId)}
                        disabled={isRecalc}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-teal-600 transition-colors disabled:opacity-50"
                      >
                        {isRecalc ? "Recalculating…" : "↻ Recalculate risk"}
                      </button>
                    </div>

                    {/* Add risk signal form */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs text-gray-500 font-medium">Add risk signal</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Signal type</label>
                          <select
                            value={sigForm.signalType}
                            onChange={(e) => setSignalForms((p) => ({ ...p, [company.companyId]: { ...sigForm, signalType: e.target.value } }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white"
                          >
                            {SIGNAL_TYPES.map((t) => (
                              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Severity (1–10)</label>
                          <input
                            type="number" min={1} max={10}
                            value={sigForm.severity}
                            onChange={(e) => setSignalForms((p) => ({ ...p, [company.companyId]: { ...sigForm, severity: e.target.value } }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Source URL (optional)</label>
                        <input
                          type="url"
                          value={sigForm.sourceUrl}
                          onChange={(e) => setSignalForms((p) => ({ ...p, [company.companyId]: { ...sigForm, sourceUrl: e.target.value } }))}
                          placeholder="https://..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Notes (optional)</label>
                        <textarea
                          value={sigForm.notes}
                          onChange={(e) => setSignalForms((p) => ({ ...p, [company.companyId]: { ...sigForm, notes: e.target.value } }))}
                          rows={2}
                          placeholder="Additional context..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      {sigErr && <p className="text-xs text-red-600">{sigErr}</p>}
                      {sigOk  && <p className="text-xs text-teal-600">{sigOk}</p>}

                      <button
                        onClick={() => submitSignal(company.companyId)}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        Add signal
                      </button>
                    </div>
                  </div>

                  {/* Recruiter email */}
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Recruiter assignment</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs text-gray-500">
                        Link a recruiter account to this company. The recruiter must register with this exact email.
                      </p>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Recruiter email</label>
                        <input
                          type="email"
                          value={recEmail}
                          onChange={(e) => setRecruiterForms((p) => ({ ...p, [company.companyId]: e.target.value }))}
                          placeholder="recruiter@company.com"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      {recErr && <p className="text-xs text-red-600">{recErr}</p>}
                      {recOk  && <p className="text-xs text-teal-600">{recOk}</p>}
                      <button
                        onClick={() => saveRecruiterEmail(company.companyId)}
                        disabled={recSaving}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {recSaving ? "Saving…" : "Save recruiter email"}
                      </button>
                    </div>

                    {/* Current risk summary */}
                    {risk && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Current risk breakdown</p>
                        {[
                          { label: "Layoff frequency", value: risk.layoffFrequency },
                          { label: "Hiring score",     value: risk.hiringScore },
                          { label: "Automation score", value: risk.automationScore },
                          { label: "Risk index",       value: risk.riskIndex },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between text-xs">
                            <span className="text-gray-400">{item.label}</span>
                            <span className="text-gray-700 font-medium">{item.value?.toFixed(2) ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Students Tab ────────────────────────────────────────────────────────────

const StudentsTab = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [sRes, aRes] = await Promise.all([
          api.get("/students"),
          api.get("/applications"),
        ]);
        const sList = sRes.data?.data || [];
        const aList = aRes.data?.data || [];
        // count applications per student
        const countMap = {};
        aList.forEach((a) => {
          const sid = a.studentId || a.student?.studentId;
          if (sid) countMap[sid] = (countMap[sid] || 0) + 1;
        });
        setStudents(sList.map((s) => ({ ...s, appCount: countMap[s.studentId] || 0 })));
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
      />

      {!filtered.length ? (
        <EmptyState message={search ? "No students match your search." : "No students found."} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Email", "Department", "GPA", "Grad year", "Backlogs", "Applications"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.studentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.department?.deptName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{s.gpa ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.graduationYear ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.backlogs ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className="bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {s.appCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Jobs Tab ────────────────────────────────────────────────────────────────

const JobsTab = () => {
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [closingId, setClosingId] = useState(null);
  const [closeError, setCloseError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setCloseError("");
    try {
      const res = await api.get("/jobs");
      setJobs(res.data?.data || []);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeJob = async (jobId) => {
    setClosingId(jobId);
    setCloseError("");
    try {
      await api.put(`/jobs/${jobId}/close`);
      setJobs((prev) => prev.map((j) => j.jobId === jobId ? { ...j, isActive: false } : j));
    } catch (err) {
      setCloseError(parseError(err));
    } finally {
      setClosingId(null);
    }
  };

  const filtered = jobs.filter((j) => {
    if (filter === "ACTIVE")   return j.isActive;
    if (filter === "INACTIVE") return !j.isActive;
    return true;
  });

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["ALL", "ACTIVE", "INACTIVE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f
                ? "bg-teal-600 text-white border-teal-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {closeError && <ErrorBox message={closeError} />}

      {!filtered.length ? (
        <EmptyState message="No jobs match this filter." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Job title", "Company", "Type", "Openings", "Deadline", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((job) => (
                <tr key={job.jobId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{job.jobTitle}</td>
                  <td className="px-4 py-3 text-gray-500">{job.company?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{job.jobType || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{job.openings ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {job.applicationDeadline
                      ? new Date(job.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${job.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {job.isActive ? "Active" : "Closed"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {job.isActive && (
                      <button
                        onClick={() => closeJob(job.jobId)}
                        disabled={closingId === job.jobId}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {closingId === job.jobId ? "Closing…" : "Close"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Applications Tab ────────────────────────────────────────────────────────

const ApplicationsTab = () => {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/applications");
        setApps(res.data?.data || []);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUSES = ["ALL", "APPLIED", "INTERVIEWED", "SELECTED", "REJECTED"];

  const filtered = apps.filter((a) => filter === "ALL" || a.status === filter);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === s
                ? "bg-teal-600 text-white border-teal-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} application{filtered.length !== 1 ? "s" : ""}</p>

      {!filtered.length ? (
        <EmptyState message="No applications match this filter." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Student", "Job title", "Company", "Applied on", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((app) => (
                <tr key={app.applicationId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {app.student?.fullName || app.studentName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {app.jobPosting?.jobTitle || app.jobTitle || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.jobPosting?.company?.name || app.companyName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Root component ──────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",      label: "Overview" },
  { key: "companies",     label: "Companies" },
  { key: "students",      label: "Students" },
  { key: "jobs",          label: "Jobs" },
  { key: "applications",  label: "Applications" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTab = () => {
    switch (activeTab) {
      case "overview":     return <OverviewTab />;
      case "companies":    return <CompaniesTab />;
      case "students":     return <StudentsTab />;
      case "jobs":         return <JobsTab />;
      case "applications": return <ApplicationsTab />;
      default:             return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-medium text-gray-900">Admin dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">System-wide oversight and management</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <Tab
            key={t.key}
            label={t.label}
            active={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
          />
        ))}
      </div>

      {/* Tab content */}
      <div>{renderTab()}</div>
    </div>
  );
};

export default AdminDashboard;
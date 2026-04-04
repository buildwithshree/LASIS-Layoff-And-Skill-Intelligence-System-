import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["APPLIED", "INTERVIEWED", "SELECTED", "REJECTED"];

const statusBadge = (status) => {
  switch (status) {
    case "SELECTED":    return "bg-teal-50 text-teal-700";
    case "INTERVIEWED": return "bg-purple-50 text-purple-700";
    case "REJECTED":    return "bg-red-50 text-red-600";
    default:            return "bg-gray-100 text-gray-600";
  }
};

const readinessColor = (score) => {
  if (score >= 80) return "text-teal-700";
  if (score >= 60) return "text-teal-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
};

const readinessBarColor = (score) => {
  if (score >= 80) return "bg-teal-500";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
};

const JOB_TYPES = ["Full-Time", "Internship", "Part-Time", "Contract"];

// ─── Post Job Modal ──────────────────────────────────────────────────────────

function PostJobModal({ companyId, onClose, onPosted }) {
  const [form, setForm] = useState({
    jobTitle:            "",
    jobDescription:      "",
    requiredSkills:      "",
    jobType:             "Full-Time",
    experienceRequired:  "Fresher",
    openings:            "1",
    requiredGpa:         "6.0",
    maxBacklogs:         "0",
    salaryMin:           "",
    salaryMax:           "",
    applicationDeadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  function handleField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setError(null);
    if (!form.jobTitle.trim())       { setError("Job title is required."); return; }
    if (!form.requiredSkills.trim()) { setError("Required skills are required."); return; }
    if (!form.openings || Number(form.openings) < 1) {
      setError("At least 1 opening is required."); return;
    }

    setSubmitting(true);
    try {
      await api.post("/jobs", {
        companyId:           companyId,
        jobTitle:            form.jobTitle.trim(),
        jobDescription:      form.jobDescription.trim() || null,
        requiredSkills:      form.requiredSkills.trim(),
        jobType:             form.jobType,
        experienceRequired:  form.experienceRequired,
        openings:            Number(form.openings),
        requiredGpa:         Number(form.requiredGpa),
        maxBacklogs:         Number(form.maxBacklogs),
        salaryMin:           form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax:           form.salaryMax ? Number(form.salaryMax) : null,
        applicationDeadline: form.applicationDeadline || null,
        isActive:            true,
      });
      onPosted();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        setError("A job with this title already exists for your company.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again.");
      } else {
        setError(msg || "Failed to post job. Check all fields and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl max-h-screen overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-gray-900">Post a new role</p>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Job title <span className="text-red-500">*</span>
            </label>
            <input
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleField}
              placeholder="e.g. Software Engineer"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Required skills <span className="text-red-500">*</span>
            </label>
            <input
              name="requiredSkills"
              value={form.requiredSkills}
              onChange={handleField}
              placeholder="e.g. Java, Spring Boot, PostgreSQL"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Comma separated. These drive the skill gap analysis for students.
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Job description
            </label>
            <textarea
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleField}
              placeholder="Describe the role, responsibilities, and expectations..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Job type</label>
              <select
                name="jobType"
                value={form.jobType}
                onChange={handleField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Experience</label>
              <select
                name="experienceRequired"
                value={form.experienceRequired}
                onChange={handleField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="Fresher">Fresher</option>
                <option value="0-1 years">0–1 years</option>
                <option value="1-3 years">1–3 years</option>
                <option value="3-5 years">3–5 years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Openings</label>
              <input
                name="openings"
                type="number"
                min="1"
                value={form.openings}
                onChange={handleField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Min GPA (0–10)</label>
              <input
                name="requiredGpa"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.requiredGpa}
                onChange={handleField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Max backlogs</label>
              <input
                name="maxBacklogs"
                type="number"
                min="0"
                value={form.maxBacklogs}
                onChange={handleField}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Min salary (LPA)</label>
              <input
                name="salaryMin"
                type="number"
                min="0"
                step="0.5"
                value={form.salaryMin}
                onChange={handleField}
                placeholder="e.g. 8"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Max salary (LPA)</label>
              <input
                name="salaryMax"
                type="number"
                min="0"
                step="0.5"
                value={form.salaryMax}
                onChange={handleField}
                placeholder="e.g. 15"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Application deadline
            </label>
            <input
              name="applicationDeadline"
              type="date"
              value={form.applicationDeadline}
              onChange={handleField}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-sm font-medium px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Applicant Card ──────────────────────────────────────────────────────────

function ApplicantCard({ application, readiness, onStatusChange, updatingId }) {
  const score = readiness?.finalReadiness != null
    ? Math.round(Number(readiness.finalReadiness))
    : null;

  const missing = readiness?.missingSkills
    ? readiness.missingSkills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-xs font-medium text-teal-700 flex-shrink-0">
            {application.studentName?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {application.studentName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Applied {application.appliedAt
                ? new Date(application.appliedAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {score !== null && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Readiness</p>
              <p className={`text-sm font-medium ${readinessColor(score)}`}>
                {score}%
              </p>
            </div>
          )}

          <select
            value={application.status}
            onChange={(e) => onStatusChange(application.applicationId, e.target.value)}
            disabled={updatingId === application.applicationId}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer ${statusBadge(application.status)}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {score !== null && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${readinessBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {missing.map((sk) => (
            <span
              key={sk}
              className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600"
            >
              ✗ {sk}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RecruiterDashboard() {
  const { user } = useAuth();

  const [company, setCompany]           = useState(null);
  const [jobs, setJobs]                 = useState([]);
  const [applicationsMap, setApplicationsMap] = useState({});
  const [readinessMap, setReadinessMap] = useState({});
  const [expandedJob, setExpandedJob]   = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [updatingId, setUpdatingId]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    fetchAll();
  }, [user]);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      const companyRes = await api.get(
        `/companies/recruiter/by-email/${encodeURIComponent(user.email)}`
      );
      const comp = companyRes.data.data;
      setCompany(comp);

      const jobsRes = await api.get(`/jobs/company/${comp.companyId}`);
      const jobList = jobsRes.data.data || [];
      setJobs(jobList);

      // fetch applicants for each job in parallel
      await Promise.all(jobList.map((job) => fetchApplicants(job.jobId)));
    } catch (err) {
      if (err.response?.status === 404) {
        setError("no_company");
      } else {
        setError("Your recruiter dashboard could not be loaded. Ensure all servers are running.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplicants(jobId) {
    try {
      const res = await api.get(`/applications/job/${jobId}`);
      const apps = res.data.data || [];
      setApplicationsMap((prev) => ({ ...prev, [jobId]: apps }));

      // fetch readiness for each applicant
      apps.forEach((app) => {
        fetchReadiness(app.studentId, jobId);
      });
    } catch {
      setApplicationsMap((prev) => ({ ...prev, [jobId]: [] }));
    }
  }

  async function fetchReadiness(studentId, jobId) {
    const key = `${studentId}_${jobId}`;
    try {
      const res = await api.get(`/readiness/student/${studentId}/job/${jobId}`);
      const data = res.data.data;
      if (data) {
        setReadinessMap((prev) => ({ ...prev, [key]: data }));
      }
    } catch {
      // no readiness record yet — expected for new applicants
    }
  }

  async function handleStatusChange(applicationId, newStatus) {
    setUpdatingId(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status?status=${newStatus}`);
      // refresh all applicants to reflect new status
      const jobList = jobs;
      await Promise.all(jobList.map((job) => fetchApplicants(job.jobId)));
    } catch {
      // status update failed — silently keep old state, user can retry
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleJobPosted() {
    const jobsRes = await api.get(`/jobs/company/${company.companyId}`);
    const jobList = jobsRes.data.data || [];
    setJobs(jobList);
    await Promise.all(jobList.map((job) => fetchApplicants(job.jobId)));
  }

  async function handleCloseJob(jobId) {
    try {
      await api.put(`/jobs/${jobId}/close`);
      const jobsRes = await api.get(`/jobs/company/${company.companyId}`);
      setJobs(jobsRes.data.data || []);
    } catch {
      // close failed — no crash
    }
  }

  // ── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading recruiter dashboard...
      </div>
    );
  }

  // ── no company linked ──────────────────────────────────────────────────────

  if (error === "no_company") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-gray-800">
            No company linked to your account
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Your login email ({user?.email}) is not linked to any company in
            the system. Contact your LASIS administrator to link your account.
          </p>
        </div>
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

  // ── derived stats ──────────────────────────────────────────────────────────

  const totalApplications = Object.values(applicationsMap).reduce(
    (sum, apps) => sum + apps.length, 0
  );
  const totalSelected = Object.values(applicationsMap)
    .flat()
    .filter((a) => a.status === "SELECTED").length;
  const activeJobs = jobs.filter((j) => j.isActive).length;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {showPostModal && (
        <PostJobModal
          companyId={company.companyId}
          onClose={() => setShowPostModal(false)}
          onPosted={handleJobPosted}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            {company.companyName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {company.sector} · {company.headquarters || "—"}
          </p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="text-sm font-medium px-5 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          + Post role
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Active roles</p>
          <p className="text-2xl font-medium text-gray-900 mt-1">{activeJobs}</p>
          <p className="text-xs text-gray-400 mt-1">
            {jobs.length} total posted
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Total applicants</p>
          <p className="text-2xl font-medium text-gray-900 mt-1">
            {totalApplications}
          </p>
          <p className="text-xs text-gray-400 mt-1">Across all roles</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Selected</p>
          <p className="text-2xl font-medium text-teal-700 mt-1">
            {totalSelected}
          </p>
          <p className="text-xs text-gray-400 mt-1">Offers extended</p>
        </div>
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No roles posted yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Post role" to add your first job opening.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const apps    = applicationsMap[job.jobId] || [];
            const isOpen  = expandedJob === job.jobId;

            return (
              <div
                key={job.jobId}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Job row */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedJob(isOpen ? null : job.jobId)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {job.jobTitle}
                        </p>
                        {!job.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {job.jobType} · {job.openings} opening
                        {job.openings !== 1 ? "s" : ""} ·{" "}
                        {job.requiredGpa} GPA min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Applicants</p>
                      <p className="text-sm font-medium text-gray-800">
                        {apps.length}
                      </p>
                    </div>

                    {job.salaryMin && job.salaryMax && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Package</p>
                        <p className="text-sm font-medium text-gray-800">
                          {Number(job.salaryMin).toFixed(0)}–
                          {Number(job.salaryMax).toFixed(0)} LPA
                        </p>
                      </div>
                    )}

                    {job.applicationDeadline && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Deadline</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(job.applicationDeadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {job.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseJob(job.jobId);
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded transition-colors"
                      >
                        Close
                      </button>
                    )}

                    <span className="text-xs text-gray-300">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded — required skills + applicants */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Required skills */}
                    {job.requiredSkills && (
                      <div className="mt-4 mb-5">
                        <p className="text-xs text-gray-400 mb-2">
                          Required skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.requiredSkills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((sk) => (
                              <span
                                key={sk}
                                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                              >
                                {sk}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Applicants */}
                    <p className="text-xs text-gray-400 mb-3">
                      Applicants ({apps.length})
                    </p>

                    {apps.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-400">
                          No applications yet for this role.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {apps.map((app) => {
                          const key = `${app.studentId}_${job.jobId}`;
                          return (
                            <ApplicantCard
                              key={app.applicationId}
                              application={app}
                              readiness={readinessMap[key] || null}
                              onStatusChange={handleStatusChange}
                              updatingId={updatingId}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
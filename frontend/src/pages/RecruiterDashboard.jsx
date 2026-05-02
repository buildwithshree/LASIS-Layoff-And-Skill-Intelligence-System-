import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = ["APPLIED", "INTERVIEWED", "SELECTED", "REJECTED"];

const STATUS_COLORS = {
  APPLIED:     "bg-blue-50 text-blue-700",
  INTERVIEWED: "bg-amber-50 text-amber-700",
  SELECTED:    "bg-green-50 text-green-700",
  REJECTED:    "bg-red-50 text-red-700",
};

const READINESS_COLOR = (score) => {
  if (score >= 80) return "text-teal-700";
  if (score >= 60) return "text-teal-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
};

const READINESS_BAR = (score) => {
  if (score >= 80) return "bg-teal-500";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
};

function getSkillName(s) {
  if (!s) return "";
  if (s.skill?.skillName) return s.skill.skillName;
  if (s.skillName) return s.skillName;
  if (s.name) return s.name;
  if (typeof s === "string") return s;
  return "";
}

export default function RecruiterDashboard() {
  const { user } = useAuth();

  // company linking state
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");

  // jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);

  // applicants per job
  const [applicants, setApplicants] = useState({}); // jobId -> []
  const [applicantsLoading, setApplicantsLoading] = useState({});

  // readiness per applicant per job
  const [readiness, setReadiness] = useState({}); // "studentId-jobId" -> score

  // status update
  const [statusUpdating, setStatusUpdating] = useState({}); // appId -> bool
  const [statusError, setStatusError] = useState({});

  // post job form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    jobType: "FULL_TIME",
    location: "",
    packageLpa: "",
    minGpa: "",
    maxBacklogs: "",
    applicationDeadline: "",
    description: "",
    openingsCount: "",
    requiredSkillsInput: "",
  });
  const [jobFormSkills, setJobFormSkills] = useState([]);
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [jobFormError, setJobFormError] = useState("");
  const [jobFormSuccess, setJobFormSuccess] = useState("");

  // all skills for skill picker
  const [allSkills, setAllSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");

  // ── on mount: find company by recruiter email ──
  useEffect(() => {
    async function findCompany() {
      setCompanyLoading(true);
      setCompanyError("");
      try {
        const res = await api.get("/companies");
        const data = res.data?.data || [];
        const matched = data.find(
          (c) =>
            c.recruiterEmail &&
            c.recruiterEmail.toLowerCase() === user?.email?.toLowerCase()
        );
        if (!matched) {
          setCompanyError("no_company");
        } else {
          setCompany(matched);
        }
      } catch {
        setCompanyError("Failed to load company data. Check that Spring Boot is running.");
      } finally {
        setCompanyLoading(false);
      }
    }
    if (user?.email) findCompany();
  }, [user]);

  // ── once company found: load jobs ──
  useEffect(() => {
    if (!company) return;
    loadJobs();
    loadAllSkills();
  }, [company]);

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const res = await api.get(`/jobs/company/${company.companyId}`);
      setJobs(res.data?.data || []);
    } catch {
      // silent — jobs table will be empty
    } finally {
      setJobsLoading(false);
    }
  }

  async function loadAllSkills() {
    try {
      const res = await api.get("/skills");
      setAllSkills(res.data?.data || []);
    } catch {
      // non-critical
    }
  }

  // ── expand job: load applicants + readiness ──
  async function toggleJob(jobId) {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    if (applicants[jobId]) return; // already loaded

    setApplicantsLoading((prev) => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.get(`/applications/job/${jobId}`);
      const apps = res.data?.data || [];
      setApplicants((prev) => ({ ...prev, [jobId]: apps }));

      // load readiness for each applicant
      apps.forEach(async (app) => {
        const sid = app.studentId;
        if (!sid) return;
        const key = `${sid}-${jobId}`;
        try {
          const rRes = await api.get(`/readiness/student/${sid}/job/${jobId}`);
          const score = rRes.data?.data?.finalReadinessScore ?? null;
          setReadiness((prev) => ({ ...prev, [key]: score }));
        } catch {
          setReadiness((prev) => ({ ...prev, [key]: null }));
        }
      });
    } catch {
      setApplicants((prev) => ({ ...prev, [jobId]: [] }));
    } finally {
      setApplicantsLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  // ── status update ──
  async function updateStatus(appId, newStatus, jobId) {
    setStatusUpdating((prev) => ({ ...prev, [appId]: true }));
    setStatusError((prev) => ({ ...prev, [appId]: "" }));
    try {
      await api.put(`/applications/${appId}/status?status=${newStatus}`);
      setApplicants((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((a) =>
          a.applicationId === appId ? { ...a, status: newStatus } : a
        ),
      }));
    } catch (err) {
      const msg = err.response?.status === 404
        ? "Application not found."
        : "Failed to update status. Try again.";
      setStatusError((prev) => ({ ...prev, [appId]: msg }));
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [appId]: false }));
    }
  }

  // ── job form ──
  function handleFormChange(e) {
    const { name, value } = e.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
  }

  function addSkillToJob(skill) {
    if (jobFormSkills.find((s) => s.skillId === skill.skillId)) return;
    setJobFormSkills((prev) => [...prev, skill]);
    setSkillSearch("");
  }

  function removeSkillFromJob(skillId) {
    setJobFormSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  }

  async function submitJobForm(e) {
    e.preventDefault();
    setJobFormError("");
    setJobFormSuccess("");

    if (!jobForm.title.trim()) { setJobFormError("Job title is required."); return; }
    if (!jobForm.location.trim()) { setJobFormError("Location is required."); return; }
    if (!jobForm.packageLpa || isNaN(Number(jobForm.packageLpa))) { setJobFormError("Enter a valid package (LPA)."); return; }
    if (!jobForm.minGpa || isNaN(Number(jobForm.minGpa)) || Number(jobForm.minGpa) > 10) { setJobFormError("Enter a valid minimum GPA (0–10)."); return; }
    if (!jobForm.applicationDeadline) { setJobFormError("Application deadline is required."); return; }
    if (!jobForm.openingsCount || isNaN(Number(jobForm.openingsCount))) { setJobFormError("Enter a valid number of openings."); return; }

    setJobSubmitting(true);
    try {
      const payload = {
        companyId: company.companyId,
        title: jobForm.title.trim(),
        jobType: jobForm.jobType,
        location: jobForm.location.trim(),
        packageLpa: Number(jobForm.packageLpa),
        minGpa: Number(jobForm.minGpa),
        maxBacklogs: Number(jobForm.maxBacklogs) || 0,
        applicationDeadline: jobForm.applicationDeadline,
        description: jobForm.description.trim(),
        openingsCount: Number(jobForm.openingsCount),
        requiredSkillIds: jobFormSkills.map((s) => s.skillId),
        isActive: true,
      };
      await api.post("/jobs", payload);
      setJobFormSuccess("Job posted successfully!");
      setJobForm({
        title: "", jobType: "FULL_TIME", location: "", packageLpa: "",
        minGpa: "", maxBacklogs: "", applicationDeadline: "", description: "",
        openingsCount: "", requiredSkillsInput: "",
      });
      setJobFormSkills([]);
      setShowJobForm(false);
      loadJobs();
    } catch (err) {
      if (err.response?.status === 400) {
        setJobFormError("Invalid job data. Check all fields.");
      } else if (err.response?.status === 500) {
        setJobFormError("Server error. Try again.");
      } else {
        setJobFormError("Could not post job. Check that all servers are running.");
      }
    } finally {
      setJobSubmitting(false);
    }
  }

  const filteredSkills = allSkills.filter(
    (s) =>
      s.skillName?.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !jobFormSkills.find((js) => js.skillId === s.skillId)
  );

  // ── loading / error / no-company states ──
  if (companyLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-64" />
          <div className="h-4 bg-gray-100 rounded w-48" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (companyError === "no_company") {
    return (
      <div className="p-8 max-w-lg">
        <h1 className="text-xl font-medium text-gray-900 mb-2">Company not linked</h1>
        <p className="text-sm text-gray-500 mb-4">
          Your account (<span className="font-medium text-gray-700">{user?.email}</span>) is
          not linked to any company in the system. Ask your admin to set your email
          as the <span className="font-medium">recruiter_email</span> on your company record
          in the companies table.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          Admin fix: UPDATE companies SET recruiter_email = '{user?.email}' WHERE company_name = 'Your Company';
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {companyError}
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.isActive !== false);
  const totalApplicantsCount = Object.values(applicants).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="p-8 max-w-5xl">

      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">{company.companyName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {company.sector} · {company.headquarters || "—"} · Recruiter dashboard
          </p>
        </div>
        <button
          onClick={() => { setShowJobForm((v) => !v); setJobFormError(""); setJobFormSuccess(""); }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {showJobForm ? "Cancel" : "+ Post new job"}
        </button>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total jobs posted</p>
          <p className="text-2xl font-medium text-gray-900">{jobs.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Active openings</p>
          <p className="text-2xl font-medium text-teal-700">{activeJobs.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Applicants loaded</p>
          <p className="text-2xl font-medium text-purple-700">{totalApplicantsCount}</p>
        </div>
      </div>

      {/* success toast */}
      {jobFormSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {jobFormSuccess}
        </div>
      )}

      {/* ── POST JOB FORM ── */}
      {showJobForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Post a new job</h2>
          <form onSubmit={submitJobForm} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Job title *</label>
                <input
                  name="title" value={jobForm.title} onChange={handleFormChange}
                  placeholder="e.g. Software Engineer"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Job type</label>
                <select
                  name="jobType" value={jobForm.jobType} onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="FULL_TIME">Full time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PART_TIME">Part time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location *</label>
                <input
                  name="location" value={jobForm.location} onChange={handleFormChange}
                  placeholder="e.g. Bangalore, India"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Package (LPA) *</label>
                <input
                  name="packageLpa" value={jobForm.packageLpa} onChange={handleFormChange}
                  placeholder="e.g. 12"
                  type="number" min="0" step="0.5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min GPA * (0–10)</label>
                <input
                  name="minGpa" value={jobForm.minGpa} onChange={handleFormChange}
                  placeholder="e.g. 7.5"
                  type="number" min="0" max="10" step="0.1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max backlogs</label>
                <input
                  name="maxBacklogs" value={jobForm.maxBacklogs} onChange={handleFormChange}
                  placeholder="e.g. 0"
                  type="number" min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Openings *</label>
                <input
                  name="openingsCount" value={jobForm.openingsCount} onChange={handleFormChange}
                  placeholder="e.g. 5"
                  type="number" min="1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Application deadline *</label>
              <input
                name="applicationDeadline" value={jobForm.applicationDeadline} onChange={handleFormChange}
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea
                name="description" value={jobForm.description} onChange={handleFormChange}
                placeholder="Role responsibilities, requirements, perks..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {/* skill picker */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Required skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {jobFormSkills.map((s) => (
                  <span key={s.skillId} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {s.skillName}
                    <button type="button" onClick={() => removeSkillFromJob(s.skillId)} className="ml-1 text-teal-400 hover:text-teal-700">×</button>
                  </span>
                ))}
              </div>
              <input
                value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills to add..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
              {skillSearch.trim() && (
                <div className="border border-gray-200 rounded-lg mt-1 max-h-36 overflow-y-auto bg-white">
                  {filteredSkills.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">No matching skills</p>
                  ) : (
                    filteredSkills.slice(0, 20).map((s) => (
                      <button
                        key={s.skillId} type="button"
                        onClick={() => addSkillToJob(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 text-gray-700"
                      >
                        {s.skillName}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {jobFormError && (
              <p className="text-sm text-red-600">{jobFormError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={jobSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {jobSubmitting ? "Posting..." : "Post job"}
              </button>
              <button
                type="button" onClick={() => setShowJobForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── JOBS LIST ── */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Your job postings</h2>
        </div>

        {jobsLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse h-14 bg-gray-50 rounded-lg" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No jobs posted yet. Click "Post new job" to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <div key={job.jobId || job.id}>
                {/* job row */}
                <button
                  onClick={() => toggleJob(job.jobId || job.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.jobType?.replace("_", " ")} · {job.location} ·{" "}
                          {job.packageLpa ? `₹${job.packageLpa} LPA` : "Package not set"} ·{" "}
                          {job.openingsCount || "—"} opening{job.openingsCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        job.isActive !== false ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {job.isActive !== false ? "Active" : "Closed"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {expandedJob === (job.jobId || job.id) ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* expanded applicants */}
                {expandedJob === (job.jobId || job.id) && (
                  <div className="px-6 pb-6 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-3 pt-3">Applicants</p>

                    {applicantsLoading[job.jobId || job.id] ? (
                      <div className="space-y-2">
                        {[1,2,3].map((i) => (
                          <div key={i} className="animate-pulse h-16 bg-white rounded-lg" />
                        ))}
                      </div>
                    ) : !applicants[job.jobId || job.id] || applicants[job.jobId || job.id].length === 0 ? (
                      <p className="text-sm text-gray-400 py-4">No applicants yet for this role.</p>
                    ) : (
                      <div className="space-y-3">
                        {applicants[job.jobId || job.id].map((app) => {
                          const jid = job.jobId || job.id;
                          const sid = app.studentId;
                          const rKey = `${sid}-${jid}`;
                          const rScore = readiness[rKey];
                          const appId = app.applicationId;

                          return (
                            <div key={appId} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4">
                                {/* student info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-xs font-medium text-teal-700">
                                      {(app.studentName || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {app.studentName || `Student #${sid}`}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                                      {app.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                    {app.studentGpa != null && (
                                      <span>GPA: <span className="text-gray-700 font-medium">{Number(app.studentGpa).toFixed(2)}</span></span>
                                    )}
                                    {app.departmentName && (
                                      <span>{app.departmentName}</span>
                                    )}
                                    {app.appliedAt && (
                                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                    )}
                                  </div>

                                  {/* readiness score */}
                                  {rScore != null ? (
                                    <div className="mb-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500">Readiness</span>
                                        <span className={`text-xs font-medium ${READINESS_COLOR(rScore)}`}>
                                          {Math.round(rScore)}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 bg-gray-100 rounded-full w-40">
                                        <div
                                          className={`h-1.5 rounded-full ${READINESS_BAR(rScore)}`}
                                          style={{ width: `${Math.min(rScore, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : rScore === null && rKey in readiness ? (
                                    <p className="text-xs text-gray-400 mb-2">Readiness not calculated</p>
                                  ) : (
                                    <p className="text-xs text-gray-400 mb-2">Loading readiness…</p>
                                  )}

                                  {/* skills */}
                                  {app.studentSkills && app.studentSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {app.studentSkills.slice(0, 6).map((sk, i) => (
                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                          {getSkillName(sk)}
                                        </span>
                                      ))}
                                      {app.studentSkills.length > 6 && (
                                        <span className="text-xs text-gray-400">+{app.studentSkills.length - 6} more</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* status update */}
                                <div className="flex flex-col gap-2 min-w-[140px]">
                                  <label className="text-xs text-gray-500">Update status</label>
                                  <select
                                    value={app.status}
                                    disabled={statusUpdating[appId]}
                                    onChange={(e) => updateStatus(appId, e.target.value, jid)}
                                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-50"
                                  >
                                    {STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                                    ))}
                                  </select>
                                  {statusUpdating[appId] && (
                                    <p className="text-xs text-gray-400">Updating…</p>
                                  )}
                                  {statusError[appId] && (
                                    <p className="text-xs text-red-600">{statusError[appId]}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
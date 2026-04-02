import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const jobTypeColors = {
  "Full-Time":  { bg: "bg-purple-50",  text: "text-purple-700" },
  "Internship": { bg: "bg-blue-50",    text: "text-blue-700"   },
  "Part-Time":  { bg: "bg-amber-50",   text: "text-amber-700"  },
  "Contract":   { bg: "bg-gray-100",   text: "text-gray-600"   },
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

const readinessLabel = (score) => {
  if (score >= 80) return "Excellent fit";
  if (score >= 60) return "Good fit";
  if (score >= 40) return "Moderate fit";
  return "Low fit";
};

function JobTypeBadge({ type }) {
  const cfg = jobTypeColors[type] || jobTypeColors["Contract"];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {type}
    </span>
  );
}

function SkillTag({ skill, matched }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${
        matched
          ? "bg-teal-50 border-teal-200 text-teal-700"
          : "bg-red-50 border-red-200 text-red-600"
      }`}
    >
      {matched ? "✓" : "✗"} {skill}
    </span>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs]                   = useState([]);
  const [student, setStudent]             = useState(null);
  const [studentSkills, setStudentSkills] = useState([]);
  const [readinessMap, setReadinessMap]   = useState({});
  const [skillMatchMap, setSkillMatchMap] = useState({});
  const [applications, setApplications]   = useState([]);
  const [filter, setFilter]               = useState("all");
  const [search, setSearch]               = useState("");
  const [selected, setSelected]           = useState(null);
  const [applying, setApplying]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    fetchAll();
  }, [user]);

  async function fetchAll() {
    try {
      setLoading(true);

      const [jobsRes, studentsRes] = await Promise.all([
        api.get("/jobs"),
        api.get("/students"),
      ]);

      const jobList = jobsRes.data.data || [];
      setJobs(jobList);

      const matched = (studentsRes.data.data || []).find(
        (s) => s.email?.toLowerCase() === user?.email?.toLowerCase()
      );
      setStudent(matched || null);

      if (matched) {
        try {
          const skillsRes = await api.get(`/students/${matched.studentId}/skills`);
          setStudentSkills(skillsRes.data.data || []);
        } catch {
          setStudentSkills([]);
        }

        try {
          const appsRes = await api.get(`/applications/student/${matched.studentId}`);
          setApplications(appsRes.data.data || []);
        } catch {
          setApplications([]);
        }

        jobList.forEach((job) => {
          fetchReadiness(matched.studentId, job.jobId);
        });
      }
    } catch (err) {
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchReadiness(studentId, jobId) {
    try {
      const res = await api.get(`/readiness/student/${studentId}/job/${jobId}`);
      const data = res.data.data;
      if (data) {
        setReadinessMap((prev) => ({ ...prev, [jobId]: data }));
      }
    } catch {
      // No readiness record yet — expected, skip silently
    }
  }

  async function fetchSkillMatch(job) {
    if (skillMatchMap[job.jobId] || !student) return;
    try {
      const studentSkillNames = studentSkills
        .map((s) => {
          if (typeof s === "string") return s;
          if (s.skill?.skillName) return s.skill.skillName;
          if (s.skillName) return s.skillName;
          if (s.name) return s.name;
          return "";
        })
        .filter(Boolean);

      const res = await api.post("/ml/skill-match", {
        studentSkills: studentSkillNames,
        jobSkills: job.requiredSkills
          ? job.requiredSkills.split(",").map((s) => s.trim())
          : [],
      });
      setSkillMatchMap((prev) => ({ ...prev, [job.jobId]: res.data.data }));
    } catch {
      // ML service down — graceful degradation
    }
  }

  async function handleApply(job) {
    if (!student) return;
    setApplying(job.jobId);
    try {
      await api.post("/applications", {
        studentId: student.studentId,
        jobId: job.jobId,
        status: "APPLIED",
      });
      const appsRes = await api.get(`/applications/student/${student.studentId}`);
      setApplications(appsRes.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply.");
    } finally {
      setApplying(null);
    }
  }

  const alreadyApplied = (jobId) =>
    applications.some((a) => a.jobId === jobId);

  const filtered = jobs.filter((j) => {
    const matchesFilter =
      filter === "all" || j.jobType?.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      j.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading jobs...
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
        <h1 className="text-xl font-medium text-gray-900">Role Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse roles and see your readiness score for each
        </p>
      </div>

      {!student && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
          Your account is not linked to a student profile. Readiness scores and skill match unavailable.
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search roles or companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:border-teal-500"
        />
        <div className="flex gap-2">
          {["all", "Full-Time", "Internship", "Part-Time", "Contract"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-12">
            No roles found.
          </div>
        )}

        {filtered.map((job) => {
          const readiness  = readinessMap[job.jobId];
          const skillMatch = skillMatchMap[job.jobId];
          const score      = readiness?.finalReadiness != null
            ? Math.round(Number(readiness.finalReadiness))
            : null;
          const isOpen     = selected?.jobId === job.jobId;
          const applied    = alreadyApplied(job.jobId);

          const requiredSkills = job.requiredSkills
            ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

          const studentSkillNames = studentSkills
            .map((s) => {
              if (typeof s === "string") return s.toLowerCase();
              if (s.skill?.skillName) return s.skill.skillName.toLowerCase();
              if (s.skillName) return s.skillName.toLowerCase();
              if (s.name) return s.name.toLowerCase();
              return "";
            })
            .filter(Boolean);

          const matchedSkills = requiredSkills.filter((sk) =>
            studentSkillNames.includes(sk.toLowerCase())
          );
          const missingSkills = requiredSkills.filter(
            (sk) => !studentSkillNames.includes(sk.toLowerCase())
          );

          return (
            <div
              key={job.jobId}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-300 transition-all"
            >
              {/* Summary row */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setSelected(isOpen ? null : job);
                  if (!isOpen) fetchSkillMatch(job);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                    {job.companyName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.jobTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {job.companyName || "—"} · {job.location || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {job.packageLpa && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Package</p>
                      <p className="text-sm font-medium text-gray-800">{job.packageLpa} LPA</p>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Your readiness</p>
                    <p className={`text-sm font-medium ${score !== null ? readinessColor(score) : "text-gray-400"}`}>
                      {score !== null ? `${score}%` : "—"}
                    </p>
                  </div>

                  <JobTypeBadge type={job.jobType || "Full-Time"} />

                  <span className="text-xs text-gray-300">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">

                  {/* Readiness bar */}
                  {score !== null && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-500">Readiness for this role</p>
                        <span className={`text-xs font-medium ${readinessColor(score)}`}>
                          {readinessLabel(score)} · {score}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${readinessBarColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Skill gap */}
                  {requiredSkills.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Skill gap analysis</p>
                      <div className="flex flex-wrap gap-2">
                        {matchedSkills.map((sk) => (
                          <SkillTag key={sk} skill={sk} matched={true} />
                        ))}
                        {missingSkills.map((sk) => (
                          <SkillTag key={sk} skill={sk} matched={false} />
                        ))}
                      </div>
                      {missingSkills.length > 0 && (
                        <p className="text-xs text-red-500 mt-2">
                          Missing {missingSkills.length} skill{missingSkills.length > 1 ? "s" : ""} required for this role.
                        </p>
                      )}
                    </div>
                  )}

                  {/* ML skill match */}
                  {skillMatch && (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">ML skill match score</p>
                      <p className="text-sm text-gray-700">
                        Match:{" "}
                        <span className="font-medium text-teal-700">
                          {Math.round(
                            skillMatch.match_percentage ??
                            skillMatch.matchPercentage ??
                            0
                          )}%
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Job details */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Job type</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{job.jobType || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{job.location || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Package</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        {job.packageLpa ? `${job.packageLpa} LPA` : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Deadline</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        {job.applicationDeadline
                          ? new Date(job.applicationDeadline).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Apply button */}
                  <div className="flex justify-end pt-2">
                    {applied ? (
                      <span className="text-xs font-medium px-4 py-2 rounded-lg bg-green-50 text-green-700">
                        ✓ Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(job)}
                        disabled={applying === job.jobId || !student}
                        className="text-sm font-medium px-5 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
                      >
                        {applying === job.jobId ? "Applying..." : "Apply"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
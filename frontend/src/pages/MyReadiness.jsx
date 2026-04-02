import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const pct = (val) =>
  val != null ? Math.round(Number(val)) : null;

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
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  return "Low";
};

const readinessBadge = (level) => {
  switch (level) {
    case "excellent": return "bg-teal-50 text-teal-700";
    case "good":      return "bg-teal-50 text-teal-600";
    case "moderate":  return "bg-amber-50 text-amber-700";
    default:          return "bg-red-50 text-red-600";
  }
};

// score contribution bar — shows positive/negative contribution
function ContributionBar({ label, value, weight, positive = true, max = 100 }) {
  const contribution = positive
    ? (Number(value) * weight).toFixed(1)
    : (-Number(value) * weight).toFixed(1);
  const barWidth = Math.min(Math.abs(Number(value)), max);

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-medium ${positive ? "text-teal-700" : "text-red-500"}`}>
          {positive ? "+" : ""}{contribution} pts
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${positive ? "bg-teal-400" : "bg-red-400"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        Raw score: {Number(value).toFixed(1)}
        {positive ? ` × ${weight}` : ` × ${weight} (penalty)`}
      </p>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function MyReadiness() {
  const { user } = useAuth();

  const [student, setStudent]           = useState(null);
  const [records, setRecords]           = useState([]);
  const [studentSkills, setStudentSkills] = useState([]);
  const [mlResult, setMlResult]         = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [mlLoading, setMlLoading]       = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    fetchAll();
  }, [user]);

  async function fetchAll() {
    try {
      setLoading(true);

      const studentsRes = await api.get("/students");
      const matched = (studentsRes.data.data || []).find(
        (s) => s.email?.toLowerCase() === user?.email?.toLowerCase()
      );
      setStudent(matched || null);

      if (!matched) {
        setLoading(false);
        return;
      }

      const [readinessRes, skillsRes] = await Promise.all([
        api.get(`/readiness/student/${matched.studentId}`),
        api.get(`/students/${matched.studentId}/skills`),
      ]);

      const readinessRecords = readinessRes.data.data || [];
      // sort best readiness first
      readinessRecords.sort(
        (a, b) => Number(b.finalReadiness) - Number(a.finalReadiness)
      );
      setRecords(readinessRecords);

      const skills = skillsRes.data.data || [];
      setStudentSkills(skills);

      // fire ML skill match against best-fit job automatically
      if (readinessRecords.length > 0) {
        const bestJob = readinessRecords[0];
        const studentSkillNames = extractSkillNames(skills);
        const jobSkills = bestJob.missingSkills
          ? [
              ...studentSkillNames,
              ...bestJob.missingSkills.split(",").map((s) => s.trim()),
            ]
          : studentSkillNames;
        fireMlMatch(studentSkillNames, jobSkills, bestJob.jobTitle);
      }
    } catch (err) {
      setError("Failed to load readiness data.");
    } finally {
      setLoading(false);
    }
  }

  function extractSkillNames(skills) {
    return skills
      .map((s) => {
        if (typeof s === "string") return s;
        if (s.skill?.skillName) return s.skill.skillName;
        if (s.skillName) return s.skillName;
        if (s.name) return s.name;
        return "";
      })
      .filter(Boolean);
  }

  async function fireMlMatch(studentSkillNames, jobSkills, jobTitle) {
    try {
      setMlLoading(true);
      const res = await api.post("/ml/skill-match", {
        studentSkills: studentSkillNames,
        jobSkills: jobSkills,
      });
      setMlResult({ ...(res.data.data || {}), jobTitle });
    } catch {
      // ML service down — degrade gracefully, no crash
    } finally {
      setMlLoading(false);
    }
  }

  // ─── derived stats ─────────────────────────────────────────────────────────

  const bestRecord = records[0] || null;
  const bestScore  = bestRecord ? pct(bestRecord.finalReadiness) : null;

  const avgScore =
    records.length > 0
      ? Math.round(
          records.reduce((sum, r) => sum + Number(r.finalReadiness), 0) /
            records.length
        )
      : null;

  const excellentCount = records.filter((r) => r.readinessLevel === "excellent").length;
  const goodCount      = records.filter((r) => r.readinessLevel === "good").length;

  const allMissingSkills = [
    ...new Set(
      records
        .flatMap((r) =>
          r.missingSkills ? r.missingSkills.split(",").map((s) => s.trim()) : []
        )
        .filter(Boolean)
    ),
  ];

  const studentSkillNames = extractSkillNames(studentSkills);

  // ─── loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading your readiness profile...
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

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            No student profile linked to your account.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Contact your administrator or complete onboarding.
          </p>
        </div>
      </div>
    );
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">My Readiness</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your placement readiness profile across all evaluated roles
        </p>
      </div>

      {records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No readiness scores calculated yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Visit the Jobs page and open a role to calculate your readiness.
          </p>
        </div>
      ) : (
        <>
          {/* ── Top summary row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400">Best readiness</p>
              <p className={`text-2xl font-medium mt-1 ${bestScore !== null ? readinessColor(bestScore) : "text-gray-400"}`}>
                {bestScore !== null ? `${bestScore}%` : "—"}
              </p>
              {bestRecord && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {bestRecord.jobTitle} · {bestRecord.companyName}
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400">Average readiness</p>
              <p className={`text-2xl font-medium mt-1 ${avgScore !== null ? readinessColor(avgScore) : "text-gray-400"}`}>
                {avgScore !== null ? `${avgScore}%` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Across {records.length} evaluated role{records.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400">Strong matches</p>
              <p className="text-2xl font-medium text-teal-700 mt-1">
                {excellentCount + goodCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {excellentCount} excellent · {goodCount} good
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400">Skill gaps</p>
              <p className="text-2xl font-medium text-amber-600 mt-1">
                {allMissingSkills.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Unique missing skills across all roles
              </p>
            </div>
          </div>

          {/* ── Best role deep dive ── */}
          {bestRecord && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Best match — {bestRecord.jobTitle}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bestRecord.companyName}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${readinessBadge(bestRecord.readinessLevel)}`}>
                  {readinessLabel(bestScore)} fit
                </span>
              </div>

              {/* Overall bar */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-500">Overall readiness</p>
                  <span className={`text-xs font-medium ${readinessColor(bestScore)}`}>
                    {bestScore}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${readinessBarColor(bestScore)}`}
                    style={{ width: `${bestScore}%` }}
                  />
                </div>
              </div>

              {/* Score breakdown */}
              <p className="text-xs text-gray-400 mb-3">Score breakdown</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                <ContributionBar
                  label="Skill match (50% weight)"
                  value={bestRecord.skillMatchScore}
                  weight={0.5}
                  positive={true}
                />
                <ContributionBar
                  label="GPA contribution (20% weight)"
                  value={bestRecord.gpaWeight}
                  weight={0.2}
                  positive={true}
                />
                <ContributionBar
                  label="Project score (20% weight)"
                  value={bestRecord.projectScore}
                  weight={0.2}
                  positive={true}
                />
                <ContributionBar
                  label="Company risk penalty (10% weight)"
                  value={bestRecord.companyRiskScore}
                  weight={0.1}
                  positive={false}
                />
              </div>

              {/* Recommendation */}
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400">Recommendation</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {bestRecord.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* ── ML skill match panel ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  ML skill match — {mlResult?.jobTitle || bestRecord?.jobTitle || "best fit role"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Live analysis from the Random Forest model
                </p>
              </div>
              {mlLoading && (
                <span className="text-xs text-gray-400 animate-pulse">
                  Running model...
                </span>
              )}
            </div>

            {mlResult ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-teal-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Match percentage</p>
                  <p className="text-xl font-medium text-teal-700 mt-1">
                    {Math.round(
                      mlResult.match_percentage ?? mlResult.matchPercentage ?? 0
                    )}%
                  </p>
                </div>
                {mlResult.matched_skills != null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Skills matched</p>
                    <p className="text-xl font-medium text-gray-800 mt-1">
                      {mlResult.matched_skills}
                    </p>
                  </div>
                )}
                {mlResult.total_required != null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Total required</p>
                    <p className="text-xl font-medium text-gray-800 mt-1">
                      {mlResult.total_required}
                    </p>
                  </div>
                )}
              </div>
            ) : !mlLoading ? (
              <p className="text-xs text-gray-400">
                ML service unavailable — check that the Python server is running on port 5000.
              </p>
            ) : null}
          </div>

          {/* ── Your skills ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-3">Your skills</p>
            {studentSkillNames.length === 0 ? (
              <p className="text-xs text-gray-400">No skills found on your profile.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {studentSkillNames.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Skill gaps across all roles ── */}
          {allMissingSkills.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Skills to develop
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Missing across one or more evaluated roles
              </p>
              <div className="flex flex-wrap gap-2">
                {allMissingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600"
                  >
                    ✗ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── All evaluated roles ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm font-medium text-gray-900 mb-4">
              All evaluated roles
            </p>
            <div className="flex flex-col gap-3">
              {records.map((r) => {
                const score    = pct(r.finalReadiness);
                const isOpen   = expanded === r.scoreId;
                const missing  = r.missingSkills
                  ? r.missingSkills.split(",").map((s) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <div
                    key={r.scoreId}
                    className="border border-gray-100 rounded-lg overflow-hidden"
                  >
                    {/* Row */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : r.scoreId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                          {r.companyName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {r.jobTitle}
                          </p>
                          <p className="text-xs text-gray-400">{r.companyName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="w-28">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs text-gray-400">Readiness</span>
                            <span className={`text-xs font-medium ${readinessColor(score)}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${readinessBarColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>

                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${readinessBadge(r.readinessLevel)}`}
                        >
                          {r.readinessLevel}
                        </span>

                        <span className="text-xs text-gray-300">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3 bg-gray-50">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400">Skill match</p>
                            <p className="text-sm font-medium text-gray-800 mt-0.5">
                              {Number(r.skillMatchScore).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400">GPA weight</p>
                            <p className="text-sm font-medium text-gray-800 mt-0.5">
                              {Number(r.gpaWeight).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400">Project score</p>
                            <p className="text-sm font-medium text-gray-800 mt-0.5">
                              {Number(r.projectScore).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400">Company risk</p>
                            <p className="text-sm font-medium text-red-500 mt-0.5">
                              {Number(r.companyRiskScore).toFixed(1)}
                            </p>
                          </div>
                        </div>

                        {missing.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-2">Missing skills</p>
                            <div className="flex flex-wrap gap-2">
                              {missing.map((sk) => (
                                <span
                                  key={sk}
                                  className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600"
                                >
                                  ✗ {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <p className="text-xs text-gray-400">Recommendation</p>
                          <p className="text-sm text-gray-700 mt-0.5">
                            {r.recommendation}
                          </p>
                        </div>

                        {r.calculatedAt && (
                          <p className="text-xs text-gray-300">
                            Calculated:{" "}
                            {new Date(r.calculatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
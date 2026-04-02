import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import api from "../services/api";

const getRiskBadge = (level) => {
  const styles = {
    low:      "bg-green-50 text-green-700",
    medium:   "bg-amber-50 text-amber-700",
    high:     "bg-red-50 text-red-700",
    critical: "bg-red-100 text-red-900",
  };
  return styles[level?.toLowerCase()] || "bg-gray-100 text-gray-600";
};

const getReadinessColor = (score) => {
  if (score >= 80) return "text-teal-700";
  if (score >= 60) return "text-teal-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
};

const getReadinessLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  return "Low";
};

const getReadinessBarColor = (score) => {
  if (score >= 80) return "bg-teal-500";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
};

const MetricCard = ({ label, value, sub, color }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-medium ${color || "text-gray-900"}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Fetch all students and find the one matching logged-in user email
        const studentsRes = await api.get("/students");
        const allStudents = studentsRes.data.data;
        const matched = allStudents.find(
          (s) => s.email?.toLowerCase() === user?.email?.toLowerCase()
        );
        setStudent(matched || null);

        if (matched) {
          // Fetch readiness for this student
          try {
            const readinessRes = await api.get(`/readiness/student/${matched.studentId}`);
            setReadiness(readinessRes.data.data);
          } catch {
            setReadiness(null);
          }

          // Fetch applications for this student
          try {
            const appsRes = await api.get(`/applications/student/${matched.studentId}`);
            setApplications(appsRes.data.data || []);
          } catch {
            setApplications([]);
          }
        }

        // Fetch recent jobs
        const jobsRes = await api.get("/jobs");
        setJobs((jobsRes.data.data || []).slice(0, 5));

      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  const readinessScore = readiness?.finalReadiness
    ? Math.round(readiness.finalReadiness)
    : null;

  const skillMatch = readiness?.skillMatchScore
    ? Math.round(readiness.skillMatchScore)
    : null;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-medium text-gray-900">
          Welcome back, {user?.fullName?.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's your placement intelligence summary
        </p>
      </div>

      {/* Student not linked warning */}
      {!student && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
          Your account is not yet linked to a student profile. Contact your administrator.
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Readiness score"
          value={readinessScore !== null ? `${readinessScore}%` : "—"}
          sub={readinessScore !== null ? getReadinessLabel(readinessScore) : "No data yet"}
          color={readinessScore !== null ? getReadinessColor(readinessScore) : "text-gray-400"}
        />
        <MetricCard
          label="Skill match"
          value={skillMatch !== null ? `${skillMatch}%` : "—"}
          sub="vs applied jobs"
          color="text-purple-700"
        />
        <MetricCard
          label="GPA"
          value={student?.gpa ?? "—"}
          sub="out of 10"
        />
        <MetricCard
          label="Applications"
          value={applications.length}
          sub="total submitted"
        />
      </div>

      {/* Readiness progress bar */}
      {readinessScore !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Placement readiness</p>
            <span className={`text-sm font-medium ${getReadinessColor(readinessScore)}`}>
              {getReadinessLabel(readinessScore)} · {readinessScore}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getReadinessBarColor(readinessScore)}`}
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">0</span>
            <span className="text-xs text-gray-400">40 moderate</span>
            <span className="text-xs text-gray-400">60 good</span>
            <span className="text-xs text-gray-400">80 excellent</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent applications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Recent applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-400">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.applicationId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {app.jobTitle || `Job #${app.jobId}`}
                    </p>
                    <p className="text-xs text-gray-400">{app.companyName || "—"}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      app.status === "SELECTED"
                        ? "bg-green-50 text-green-700"
                        : app.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : app.status === "INTERVIEWED"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open jobs */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Open positions</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs available.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.jobId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{job.jobTitle}</p>
                    <p className="text-xs text-gray-400">
                      {job.companyName || "—"} · {job.location || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{job.jobType || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
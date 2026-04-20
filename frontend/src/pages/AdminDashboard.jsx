import { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, companies: 0, jobs: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [studentsRes, companiesRes, jobsRes, appsRes] = await Promise.allSettled([
          api.get("/students"),
          api.get("/companies"),
          api.get("/jobs"),
          api.get("/applications"),
        ]);
        setStats({
          students:     studentsRes.status === "fulfilled" ? (studentsRes.value.data?.data?.length ?? 0) : 0,
          companies:    companiesRes.status === "fulfilled" ? (companiesRes.value.data?.data?.length ?? 0) : 0,
          jobs:         jobsRes.status === "fulfilled" ? (jobsRes.value.data?.data?.length ?? 0) : 0,
          applications: appsRes.status === "fulfilled" ? (appsRes.value.data?.data?.length ?? 0) : 0,
        });
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Total students",    value: stats.students,     color: "text-teal-700" },
    { label: "Companies",         value: stats.companies,    color: "text-purple-700" },
    { label: "Active jobs",       value: stats.jobs,         color: "text-blue-700" },
    { label: "Applications",      value: stats.applications, color: "text-amber-700" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Admin dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">System overview — full analytics coming in Phase 27</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            {loading ? (
              <div className="animate-pulse h-8 w-12 bg-gray-200 rounded" />
            ) : (
              <p className={`text-2xl font-medium ${c.color}`}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center text-sm text-gray-400">
        Full admin analytics with charts, student table, and batch actions are being built in Phase 27.
      </div>
    </div>
  );
}
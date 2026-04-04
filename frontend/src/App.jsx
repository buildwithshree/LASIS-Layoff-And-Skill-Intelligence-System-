import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import Companies from "./pages/Companies";
import Jobs from "./pages/Jobs";
import MyReadiness from "./pages/MyReadiness";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import api from "./services/api";

const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-center">
      <h1 className="text-xl font-medium text-gray-800">{title}</h1>
      <p className="text-sm text-gray-400 mt-2">Coming up this session</p>
    </div>
  </div>
);

const ProtectedLayout = ({ children, allowedRoles }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

// Wraps student pages — redirects to /onboarding if no student profile linked
const StudentGuard = ({ children }) => {
  const { user, token } = useAuth();
  const [checking, setChecking] = useState(true);
  const [linked, setLinked]     = useState(false);

  useEffect(() => {
    if (!token || !user) { setChecking(false); return; }
    api.get("/students")
      .then((res) => {
        const students = res.data.data || [];
        const match = students.find(
          (s) => s.email?.toLowerCase() === user.email?.toLowerCase()
        );
        setLinked(!!match);
      })
      .catch(() => setLinked(false))
      .finally(() => setChecking(false));
  }, [token, user]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!linked) return <Navigate to="/onboarding" replace />;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Onboarding — student only, no Layout */}
          <Route path="/onboarding" element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Student — all guarded by StudentGuard */}
          <Route path="/dashboard" element={<StudentGuard><StudentDashboard /></StudentGuard>} />
          <Route path="/companies"  element={<StudentGuard><Companies /></StudentGuard>} />
          <Route path="/jobs"       element={<StudentGuard><Jobs /></StudentGuard>} />
          <Route path="/readiness"  element={<StudentGuard><MyReadiness /></StudentGuard>} />

          {/* Recruiter */}
          <Route path="/recruiter"    element={<ProtectedLayout allowedRoles={["RECRUITER"]}><PlaceholderPage title="Recruiter Dashboard" /></ProtectedLayout>} />
          <Route path="/applications" element={<ProtectedLayout allowedRoles={["RECRUITER"]}><PlaceholderPage title="Applications" /></ProtectedLayout>} />

          {/* Admin */}
          <Route path="/admin"          element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="Admin Dashboard" /></ProtectedLayout>} />
          <Route path="/admin/students" element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="All Students" /></ProtectedLayout>} />
          <Route path="/admin/companies" element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="All Companies" /></ProtectedLayout>} />
          <Route path="/admin/jobs"     element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="All Jobs" /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
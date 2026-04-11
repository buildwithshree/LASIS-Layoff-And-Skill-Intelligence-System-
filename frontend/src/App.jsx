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
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const ProtectedLayout = ({ children, allowedRoles }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route path="/dashboard"  element={<ProtectedLayout allowedRoles={["STUDENT"]}><StudentDashboard /></ProtectedLayout>} />
          <Route path="/companies"  element={<ProtectedLayout allowedRoles={["STUDENT"]}><Companies /></ProtectedLayout>} />
          <Route path="/jobs"       element={<ProtectedLayout allowedRoles={["STUDENT"]}><Jobs /></ProtectedLayout>} />
          <Route path="/readiness"  element={<ProtectedLayout allowedRoles={["STUDENT"]}><MyReadiness /></ProtectedLayout>} />

          {/* Recruiter */}
          <Route path="/recruiter"  element={<ProtectedLayout allowedRoles={["RECRUITER"]}><RecruiterDashboard /></ProtectedLayout>} />

          {/* Admin — single route, tabs handle sub-sections */}
          <Route path="/admin"      element={<ProtectedLayout allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
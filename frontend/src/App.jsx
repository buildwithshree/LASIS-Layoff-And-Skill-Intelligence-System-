import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";

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

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedLayout allowedRoles={["STUDENT"]}><PlaceholderPage title="Student Dashboard" /></ProtectedLayout>} />
          <Route path="/companies" element={<ProtectedLayout allowedRoles={["STUDENT"]}><PlaceholderPage title="Companies" /></ProtectedLayout>} />
          <Route path="/jobs" element={<ProtectedLayout allowedRoles={["STUDENT"]}><PlaceholderPage title="Jobs" /></ProtectedLayout>} />
          <Route path="/readiness" element={<ProtectedLayout allowedRoles={["STUDENT"]}><PlaceholderPage title="My Readiness" /></ProtectedLayout>} />

          {/* Recruiter */}
          <Route path="/recruiter" element={<ProtectedLayout allowedRoles={["RECRUITER"]}><PlaceholderPage title="Recruiter Dashboard" /></ProtectedLayout>} />
          <Route path="/applications" element={<ProtectedLayout allowedRoles={["RECRUITER"]}><PlaceholderPage title="Applications" /></ProtectedLayout>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="Admin Dashboard" /></ProtectedLayout>} />
          <Route path="/admin/students" element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="All Students" /></ProtectedLayout>} />
          <Route path="/admin/companies" element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="All Companies" /></ProtectedLayout>} />
          <Route path="/admin/jobs" element={<ProtectedLayout allowedRoles={["ADMIN"]}><PlaceholderPage title="All Jobs" /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
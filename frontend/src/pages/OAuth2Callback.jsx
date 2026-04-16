import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token    = searchParams.get("token");
    const email    = searchParams.get("email");
    const fullName = searchParams.get("fullName");
    const role     = searchParams.get("role");

    if (!token || !email || !role) {
      setError("Google sign-in failed. Missing credentials. Please try again.");
      return;
    }

    try {
      login({ email, fullName: fullName || email, role }, token);

      if (role === "STUDENT")   navigate("/dashboard", { replace: true });
      else if (role === "RECRUITER") navigate("/recruiter", { replace: true });
      else if (role === "ADMIN")     navigate("/admin",     { replace: true });
      else navigate("/login", { replace: true });
    } catch {
      setError("Sign-in failed. Please try again.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-md text-center space-y-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;
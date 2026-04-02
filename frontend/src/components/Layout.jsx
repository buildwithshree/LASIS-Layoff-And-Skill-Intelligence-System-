import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const studentNav = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Companies", path: "/companies" },
  { label: "Jobs", path: "/jobs" },
  { label: "My readiness", path: "/readiness" },
];

const recruiterNav = [
  { label: "Dashboard", path: "/recruiter" },
  { label: "Applications", path: "/applications" },
];

const adminNav = [
  { label: "Dashboard", path: "/admin" },
  { label: "Students", path: "/admin/students" },
  { label: "Companies", path: "/admin/companies" },
  { label: "Jobs", path: "/admin/jobs" },
];

const navByRole = {
  STUDENT: studentNav,
  RECRUITER: recruiterNav,
  ADMIN: adminNav,
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = navByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-lg font-medium text-gray-900">LASIS</p>
          <p className="text-xs text-gray-400 mt-0.5">Placement Intelligence</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-xs font-medium text-teal-700 flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 p-8">
        {children}
      </main>

    </div>
  );
};

export default Layout;
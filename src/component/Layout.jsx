import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaGauge,
  FaUserShield,
  FaFeather,
  FaLanguage,
  FaBookmark,
  FaNewspaper,
  FaCalendarDays,
  FaBookOpen,
  FaCircleQuestion,
  FaDownload,
  FaSliders,
  FaCircleInfo,
  FaTags,
  FaComments,
  FaRightFromBracket,
  FaChevronDown,
  FaBars,
  FaXmark
} from "react-icons/fa6";
import { useAuth } from "./AuthContext";

/* --------- Sidebar links (routes + roles preserved) --------- */
const sidebarLinks = [
  { label: "Dashboard", icon: FaGauge, path: "/dashboard", roles: ["superadmin"] },
  { label: "Admin", icon: FaUserShield, path: "/admin", roles: ["superadmin"] },
  { label: "Writers", icon: FaFeather, path: "/writers", roles: ["superadmin"] },
  { label: "Translators", icon: FaLanguage, path: "/translator", roles: ["superadmin"] },
  { label: "Languages", icon: FaLanguage, path: "/languages", roles: ["superadmin"] },
  { label: "Topics", icon: FaBookmark, path: "/topic", roles: ["superadmin", "admin"] },
  { label: "Articles", icon: FaNewspaper, path: "/viewarticle", roles: ["admin", "superadmin"] },
  { label: "Events", icon: FaCalendarDays, path: "/event", roles: ["superadmin", "admin"] },
  { label: "Questions List", icon: FaCircleQuestion, path: "/questionlist", roles: ["superadmin", "admin"] },
  { label: "Books List", icon: FaBookOpen, path: "/booklist", roles: ["superadmin", "admin"] },
  { label: "Book Downloads", icon: FaDownload, path: "/bookdownload", roles: ["superadmin"] },
  { label: "Home Books Slider", icon: FaSliders, path: "/home_book_slider", roles: ["superadmin"] },
  { label: "About Content", icon: FaCircleInfo, path: "/about-content", roles: ["superadmin"] },
  { label: "Tags", icon: FaTags, path: "/taglist", roles: ["superadmin"] },
  { label: "Feedback", icon: FaComments, path: "/feedback", roles: ["admin", "superadmin"] }
];

/* --------- Icon accent colors to mirror the HTML theme --------- */
const iconTone = {
  Dashboard: "text-blue-400",
  Admin: "text-red-400",
  Writers: "text-emerald-400",
  Translators: "text-cyan-400",
  Languages: "text-cyan-400",
  Topics: "text-indigo-400",
  Articles: "text-yellow-400",
  Events: "text-pink-400",
  "Books List": "text-green-400",
  "Book Downloads": "text-green-400",
  "Questions List": "text-orange-400",
  "Home Books Slider": "text-emerald-400",
  "About Content": "text-indigo-400",
  Tags: "text-indigo-400",
  Feedback: "text-orange-400"
};

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, fname, logout, loading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Outside click to close profile dropdown
  useEffect(() => {
    const onDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Protect routes: if no role, go login
  useEffect(() => {
    if (!loading && !userRole) navigate("/");
  }, [loading, userRole, navigate]);

  const currentTitle =
    (sidebarLinks.find((l) => l.path === location.pathname) || {}).label || "Dashboard";

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="bg-slate-100 h-screen w-screen overflow-hidden">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <div className="flex h-screen w-screen text-gray-800 overflow-hidden">
        {/* Sidebar — dark slate theme */}
        <aside
          className={`fixed top-0 left-0 z-40 w-64 bg-slate-900 flex flex-col h-screen transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative`}
        >
          {/* Brand row */}
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <button
              className="flex items-center gap-2"
              onClick={() => navigate("/dashboard")}
            >
              {/* Brand emblem (matches HTML feel) */}
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white grid place-items-center font-bold">
                MM
              </div>
              <span className="text-lg text-white font-bold">Admin Panel</span>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <FaXmark className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col mt-3 overflow-y-auto" id="sidebar-nav">
            {sidebarLinks
              .filter((link) => link.roles.includes(userRole))
              .map(({ label, icon: Icon, path }) => {
                const active = location.pathname === path;
                const tone = iconTone[label] || "text-slate-300";
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setSidebarOpen(false);
                    }}
                    className={`text-left flex items-center gap-3 px-4 py-2.5 text-slate-300 transition-all text-sm rounded-lg mx-2 my-0.5
                      ${active ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                  >
                    <Icon className={`w-4 h-4 ${tone}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
          </nav>

          {/* Logout */}
          <div className="mt-auto border-t border-slate-700 p-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-3 rounded-lg transition-colors hover:bg-red-700 shadow-md"
            >
              <FaRightFromBracket className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between bg-white border-b border-gray-200 px-5 py-3 shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="md:hidden text-gray-600 hover:text-gray-800"
                aria-label="Open sidebar"
              >
                <FaBars className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">{currentTitle}</h1>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center space-x-2 p-1.5 rounded-lg transition-all hover:bg-gray-100 ring-1 ring-transparent hover:ring-gray-200"
                onClick={() => setProfileDropdownOpen((v) => !v)}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-semibold text-sm">
                  {(fname || "A").charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-800">
                  {fname || "Admin"}
                </span>
                <FaChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      navigate("/profiledetail");
                      setProfileDropdownOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      navigate("/admin-settings");
                      setProfileDropdownOpen(false);
                    }}
                  >
                    Admin Setting
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      navigate("/change-password");
                      setProfileDropdownOpen(false);
                    }}
                  >
                    Password
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-3 md:p-5 lg:p-6 overflow-y-auto" id="main-content-area">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;

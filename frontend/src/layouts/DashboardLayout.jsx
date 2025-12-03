import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { buildApiUrl } from "../utils/fetchResource";
import { clearPortalRole, getPortalRole } from "../utils/portalRole";
import {
  FiGrid,
  FiMapPin,
  FiCalendar,
  FiBell,
  FiMessageCircle,
  FiShield,
  FiFileText,
  FiUsers,
  FiUser,
  FiSettings,
  FiClipboard,
  FiMenu,
  FiX,
} from "react-icons/fi";
import AiAssistantWidget from "../components/AiAssistantWidget";

const assistantVideoSrc = (import.meta.env.VITE_ASSISTANT_WIDGET_VIDEO || "").trim();

const USER_NAVIGATION = [
  {
    title: "Main Menu",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: FiGrid, end: true },
      { label: "Lost & Found", to: "/dashboard/lost-and-found", icon: FiMapPin },
      { label: "Events", to: "/dashboard/events", icon: FiCalendar },
      { label: "Announcements", to: "/dashboard/announcements", icon: FiBell },
      { label: "Discussions", to: "/dashboard/discussions", icon: FiMessageCircle },
      { label: "Emergency Alerts", to: "/dashboard/emergency-alerts", icon: FiShield },
      { label: "Notes Sharing", to: "/dashboard/notes", icon: FiFileText },
      { label: "Skill Exchange", to: "/dashboard/skills", icon: FiUsers },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Profile", to: "/dashboard/profile", icon: FiUser }],
  },
];

const ADMIN_NAVIGATION = [
  {
    title: "Administration",
    items: [
      { label: "Overview", to: "/dashboard", icon: FiGrid, end: true },
      { label: "Users", to: "/dashboard/users", icon: FiUsers },
      { label: "Lost & Found Control", to: "/dashboard/manage/lost-found", icon: FiMapPin },
      { label: "Events Manager", to: "/dashboard/manage/events", icon: FiCalendar },
      { label: "Announcements Manager", to: "/dashboard/manage/announcements", icon: FiBell },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Emergency Alerts", to: "/dashboard/emergency-alerts", icon: FiShield },
      { label: "Notes Library", to: "/dashboard/notes", icon: FiFileText },
      { label: "Discussions", to: "/dashboard/discussions", icon: FiMessageCircle },
      { label: "Resources", to: "/dashboard/skills", icon: FiClipboard },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Profile", to: "/dashboard/profile", icon: FiUser }],
  },
];

function NavigationSections({ sections, onNavigate }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="px-4 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "text-gray-600 hover:bg-orange-50"
                    }`
                  }
                  onClick={onNavigate}
                >
                  <Icon className="text-lg" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default function DashboardLayout({ role: incomingRole = "user" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = React.useState(incomingRole);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (incomingRole) {
      setRole(incomingRole);
    } else {
      const storedRole = getPortalRole({ fallbackToLegacy: true }) || "user";
      setRole(storedRole);
    }
  }, [incomingRole]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = React.useCallback(async () => {
    try {
      const portalRole = getPortalRole();
      await fetch(buildApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: portalRole ? { "X-Portal-Role": portalRole } : undefined,
      });
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      clearPortalRole();
      navigate("/");
    }
  }, [navigate]);

  const sections = role === "admin" ? ADMIN_NAVIGATION : USER_NAVIGATION;
  const openMobileMenu = React.useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = React.useCallback(() => setMobileMenuOpen(false), []);

  const brandBlock = (
    <div className="text-center">
      <span className="block text-xl font-bold tracking-tight text-orange-500">
        Campus Connect
      </span>
      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
        <FiSettings className="text-sm" />
        {role === "admin" ? "Admin" : "Student"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-orange-100 bg-white/95 px-4 py-3 shadow-sm lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={openMobileMenu}
          className="rounded-full border border-orange-100 p-2 text-orange-500 shadow-sm"
        >
          <FiMenu className="text-xl" />
        </button>
        {brandBlock}
        <span className="w-9" aria-hidden="true" />
      </header>

      <div className="flex">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-orange-50 lg:bg-white/95 lg:shadow-sm">
          <div className="flex h-20 items-center justify-center border-b border-orange-50">
            {brandBlock}
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavigationSections sections={sections} />
          </div>
          <div className="px-4 pb-4 pt-2">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white transition hover:bg-orange-400"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10">
          <Outlet context={{ role }} />
          <AiAssistantWidget context={{ role }} videoSrc={assistantVideoSrc} />
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/30" onClick={closeMobileMenu} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-orange-50 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-orange-50 px-4 py-3">
              {brandBlock}
              <button
                type="button"
                aria-label="Close navigation"
                onClick={closeMobileMenu}
                className="rounded-full border border-orange-100 p-2 text-orange-500 shadow-sm"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavigationSections sections={sections} onNavigate={closeMobileMenu} />
            </div>
            <div className="border-t border-orange-50 px-4 pb-5 pt-3">
              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white transition hover:bg-orange-400"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

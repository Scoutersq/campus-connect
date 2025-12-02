import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "react-icons/fi";
import AiAssistantWidget from "../components/AiAssistantWidget";

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

export default function DashboardLayout({ role: incomingRole = "user" }) {
  const navigate = useNavigate();
  const [role, setRole] = React.useState(incomingRole);

  React.useEffect(() => {
    if (incomingRole) {
      setRole(incomingRole);
    } else {
      const storedRole = getPortalRole({ fallbackToLegacy: true }) || "user";
      setRole(storedRole);
    }
  }, [incomingRole]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 w-64 border-r border-orange-50 bg-white/95 shadow-sm">
          <div className="flex h-20 items-center justify-center border-b border-orange-50">
            <div className="text-center">
              <span className="block text-xl font-bold tracking-tight text-orange-500">
                Campus Connect
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
                <FiSettings className="text-sm" />
                {role === "admin" ? "Admin" : "Student"}
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
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
                      >
                        <Icon className="text-lg" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="px-4 pb-4 pt-2">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white transition hover:bg-orange-400"
            >
              Logout
            </button>
          </div>
        </aside>
        <main className="ml-64 flex-1 p-10">
          <Outlet context={{ role }} />
          <AiAssistantWidget context={{ role }} />
        </main>
      </div>
    </div>
  );
}

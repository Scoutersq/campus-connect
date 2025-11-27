
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FiPlusCircle,
  FiAlertTriangle,
  FiSearch,
} from "react-icons/fi";

const SIDEBAR_SECTIONS = [
  {
    title: "Main Menu",
    items: [
      { label: "Dashboard", key: "home", roles: ["user", "admin"], icon: FiGrid },
      { label: "Lost & Found", key: "lostfound", roles: ["user", "admin"], icon: FiMapPin },
      { label: "Events", key: "events", roles: ["user", "admin"], icon: FiCalendar },
      { label: "Announcements", key: "notifications", roles: ["user", "admin"], icon: FiBell },
      { label: "Discussions", key: "discussion", roles: ["user", "admin"], icon: FiMessageCircle },
      { label: "Emergency Alerts", key: "emergency", roles: ["user", "admin"], icon: FiShield },
      { label: "Notes Sharing", key: "notes", roles: ["user", "admin"], icon: FiFileText },
      { label: "Skill Exchange", key: "skills", roles: ["user", "admin"], icon: FiUsers },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Profile", key: "profile", roles: ["user", "admin"], icon: FiUser }],
  },
];

export default function DashboardPage() {
      const [role, setRole] = useState("user");
      const [active, setActive] = useState("home");
      const [profile, setProfile] = useState(null);
      const [lostSample, setLostSample] = useState([]);
      const [foundSample, setFoundSample] = useState([]);
      const [eventList, setEventList] = useState([]);
      const [announcementList, setAnnouncementList] = useState([]);
      const [alertList, setAlertList] = useState([]);
      const [dashboardLoading, setDashboardLoading] = useState(true);
      const [dashboardError, setDashboardError] = useState("");
      const [pendingAction, setPendingAction] = useState(null);
      const navigate = useNavigate();

      useEffect(() => {
        const storedRole = localStorage.getItem("cc_role");
        if (storedRole) {
          setRole(storedRole);
        } else {
          setRole("user");
        }
      }, []);

      const fetchResource = React.useCallback(
        async (url, fallback, options = {}) => {
          try {
            const response = await fetch(url, { credentials: "include", ...options });

            if (!response.ok) {
              if (response.status === 404) {
                return { data: fallback, error: null };
              }

              let message = `Failed to fetch ${url}`;
              try {
                const errorBody = await response.json();
                if (errorBody?.message) {
                  message = errorBody.message;
                }
              } catch {
                // Ignore JSON parse issues on error responses
              }

              return { data: fallback, error: message };
            }

            const parsed = await response.json();
            return { data: parsed, error: null };
          } catch (error) {
            if (error.name === "AbortError") {
              return { data: fallback, error: null };
            }
            return { data: fallback, error: error.message || `Failed to fetch ${url}` };
          }
        },
        []
      );

      useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        const loadDashboard = async () => {
          setDashboardLoading(true);
          setDashboardError("");

          let encounteredError = false;

          const profileResult = await fetchResource("/api/profile/me", null, { signal: controller.signal });
          if (profileResult.error) encounteredError = true;

          const lostResult = await fetchResource("/api/lost/preview", { preview: [] }, { signal: controller.signal });
          if (lostResult.error) encounteredError = true;

          const foundResult = await fetchResource("/api/found/preview", { preview: [] }, { signal: controller.signal });
          if (foundResult.error) encounteredError = true;

          const eventsResult = await fetchResource("/api/events", { events: [] }, { signal: controller.signal });
          if (eventsResult.error) encounteredError = true;

          const notificationsResult = await fetchResource("/api/notifications", { notifications: [] }, { signal: controller.signal });
          if (notificationsResult.error) encounteredError = true;

          const alertsResult = await fetchResource("/api/emergency/active", { data: [] }, { signal: controller.signal });
          if (alertsResult.error) encounteredError = true;

          if (cancelled) {
            return;
          }

          setProfile(profileResult.data?.profile ?? null);
          setLostSample(lostResult.data?.preview ?? []);
          setFoundSample(foundResult.data?.preview ?? []);
          setEventList(eventsResult.data?.events ?? []);
          setAnnouncementList(notificationsResult.data?.notifications ?? []);
          setAlertList(alertsResult.data?.data ?? []);

          if (encounteredError) {
            setDashboardError("Some dashboard data could not be loaded. Please refresh to retry.");
          }

          setDashboardLoading(false);
        };

        loadDashboard();

        return () => {
          cancelled = true;
          controller.abort();
        };
      }, [fetchResource]);

      const handleLogout = () => {
        localStorage.removeItem("cc_role");
        navigate("/login");
      };

      const handleQuickAction = (actionKey) => {
        switch (actionKey) {
          case "report":
            setActive("lostfound");
            setPendingAction("report-lost");
            break;
          case "lostfound":
            setActive("lostfound");
            break;
          case "skills":
            setActive("skills");
            break;
          case "notes":
            setActive("notes");
            break;
          case "announcements":
            setActive("notifications");
            break;
          case "events":
            setActive("events");
            break;
          case "alerts":
            setActive("emergency");
            break;
          default:
            break;
        }
      };

      const handlePendingActionClear = React.useCallback(() => {
        setPendingAction(null);
      }, []);

      const handleLostFoundData = React.useCallback(({ lost = [], found = [] }) => {
        setLostSample(lost);
        setFoundSample(found);
      }, []);

      const sidebarSections = SIDEBAR_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(role)),
      }));

      const SECTION_TITLES = {
        home: "Dashboard",
        profile: "Your Profile",
        events: "Events",
        notifications: "Announcements",
        discussion: "Discussions",
        emergency: "Emergency Alerts",
        notes: "Notes Sharing",
        skills: "Skill Exchange",
        mentorship: "Mentorship",
      };

      return (
        <div className="min-h-screen flex bg-gray-50">
          {/* Sidebar */}
          <aside className="w-64 bg-white/95 border-r border-orange-50 shadow-sm flex flex-col fixed inset-y-0 left-0">
            <div className="h-20 flex items-center justify-center border-b border-orange-50">
              <span className="font-bold text-xl text-orange-500 tracking-tight">Campus Connect</span>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {sidebarSections.map((section) => (
                <div key={section.title} className="px-4 py-5">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">{section.title}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = active === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActive(item.key)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-orange-100 text-orange-600 shadow-sm"
                              : "text-gray-600 hover:bg-orange-50"
                          }`}
                        >
                          <Icon className={`text-lg ${isActive ? "text-orange-600" : "text-gray-400"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="px-4 pb-4 pt-2">
              <button
                className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-400 transition"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </aside>
          {/* Main Content */}
          <main className="flex-1 p-10 ml-64">
            {active === "lostfound" ? (
              <LostFoundSection
                role={role}
                pendingAction={pendingAction}
                onActionHandled={handlePendingActionClear}
                onDataRefresh={handleLostFoundData}
              />
            ) : active === "home" ? (
              <DashboardOverview
                profile={profile}
                lostItems={lostSample}
                foundItems={foundSample}
                events={eventList}
                announcements={announcementList}
                alerts={alertList}
                loading={dashboardLoading}
                error={dashboardError}
                onQuickAction={handleQuickAction}
              />
            ) : (
              <SectionPlaceholder title={SECTION_TITLES[active] || "Dashboard"} />
            )}
          </main>
        </div>
      );
    }

    function DashboardOverview({
  profile,
  lostItems,
  foundItems,
  events,
  announcements,
  alerts,
  loading,
  error,
  onQuickAction,
}) {
  const fullName = profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() : "";
  const greetingName = fullName || profile?.email || "Explorer";
  const lostCount = lostItems.length;
  const foundCount = foundItems.length;
  const eventsCount = events.length;
  const announcementsCount = announcements.length;
  const nextEvent = events[0];

  const formatDate = (value, withYear = false) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const options = withYear
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const buildActivityEntry = (item, type) => {
    const timestamp = type === "Lost" ? item.dateLost || item.createdAt : item.dateFound || item.createdAt;
    return {
      id: item._id,
      type,
      title: item.title,
      timestamp,
      location: type === "Lost" ? item.location : item.locationFound,
      contact: item.contact,
    };
  };

  const activityEntries = React.useMemo(() => {
    const entries = [
      ...lostItems.map((item) => buildActivityEntry(item, "Lost")),
      ...foundItems.map((item) => buildActivityEntry(item, "Found")),
    ];

    return entries
      .sort((a, b) => (new Date(b.timestamp).getTime() || 0) - (new Date(a.timestamp).getTime() || 0))
      .slice(0, 5);
  }, [lostItems, foundItems]);

  const yourReports = React.useMemo(() => {
    if (!profile?.email) {
      return [];
    }

    const email = profile.email.trim().toLowerCase();
    const mine = [
      ...lostItems
        .filter((item) => item.contact?.trim().toLowerCase() === email)
        .map((item) => buildActivityEntry(item, "Lost")),
      ...foundItems
        .filter((item) => item.contact?.trim().toLowerCase() === email)
        .map((item) => buildActivityEntry(item, "Found")),
    ];

    return mine
      .sort((a, b) => (new Date(b.timestamp).getTime() || 0) - (new Date(a.timestamp).getTime() || 0))
      .slice(0, 3);
  }, [profile, lostItems, foundItems]);

  const quickActions = React.useMemo(
    () => [
      {
        key: "report",
        label: "Report Lost Item",
        description: "Log something you misplaced and notify campus.",
        icon: FiPlusCircle,
        accent: "bg-orange-100 text-orange-600",
      },
      {
        key: "lostfound",
        label: "Browse Lost & Found",
        description: "Review new reports from the community.",
        icon: FiMapPin,
        accent: "bg-red-100 text-red-600",
      },
      {
        key: "skills",
        label: "Skill Exchange",
        description: "Offer expertise or request mentorship.",
        icon: FiUsers,
        accent: "bg-blue-100 text-blue-600",
      },
      {
        key: "notes",
        label: "Share Notes",
        description: "Upload resources to help classmates.",
        icon: FiFileText,
        accent: "bg-emerald-100 text-emerald-600",
      },
    ],
    []
  );

  const severityStyles = {
    info: "border border-blue-100 bg-blue-50 text-blue-700",
    warning: "border border-amber-100 bg-amber-50 text-amber-700",
    critical: "border border-red-100 bg-red-50 text-red-700",
  };

  const statsCards = [
    {
      label: "Lost Items Logged",
      value: lostCount,
      helper: lostCount ? `${Math.min(lostCount, 5)} new this week` : "No open reports",
      accent: "bg-red-100 text-red-600",
    },
    {
      label: "Found Items Reported",
      value: foundCount,
      helper: foundCount ? "Coordinate pickup with owners" : "Nothing waiting pickup",
      accent: "bg-orange-100 text-orange-600",
    },
    {
      label: "Upcoming Events",
      value: eventsCount,
      helper: nextEvent ? `${formatDate(nextEvent.date, true)} · ${nextEvent.title}` : "No events scheduled",
      accent: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Announcements",
      value: announcementsCount,
      helper: announcementsCount ? "Stay current with campus news" : "All quiet for now",
      accent: "bg-emerald-100 text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-8 animate-pulse">
          <div className="h-5 w-40 bg-orange-100 rounded mb-4" />
          <div className="h-4 w-2/3 bg-orange-50 rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-28 bg-white border border-orange-100 rounded-xl shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="border border-red-100 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <section className="bg-white border border-orange-100 rounded-xl shadow-sm p-8">
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-1">{greetingName}</h2>
        <p className="text-gray-500 mt-2">
          Here is a quick snapshot of what is happening around campus today.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => (
          <div key={card.label} className="bg-white border border-orange-100 rounded-xl shadow-sm p-6">
            <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${card.accent}`}>
              {card.label}
            </span>
            <p className="text-3xl font-bold text-gray-900 mt-4">{card.value}</p>
            <p className="text-sm text-gray-500 mt-2">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Quick actions</h3>
              <button
                type="button"
                onClick={() => onQuickAction?.("announcements")}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                Go to announcements
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => onQuickAction?.(action.key)}
                    className="flex items-start gap-3 rounded-xl border border-orange-100 bg-white hover:bg-orange-50 transition px-4 py-4 text-left"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${action.accent}`}>
                      <Icon className="text-lg" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-800">{action.label}</span>
                      <span className="block text-xs text-gray-500 mt-1">{action.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent activity</h3>
            {activityEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded yet. Report something to get started.</p>
            ) : (
              <ul className="space-y-3">
                {activityEntries.map((entry) => (
                  <li
                    key={`${entry.type}-${entry.id}`}
                    className="flex items-start justify-between rounded-lg border border-orange-100 px-4 py-3"
                  >
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-gray-800">{entry.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.type} • {entry.location || "Location unavailable"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">{formatDate(entry.timestamp, true)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 px-4 py-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Your reports</h4>
              {yourReports.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Reports you submit will appear here for quick follow-up.
                </p>
              ) : (
                <ul className="space-y-2">
                  {yourReports.map((entry) => (
                    <li key={`${entry.type}-mine-${entry.id}`} className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">{entry.title}</span> • {entry.type} • {formatDate(entry.timestamp, true)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Emergency alerts</h3>
              <button
                type="button"
                onClick={() => onQuickAction?.("alerts")}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 && (
                <p className="text-sm text-gray-500">No active alerts right now. Stay safe!</p>
              )}
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert._id}
                  className={`rounded-lg px-4 py-3 text-sm ${severityStyles[alert.severity] || severityStyles.info}`}
                >
                  <p className="font-semibold flex items-center gap-2">
                    <FiAlertTriangle className="text-base" />
                    {alert.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{alert.message}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
                    {alert.severity} • {formatDate(alert.createdAt, true)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Announcements</h3>
              <button
                type="button"
                onClick={() => onQuickAction?.("announcements")}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                See all
              </button>
            </div>
            <div className="space-y-3">
              {announcements.length === 0 && (
                <p className="text-sm text-gray-500">No announcements yet. Check back later today.</p>
              )}
              {announcements.slice(0, 3).map((note) => {
                const preview = note.message?.length > 120 ? `${note.message.slice(0, 120)}…` : note.message;
                return (
                  <div key={note._id} className="rounded-lg border border-orange-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{preview}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionPlaceholder({ title }) {
  return (
    <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-10 max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-500">
        This section is under construction. Explore the other modules from the sidebar in the meantime.
      </p>
    </div>
  );
}

function LostFoundSection({ role, pendingAction, onActionHandled = () => {}, onDataRefresh = () => {} }) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [showLostForm, setShowLostForm] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [lostItems, setLostItems] = React.useState([]);
  const [foundItems, setFoundItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);

  const parsePayload = React.useCallback(async (response) => {
    if (response.status === 404) {
      return { preview: [] };
    }

    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }

    if (!response.ok) {
      throw new Error(body?.message || "Failed to fetch lost & found data.");
    }

    return body;
  }, []);

  const loadData = React.useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const [lostResponse, foundResponse] = await Promise.all([
          fetch("/api/lost/preview", { credentials: "include", signal }),
          fetch("/api/found/preview", { credentials: "include", signal }),
        ]);

        const lostData = await parsePayload(lostResponse);
        const foundData = await parsePayload(foundResponse);

        const lostList = Array.isArray(lostData?.preview) ? lostData.preview : [];
        const foundList = Array.isArray(foundData?.preview) ? foundData.preview : [];

        setLostItems(lostList);
        setFoundItems(foundList);
        onDataRefresh({ lost: lostList, found: foundList });
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message || "Unable to load lost and found items.");
      } finally {
        setLoading(false);
      }
    },
    [onDataRefresh, parsePayload]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadData, refreshKey]);

  React.useEffect(() => {
    if (pendingAction === "report-lost") {
      setShowLostForm(true);
      onActionHandled();
    }
  }, [pendingAction, onActionHandled]);

  const triggerRefresh = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const decoratedItems = React.useMemo(() => {
    const lostDecorated = lostItems.map((item) => ({ ...item, _type: "lost" }));
    const foundDecorated = foundItems.map((item) => ({ ...item, _type: "found" }));
    return [...lostDecorated, ...foundDecorated];
  }, [lostItems, foundItems]);

  const filteredItems = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return decoratedItems
      .filter((item) => {
        if (filter !== "all" && item._type !== filter) {
          return false;
        }

        if (!term) return true;

        const textFields = [item.title, item.description, item.category, item.location, item.locationFound, item.contact]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return textFields.some((value) => value.includes(term));
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateLost || a.dateFound || a.createdAt || 0).getTime();
        const dateB = new Date(b.dateLost || b.dateFound || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [decoratedItems, filter, search]);

  const itemsThisWeek = React.useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return decoratedItems.filter((item) => {
      const timestamp = new Date(item.dateLost || item.dateFound || item.createdAt || 0).getTime();
      return timestamp >= oneWeekAgo;
    }).length;
  }, [decoratedItems]);

  const handleViewDetails = React.useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleFormClose = React.useCallback(() => {
    setShowLostForm(false);
  }, []);

  const handleFormSuccess = React.useCallback(() => {
    setShowLostForm(false);
    triggerRefresh();
  }, [triggerRefresh]);

  const summaryCards = React.useMemo(
    () => [
      {
        label: "Open Lost Reports",
        value: lostItems.length,
        helper: lostItems.length ? `${Math.min(lostItems.length, 5)} needs attention` : "All caught up",
        accent: "bg-red-100 text-red-600",
      },
      {
        label: "Found Items Logged",
        value: foundItems.length,
        helper: foundItems.length ? "Coordinate return with owners" : "No pickups pending",
        accent: "bg-orange-100 text-orange-600",
      },
      {
        label: "New This Week",
        value: itemsThisWeek,
        helper: itemsThisWeek ? "Keep an eye on recent activity" : "No new reports this week",
        accent: "bg-indigo-100 text-indigo-600",
      },
    ],
    [foundItems.length, itemsThisWeek, lostItems.length]
  );

  const renderItemCard = (item) => {
    const badgeStyles =
      item._type === "lost"
        ? "bg-red-100 text-red-600 border border-red-200"
        : "bg-orange-100 text-orange-600 border border-orange-200";

    const locationText = item._type === "lost" ? item.location : item.locationFound;
    const dateValue = item._type === "lost" ? item.dateLost : item.dateFound;

    const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString() : "—";

    return (
      <div key={item._id} className="bg-white border border-orange-100 rounded-xl shadow-sm p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500">{locationText || "Location not provided"}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${badgeStyles}`}>{item._type}</span>
        </div>
        <p className="text-sm text-gray-600 max-h-20 overflow-hidden">{item.description || "No description provided."}</p>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div>
            <p className="font-semibold text-gray-700">Category</p>
            <p>{item.category || "—"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Reported</p>
            <p>{formattedDate}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Contact</p>
            <p>{item.contact || "—"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Status</p>
            <p>{item.status || "Pending"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleViewDetails(item)}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
        >
          View Details
        </button>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[90vh] bg-[#FFF8F3] px-3 sm:px-6 lg:px-10 py-6 rounded-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Lost &amp; Found</h2>
          <p className="text-gray-500 text-sm sm:text-base">Help reunite items with their owners.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            Refresh
          </button>
          {role === "user" && (
            <button
              type="button"
              onClick={() => setShowLostForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400"
            >
              <FiPlusCircle className="text-lg" />
              Report Item
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{card.value}</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${card.accent}`}>
                {card.helper}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-orange-100 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <FiSearch className="text-lg text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by item, location, or contact"
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {["all", "lost", "found"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-orange-100 hover:bg-orange-50"
                }`}
              >
                {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-48 rounded-xl border border-orange-100 bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="h-4 w-28 rounded bg-orange-100" />
              <div className="mt-4 h-3 w-3/4 rounded bg-orange-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-orange-100" />
              <div className="mt-6 h-8 w-full rounded bg-orange-100" />
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full rounded-xl border border-orange-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            {search || filter !== "all"
              ? "No items match your current filters."
              : "No lost or found items have been reported yet."}
          </div>
        ) : (
          filteredItems.map((item) => renderItemCard(item))
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    selectedItem._type === "lost"
                      ? "bg-red-100 text-red-600"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {selectedItem._type}
                </span>
                <h3 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{selectedItem.description || "No description provided."}</p>
              {selectedItem.image && (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="h-56 w-full rounded-xl object-cover"
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-700">Location</p>
                  <p>{selectedItem._type === "lost" ? selectedItem.location : selectedItem.locationFound || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Date</p>
                  <p>
                    {selectedItem._type === "lost"
                      ? selectedItem.dateLost
                        ? new Date(selectedItem.dateLost).toLocaleDateString()
                        : "—"
                      : selectedItem.dateFound
                      ? new Date(selectedItem.dateFound).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Contact</p>
                  <p>{selectedItem.contact || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Reported On</p>
                  <p>{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLostForm && (
        <ReportItemForm
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

function ReportItemForm({ onClose, onSuccess }) {
  const [category, setCategory] = React.useState("lost");
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    location: "",
    contact: "",
    image: "",
    date: "",
  });
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setForm({
      title: "",
      description: "",
      location: "",
      contact: "",
      image: "",
      date: "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      let payload;
      let endpoint;
      if (category === "lost") {
        payload = {
          title: form.title,
          description: form.description,
          location: form.location,
          contact: form.contact,
          dateLost: form.date ? new Date(form.date).toISOString() : undefined,
        };
        if (form.image && form.image.trim() !== "") payload.image = form.image;
        endpoint = "/api/lost/report";
      } else {
        payload = {
          title: form.title,
          description: form.description,
          location: form.location,
          contact: form.contact,
          date: form.date ? new Date(form.date).toISOString() : undefined,
        };
        // Only include image if it's a non-empty valid URL
        if (form.image && form.image.trim() !== "") {
          try {
            new URL(form.image);
            payload.image = form.image;
          } catch {
            setError("Image must be a valid URL.");
            setLoading(false);
            return;
          }
        }
        // If image is empty or whitespace, do NOT include it in the payload
        endpoint = "/api/found/report";
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to report item");
      setSuccess("Item reported successfully.");
      setForm({ title: "", description: "", location: "", contact: "", image: "", date: "" });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf7f2] py-8">
      <div className="w-full max-w-xl bg-white rounded-xl border border-orange-100 shadow p-8">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="flex items-center gap-2 mb-6 px-6 py-2 bg-white text-orange-500 border border-orange-500 rounded-lg font-medium shadow transition-colors duration-150 hover:bg-orange-500 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Lost &amp; Found
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Report Item</h1>
        <p className="text-gray-500 mb-6">Help us reunite items with their owners</p>
        <div className="bg-[#fff8f3] border border-orange-100 rounded-lg p-6 mb-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Item Details</h2>
          <p className="text-gray-400 text-sm mb-4">Provide as much detail as possible</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g., Blue Backpack" className="w-full px-3 py-2 rounded border" />
            </div>
            {/* Category (Lost/Found) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={category} onChange={handleCategoryChange} required className="w-full rounded border px-3 py-2">
                <option value="">Select category</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g., Library 2nd Floor" className="w-full px-3 py-2 rounded border" />
            </div>
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input name="date" value={form.date} onChange={handleChange} required type="date" className="w-full px-3 py-2 rounded border" placeholder="dd-mm-yyyy" />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Provide detailed description..." className="w-full px-3 py-2 rounded border min-h-[80px]" />
            </div>
            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information</label>
              <input name="contact" value={form.contact} onChange={handleChange} required placeholder="your.email@campus.edu" className="w-full px-3 py-2 rounded border" />
            </div>
            {/* Image (hidden, not in UI, but still in form state) */}
            <input name="image" value={form.image} onChange={handleChange} type="hidden" />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold py-2 rounded mt-2 hover:from-orange-500 hover:to-orange-700 transition" disabled={loading}>
              {loading ? "Reporting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { apiFetch, fetchResource } from "../utils/fetchResource";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  FiClock,
  FiCheck,
  FiTag,
  FiPhone,
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

const EMERGENCY_CONTACTS = [
  {
    id: "security",
    label: "Campus Security",
    phone: "(555) 123-4567",
    tel: "5551234567",
    availability: "24/7",
    description: "Immediate response for safety concerns and on-campus incidents.",
  },
  {
    id: "medical",
    label: "Medical Emergency",
    phone: "(555) 123-4568",
    tel: "5551234568",
    availability: "24/7",
    description: "Urgent medical assistance from campus health services.",
  },
  {
    id: "counseling",
    label: "Counseling Services",
    phone: "(555) 123-4569",
    tel: "5551234569",
    availability: "Mon–Fri 9-5",
    description: "Emotional support and crisis counseling for students.",
  },
];

const SAFETY_RESOURCES = [
  {
    title: "Emergency Assembly Points",
    description: "Locate the nearest assembly points and evacuation routes across campus.",
  },
  {
    title: "Safety Guidelines",
    description: "Review recommended steps to stay safe during severe weather or incidents.",
  },
  {
    title: "Emergency Preparedness",
    description: "Tips for building a personal safety kit and campus emergency contacts list.",
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
      const [announcementMeta, setAnnouncementMeta] = useState({ count: 0, unreadCount: 0 });
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

          const notificationsResult = await fetchResource(
            "/api/notifications",
            { notifications: [], count: 0, unreadCount: 0 },
            { signal: controller.signal }
          );
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
          const announcementsPayload = notificationsResult.data ?? {};
          const announcementsList = announcementsPayload.notifications ?? [];
          setAnnouncementList(announcementsList);
          setAnnouncementMeta({
            count: announcementsPayload.count ?? announcementsList.length,
            unreadCount: announcementsPayload.unreadCount ?? 0,
          });
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
      }, []);

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

      const handleEventsSnapshot = React.useCallback((events = []) => {
        setEventList(events);
      }, []);

      const handleAnnouncementsSync = React.useCallback(({ notifications, meta } = {}) => {
        if (Array.isArray(notifications)) {
          setAnnouncementList(notifications);
        }
        if (meta) {
          setAnnouncementMeta((prev) => ({ ...prev, ...meta }));
        }
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
            ) : active === "notifications" ? (
              <AnnouncementsSection
                role={role}
                announcements={announcementList}
                meta={announcementMeta}
                onAnnouncementsChange={handleAnnouncementsSync}
              />
            ) : active === "events" ? (
              <EventsSection role={role} onEventsUpdate={handleEventsSnapshot} />
            ) : active === "emergency" ? (
              <EmergencySection
                alerts={alertList}
                loading={dashboardLoading}
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

  const loadData = React.useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const [lostResult, foundResult] = await Promise.all([
          fetchResource("/api/lost/preview", { preview: [] }, { signal }),
          fetchResource("/api/found/preview", { preview: [] }, { signal }),
        ]);

        const lostList = Array.isArray(lostResult.data?.preview) ? lostResult.data.preview : [];
        const foundList = Array.isArray(foundResult.data?.preview) ? foundResult.data.preview : [];

        setLostItems(lostList);
        setFoundItems(foundList);
        onDataRefresh({ lost: lostList, found: foundList });

        if (lostResult.error || foundResult.error) {
          setError(lostResult.error || foundResult.error || "Unable to load lost and found items.");
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }
        setError(err?.message || "Unable to load lost and found items.");
      } finally {
        setLoading(false);
      }
    },
    [onDataRefresh]
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

function EventsSection({ role, onEventsUpdate = () => {}, onCreateEvent }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState(null);
  const [banner, setBanner] = React.useState(null);
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  const handleCreateClick = React.useCallback(() => {
    if (typeof onCreateEvent === "function") {
      onCreateEvent();
    } else {
      setBanner({ type: "success", message: "Use the admin portal to add a new event." });
    }
  }, [onCreateEvent, setBanner]);

  const loadEvents = React.useCallback(async () => {
    setLoading(true);
    setBanner(null);
    try {
      const result = await fetchResource("/api/events", { events: [] });

      if (result.error) {
        throw new Error(result.error || "Failed to load events.");
      }

      setEvents(Array.isArray(result.data?.events) ? result.data.events : []);
    } catch (error) {
      setBanner({ type: "error", message: error?.message || "Failed to load events." });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  React.useEffect(() => {
    if (!loading) {
      onEventsUpdate(events);
    }
  }, [events, loading, onEventsUpdate]);

  const handleRsvp = React.useCallback(
    async (eventId, action) => {
      setProcessingId(eventId);
      setBanner(null);

      try {
        const response = await apiFetch(`/api/events/${eventId}/rsvp`, {
          method: action === "cancel" ? "DELETE" : "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to update RSVP status.");
        }

        if (data.event) {
          setEvents((prev) => {
            const exists = prev.some((entry) => entry._id === data.event._id);
            if (exists) {
              return prev.map((entry) => (entry._id === data.event._id ? data.event : entry));
            }
            return [...prev, data.event];
          });
        }

        const message = data.message || "RSVP updated.";
        setBanner({ type: "success", message });
        toast.success(message);
      } catch (error) {
        const errorMessage = error.message || "Unable to update RSVP status.";
        setBanner({ type: "error", message: errorMessage });
        toast.error(errorMessage);
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const renderEventCard = (event) => {
    const eventDate = event.date ? new Date(event.date) : null;
    const formattedDate = eventDate
      ? eventDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : "Date TBA";
    const timeLabel = event.startTime || "Time TBA";
    const capacityLabel = event.capacity ? `${event.attendeesCount}/${event.capacity}` : `${event.attendeesCount} attending`;
    const isAttending = Boolean(event.isAttending);
    const isProcessing = processingId === event._id;

    return (
      <div key={event._id} className="flex flex-col justify-between rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
            {event.category || "General"}
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
            {capacityLabel}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-orange-500" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="text-orange-500" />
              <span>{timeLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMapPin className="text-orange-500" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiUsers className="text-orange-500" />
              <span>{event.attendeesCount} attending</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleRsvp(event._id, isAttending ? "cancel" : "join")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-200 ${
              isAttending
                ? "border border-orange-300 bg-white text-orange-600 hover:bg-orange-50"
                : "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow hover:from-orange-500 hover:to-orange-700"
            } ${isProcessing ? "opacity-60" : ""}`}
          >
            {isProcessing
              ? "Processing..."
              : isAttending
              ? "Cancel RSVP"
              : "RSVP"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-orange-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-orange-50"
            onClick={() => setSelectedEvent(event)}
          >
            Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[90vh] bg-[#FFF8F3] px-3 sm:px-6 lg:px-10 py-6 rounded-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Campus Events</h2>
          <p className="text-gray-500 text-sm sm:text-base">Discover and join upcoming activities on campus.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadEvents}
            className="rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            Refresh
          </button>
          {role === "admin" && (
            <button
              type="button"
              onClick={handleCreateClick}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400"
            >
              Create Event
            </button>
          )}
        </div>
      </div>

      {banner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm shadow-sm ${
            banner.type === "error"
              ? "border-red-100 bg-red-50 text-red-600"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {banner.message}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-4 w-32 rounded bg-orange-100" />
              <div className="mt-4 h-6 w-3/4 rounded bg-orange-100" />
              <div className="mt-2 h-3 w-full rounded bg-orange-100" />
              <div className="mt-6 h-3 w-1/2 rounded bg-orange-100" />
              <div className="mt-6 h-10 w-full rounded bg-orange-100" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-orange-100 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-700">No upcoming events yet.</p>
          <p className="mt-2 text-sm text-gray-500">Check back soon or ask an administrator to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {events.map((event) => renderEventCard(event))}
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute right-5 top-4 text-2xl text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                    {selectedEvent.category || "General"}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                  {selectedEvent.capacity
                    ? `${selectedEvent.attendeesCount}/${selectedEvent.capacity} spots`
                    : `${selectedEvent.attendeesCount} attending`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-orange-500" />
                  <span>
                    {selectedEvent.date
                      ? new Date(selectedEvent.date).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Date TBA"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-orange-500" />
                  <span>{selectedEvent.startTime || "Time TBA"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-orange-500" />
                  <span>{selectedEvent.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUsers className="text-orange-500" />
                  <span>{selectedEvent.attendeesCount} people joined</span>
                </div>
              </div>

              {selectedEvent.attendees?.length > 0 && (
                <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                  <p className="text-sm font-semibold text-orange-700 mb-2">Attendees</p>
                  <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-orange-700">
                    {selectedEvent.attendees.map((person, index) => (
                      <li key={`${person.email}-${index}`}>
                        {person.name || person.email} · {person.email}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-lg border border-orange-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-orange-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementsSection({ role, announcements = [], meta, onAnnouncementsChange = () => {} }) {
  const [processingId, setProcessingId] = React.useState(null);

  const computedMeta = React.useMemo(() => {
    const total = typeof meta?.count === "number" ? meta.count : announcements.length;
    const unread =
      typeof meta?.unreadCount === "number"
        ? meta.unreadCount
        : announcements.filter((item) => !item.isRead).length;
    return { count: total, unreadCount: unread };
  }, [announcements, meta]);

  const handleCreateClick = React.useCallback(() => {
    toast("Open the admin dashboard to create a new announcement.");
  }, []);

  const handleMarkAsRead = React.useCallback(
    async (announcementId) => {
      if (!announcementId) return;
      const target = announcements.find((item) => item._id === announcementId);
      if (!target || target.isRead) {
        return;
      }

      setProcessingId(announcementId);

      try {
        const response = await apiFetch(`/api/notifications/${announcementId}/read`, {
          method: "POST",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to mark announcement as read.");
        }

        const updatedAnnouncements = announcements.map((item) =>
          item._id === announcementId
            ? { ...item, isRead: true, readBy: Array.isArray(item.readBy) ? item.readBy : [] }
            : item
        );

        const unreadCount = updatedAnnouncements.filter((item) => !item.isRead).length;

        onAnnouncementsChange({
          notifications: updatedAnnouncements,
          meta: {
            count: updatedAnnouncements.length,
            unreadCount,
          },
        });

        toast.success(data.message || "Announcement marked as read.");
      } catch (error) {
        toast.error(error.message || "Failed to mark announcement as read.");
      } finally {
        setProcessingId(null);
      }
    },
    [announcements, onAnnouncementsChange]
  );

  const statusStyles = {
    new: "bg-orange-100 text-orange-600",
    update: "bg-blue-100 text-blue-600",
    reminder: "bg-amber-100 text-amber-700",
  };

  const urgencyStyles = {
    high: "bg-red-100 text-red-600",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  };

  const topicStyles = "bg-emerald-50 text-emerald-600";

  const formatLabel = (value) => {
    if (!value || typeof value !== "string") return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const renderAnnouncementCard = (announcement) => {
    const createdAt = announcement.createdAt ? new Date(announcement.createdAt) : null;
    const formattedDate = createdAt
      ? createdAt.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date not available";

    const isProcessing = processingId === announcement._id;
    const isRead = Boolean(announcement.isRead);
    const borderAccent = announcement.urgency === "high" ? "border-orange-400" : "border-orange-200";
    const backgroundAccent = isRead ? "bg-white" : "bg-gradient-to-br from-orange-50 via-white to-white";

    return (
      <div
        key={announcement._id}
        className={`rounded-2xl border ${borderAccent} ${backgroundAccent} p-6 shadow-sm transition`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 h-3 w-3 rounded-full ${isRead ? "bg-orange-200" : "bg-orange-500"}`}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  statusStyles[announcement.status] || statusStyles.new
                }`}
                >
                  {formatLabel(announcement.status || "new")}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  urgencyStyles[announcement.urgency] || urgencyStyles.medium
                }`}
                >
                  {formatLabel(announcement.urgency || "medium")}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${topicStyles}`}>
                  {formatLabel(announcement.topic || announcement.category || "General")}
                </span>
                {Array.isArray(announcement.tags) &&
                  announcement.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600"
                    >
                      <FiTag className="text-[12px]" />
                      {formatLabel(tag)}
                    </span>
                  ))}
              </div>
              <h3 className="mt-3 text-xl font-semibold text-gray-900">{announcement.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <FiCalendar className="text-orange-500" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          {!isRead && (
            <button
              type="button"
              onClick={() => handleMarkAsRead(announcement._id)}
              disabled={isProcessing}
              className={`inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 ${
                isProcessing ? "opacity-60" : ""
              }`}
            >
              <FiCheck className="text-sm" />
              {isProcessing ? "Marking..." : "Mark as read"}
            </button>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">{announcement.message}</p>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[90vh] bg-[#FFF8F3] px-3 sm:px-6 lg:px-10 py-6 rounded-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Stay updated with campus news • {computedMeta.unreadCount} unread
          </p>
        </div>
        {role === "admin" && (
          <button
            type="button"
            onClick={handleCreateClick}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400"
          >
            Create Announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-orange-100 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-700">No announcements yet.</p>
          <p className="mt-2 text-sm text-gray-500">Check back later for campus updates.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {announcements.map((announcement) => renderAnnouncementCard(announcement))}
        </div>
      )}
    </div>
  );
}

function EmergencySection({ alerts = [], loading }) {
  const formatRelativeTime = React.useCallback((value) => {
    if (!value) return "Just now";
    const eventTime = new Date(value).getTime();
    if (Number.isNaN(eventTime)) return "Just now";

    const diffMs = Date.now() - eventTime;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return "Just now";
    if (diffMs < hour) {
      const minutes = Math.round(diffMs / minute);
      return `${minutes} min ago`;
    }
    if (diffMs < day) {
      const hours = Math.round(diffMs / hour);
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.round(diffMs / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }, []);

  const formatSeverity = (severity) => {
    if (!severity) return "info";
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const severityStyles = {
    critical: "bg-red-100 text-red-600",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-600",
  };

  const orderedAlerts = React.useMemo(() => {
    return [...alerts].sort((a, b) => {
      const severityOrder = { critical: 2, warning: 1, info: 0 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      const timeDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return timeDiff;
    });
  }, [alerts]);

  const handleCall = (tel) => {
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  };

  return (
    <div className="w-full min-h-[90vh] bg-[#FFF8F3] px-3 sm:px-6 lg:px-10 py-6 rounded-xl">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-3 text-orange-600">
          <FiShield className="text-3xl" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Emergency Alerts</h2>
            <p className="text-gray-500 text-sm sm:text-base">Stay safe and informed</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-red-200 bg-red-50/60 p-6 mb-8">
        <div className="flex items-start gap-3">
          <FiPhone className="mt-1 text-red-500" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600">Emergency Contacts</h3>
            <p className="text-sm text-red-500">Available for immediate assistance</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {EMERGENCY_CONTACTS.map((contact) => (
            <div
              key={contact.id}
              className="flex h-full flex-col justify-between rounded-xl border border-red-100 bg-white px-5 py-4 shadow-sm"
            >
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{contact.label}</p>
                <p className="text-xl font-bold text-orange-500">{contact.phone}</p>
                <p className="text-xs text-gray-500">{contact.availability}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{contact.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCall(contact.tel)}
                className="mt-4 w-full rounded-lg border border-orange-200 bg-orange-50 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
              >
                Call Now
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold text-gray-900">Recent Alerts</h3>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-28 rounded-xl border border-orange-100 bg-white p-4 shadow-sm animate-pulse">
                <div className="h-4 w-24 rounded bg-orange-100" />
                <div className="mt-3 h-4 w-1/2 rounded bg-orange-100" />
                <div className="mt-2 h-3 w-3/4 rounded bg-orange-100" />
              </div>
            ))}
          </div>
        ) : orderedAlerts.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            No active alerts at the moment. We will notify you if anything changes.
          </div>
        ) : (
          <div className="space-y-4">
            {orderedAlerts.map((alert) => (
              <div
                key={alert._id}
                className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        severityStyles[alert.severity] || severityStyles.info
                      }`}
                    >
                      {formatSeverity(alert.severity)}
                    </span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(alert.createdAt)}</span>
                  </div>
                  {alert.metadata?.location && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                      {alert.metadata.location}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <FiAlertTriangle className="mt-1 text-orange-500" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{alert.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Safety Resources</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SAFETY_RESOURCES.map((resource) => (
            <div
              key={resource.title}
              className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-semibold text-orange-600">{resource.title}</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{resource.description}</p>
            </div>
          ))}
        </div>
      </section>
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
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to report item");
      setSuccess("Item reported successfully.");
      setForm({ title: "", description: "", location: "", contact: "", image: "", date: "" });
      toast.success("Item reported successfully.");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to report item.");
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

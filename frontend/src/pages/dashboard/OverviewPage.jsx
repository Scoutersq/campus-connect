import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiMapPin,
  FiCalendar,
  FiBell,
  FiUsers,
  FiFileText,
  FiPlusCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { fetchResource } from "../../utils/fetchResource";

export default function OverviewPage() {
  const [profile, setProfile] = React.useState(null);
  const [lostItems, setLostItems] = React.useState([]);
  const [foundItems, setFoundItems] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [announcements, setAnnouncements] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [
          profileResult,
          lostResult,
          foundResult,
          eventsResult,
          notificationsResult,
          alertsResult,
        ] = await Promise.all([
          fetchResource("/api/profile/me", null, { signal: controller.signal }),
          fetchResource("/api/lost/preview", { preview: [] }, { signal: controller.signal }),
          fetchResource("/api/found/preview", { preview: [] }, { signal: controller.signal }),
          fetchResource("/api/events", { events: [] }, { signal: controller.signal }),
          fetchResource(
            "/api/announcements",
            { notifications: [], count: 0, unreadCount: 0 },
            { signal: controller.signal }
          ),
          fetchResource("/api/emergency/active", { data: [] }, { signal: controller.signal }),
        ]);

        if (cancelled) {
          return;
        }

        const encounteredError = [
          profileResult,
          lostResult,
          foundResult,
          eventsResult,
          notificationsResult,
          alertsResult,
        ].some((result) => Boolean(result.error));

        setProfile(profileResult.data?.profile ?? null);
        setLostItems(lostResult.data?.preview ?? []);
        setFoundItems(foundResult.data?.preview ?? []);
        setEvents(eventsResult.data?.events ?? []);
        setAnnouncements((notificationsResult.data ?? {}).notifications ?? []);
        setAlerts(alertsResult.data?.data ?? []);

        if (encounteredError) {
          setError("Some dashboard data could not be loaded. Please refresh to retry.");
        }
      } catch (err) {
        if (err.name !== "AbortError" && !cancelled) {
          console.error("Dashboard data load error", err);
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const greetingName = React.useMemo(() => {
    if (!profile) {
      return "";
    }
    const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
    return fullName || profile.email || "Explorer";
  }, [profile]);

  const greetingTime = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good morning";
    }
    if (hour >= 12 && hour < 17) {
      return "Good afternoon";
    }
    if (hour >= 17 && hour < 24) {
      return "Good evening";
    }
    return "Hello";
  }, []);

  const lostCount = lostItems.length;
  const foundCount = foundItems.length;
  const eventsCount = events.length;
  const announcementsCount = announcements.length;
  const nextEvent = events[0];

  const quickActions = React.useMemo(
    () => [
      {
        key: "report",
        label: "Report Lost Item",
        description: "Log something you misplaced and notify campus.",
        icon: FiPlusCircle,
        to: "/dashboard/lost-and-found?report=1",
      },
      {
        key: "lostfound",
        label: "Browse Lost & Found",
        description: "Review new reports from the community.",
        icon: FiMapPin,
        to: "/dashboard/lost-and-found",
      },
      {
        key: "events",
        label: "Events",
        description: "Discover upcoming activities.",
        icon: FiCalendar,
        to: "/dashboard/events",
      },
      {
        key: "announcements",
        label: "Announcements",
        description: "Catch up on recent news.",
        icon: FiBell,
        to: "/dashboard/announcements",
      },
    ],
    []
  );

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
      helper: nextEvent
        ? `${new Date(nextEvent.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })} · ${nextEvent.title}`
        : "No events scheduled",
      accent: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Announcements",
      value: announcementsCount,
      helper: announcementsCount ? "Stay current with campus news" : "All quiet for now",
      accent: "bg-emerald-100 text-emerald-600",
    },
  ];

  const recentAlerts = alerts.slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-orange-500">Welcome back</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-gray-900">
          <span>{greetingTime}</span>
          {greetingName ? (
            <span>, {greetingName}</span>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-24 animate-pulse rounded bg-orange-100"
            />
          )}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Here's a quick overview of what's happening around campus today.
        </p>
        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500">Jump straight into the things you use most.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:shadow"
                >
                  <span className="rounded-full bg-orange-100 p-2 text-orange-600">
                    <Icon />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{action.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{action.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Alerts &amp; Notifications</h2>
          <div className="mt-4 space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-gray-500">No emergency alerts right now. Stay safe!</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert._id} className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-orange-600">
                    <FiAlertTriangle />
                    <span>{alert.severity}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{alert.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Latest Announcements</h2>
          <div className="mt-4 space-y-3">
            {announcements.slice(0, 3).map((note) => (
              <div key={note._id} className="rounded-lg border border-orange-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">{note.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {note.message?.length > 120 ? `${note.message.slice(0, 120)}…` : note.message}
                </p>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500">No announcements yet. Check back later today.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <div className="mt-4 space-y-3">
            {events.slice(0, 3).map((event) => (
              <div key={event._id} className="rounded-lg border border-orange-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}
                </p>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming events yet.</p>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-orange-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          Loading dashboard data...
        </div>
      )}
    </div>
  );
}

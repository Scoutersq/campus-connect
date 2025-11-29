import React from "react";
import { Link } from "react-router-dom";
import {
  FiRefreshCcw,
  FiUsers,
  FiShield,
  FiBell,
  FiCalendar,
  FiFileText,
  FiActivity,
  FiTrendingUp,
  FiDatabase,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { buildApiUrl } from "../../../utils/fetchResource";

const DEFAULT_DATA = {
  summary: {
    users: { total: 0, active: 0 },
    admins: { total: 0, active: 0 },
    lostItems: { total: 0, open: 0 },
    foundItems: { total: 0, open: 0 },
    events: { total: 0, upcoming: 0 },
    announcements: { total: 0 },
    notes: { total: 0 },
    emergencyAlerts: { total: 0, active: 0 },
    discussions: { total: 0 },
  },
  recentUsers: [],
  recentActivities: [],
};

const METRIC_CONFIG = [
  {
    key: "users",
    title: "Users",
    icon: FiUsers,
    getValue: (summary) => summary.users.total,
    getHint: (summary) => `${summary.users.active} active`,
    accent: "bg-orange-100 text-orange-600",
  },
  {
    key: "admins",
    title: "Admins",
    icon: FiShield,
    getValue: (summary) => summary.admins.total,
    getHint: (summary) => `${summary.admins.active} active`,
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "events",
    title: "Events",
    icon: FiCalendar,
    getValue: (summary) => summary.events.total,
    getHint: (summary) => `${summary.events.upcoming} upcoming`,
    accent: "bg-indigo-100 text-indigo-600",
  },
  {
    key: "announcements",
    title: "Announcements",
    icon: FiBell,
    getValue: (summary) => summary.announcements.total,
    getHint: () => "Manage communications",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    key: "lostItems",
    title: "Lost Items",
    icon: FiActivity,
    getValue: (summary) => summary.lostItems.total,
    getHint: (summary) => `${summary.lostItems.open} open reports`,
    accent: "bg-red-100 text-red-600",
  },
  {
    key: "foundItems",
    title: "Found Items",
    icon: FiTrendingUp,
    getValue: (summary) => summary.foundItems.total,
    getHint: (summary) => `${summary.foundItems.open} awaiting claim`,
    accent: "bg-lime-100 text-lime-600",
  },
  {
    key: "notes",
    title: "Notes Library",
    icon: FiFileText,
    getValue: (summary) => summary.notes.total,
    getHint: () => "Shared resources",
    accent: "bg-sky-100 text-sky-600",
  },
  {
    key: "emergencyAlerts",
    title: "Emergency Alerts",
    icon: FiDatabase,
    getValue: (summary) => summary.emergencyAlerts.total,
    getHint: (summary) => `${summary.emergencyAlerts.active} active`,
    accent: "bg-purple-100 text-purple-600",
  },
];

const ACTIVITY_LABELS = {
  lost: { label: "Lost Item", tone: "text-red-600" },
  found: { label: "Found Item", tone: "text-lime-600" },
  event: { label: "Event", tone: "text-indigo-600" },
  announcement: { label: "Announcement", tone: "text-amber-600" },
  alert: { label: "Alert", tone: "text-purple-600" },
};

const formatDateTime = (value) => {
  if (!value) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (_error) {
    return String(value);
  }
};

export default function AdminOverviewPage() {
  const [data, setData] = React.useState(DEFAULT_DATA);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadOverview = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/admin/overview"), {
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to load overview data.");
      }

      const payload = await response.json();
      setData((prev) => ({ ...prev, ...payload }));
    } catch (err) {
      console.error("Admin overview fetch error", err);
      setError(err.message || "Unable to load overview data.");
      toast.error(err.message || "Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOverview();
  }, [loadOverview, refreshKey]);

  const { summary, recentUsers, recentActivities } = data;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-sm text-gray-500">
            Monitor campus activity, review recent reports, and jump into management tools.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            <FiRefreshCcw />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {METRIC_CONFIG.map((metric) => {
          const Icon = metric.icon;
          const value = metric.getValue(summary);
          const hint = metric.getHint(summary);

          return (
            <div
              key={metric.key}
              className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-lg ${metric.accent}`}>
                  <Icon />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {metric.title}
                </span>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">
                {loading ? "--" : value}
              </div>
              <div className="mt-2 text-sm text-gray-500">{loading ? "Calculating..." : hint}</div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recently Joined Students</h2>
            <Link
              to="/dashboard/users"
              className="text-sm font-semibold text-orange-500 hover:text-orange-400"
            >
              View all
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No recent sign-ups yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-orange-50 bg-orange-50/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{user.studentId || "No ID"}</div>
                    <div>{formatDateTime(user.joinedAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Latest Activity</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Last 10 updates
            </span>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity recorded.</p>
          ) : (
            <ul className="space-y-4">
              {recentActivities.map((activity) => {
                const config = ACTIVITY_LABELS[activity.type] || {
                  label: activity.type,
                  tone: "text-gray-500",
                };
                return (
                  <li key={`${activity.type}-${activity.id}`} className="border-l-4 border-orange-200 pl-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${config.tone}`}>
                      {config.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                    {activity.meta && Object.keys(activity.meta).length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        {Object.entries(activity.meta)
                          .map(([key, value]) => `${key}: ${value ?? "n/a"}`)
                          .join(" • ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
        <p className="text-sm text-gray-500">
          Jump directly to common admin workflows.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/dashboard/manage/lost-found"
            className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
          >
            Review lost & found
          </Link>
          <Link
            to="/dashboard/manage/events"
            className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
          >
            Create an event
          </Link>
          <Link
            to="/dashboard/manage/announcements"
            className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-100"
          >
            Post an announcement
          </Link>
          <Link
            to="/dashboard/users"
            className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100"
          >
            Audit users
          </Link>
        </div>
      </section>
    </div>
  );
}

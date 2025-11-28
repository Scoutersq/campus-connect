import React from "react";
import {
  FiBell,
  FiFilter,
  FiCheckCircle,
  FiTag,
  FiUser,
  FiRefreshCcw,
} from "react-icons/fi";
import { buildApiUrl } from "../../utils/fetchResource";

const CATEGORY_LABELS = {
  notices: "Notice",
  events: "Event",
  update: "Update",
  holidays: "Holiday",
  others: "General",
  emergency: "Emergency",
};

const URGENCY_COLOURS = {
  low: "bg-emerald-100 text-emerald-600 border border-emerald-200",
  medium: "bg-amber-100 text-amber-600 border border-amber-200",
  high: "bg-red-100 text-red-600 border border-red-200",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const pendingMarkRef = React.useRef(null);

  const loadAnnouncements = React.useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/announcements"), { credentials: "include", signal });

      if (response.status === 404) {
        setAnnouncements([]);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load announcements.");
      }

      const items = Array.isArray(payload?.notifications) ? payload.notifications : [];
      setAnnouncements(items);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Announcements fetch error", err);
      setError(err.message || "Unable to fetch announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    loadAnnouncements(controller.signal);
    return () => controller.abort();
  }, [loadAnnouncements, refreshKey]);

  const handleMarkAsRead = React.useCallback(async (announcementId) => {
    if (pendingMarkRef.current) {
      return;
    }

    pendingMarkRef.current = announcementId;

    try {
      const response = await fetch(buildApiUrl(`/api/announcements/${announcementId}/read`), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || "Unable to mark announcement as read.");
      }

      setAnnouncements((existing) =>
        existing.map((item) =>
          item._id === announcementId ? { ...item, isRead: true } : item
        )
      );
      setFeedback("Marked as read.");
    } catch (err) {
      console.error("Mark announcement error", err);
      setFeedback(err.message || "Unable to update announcement status.");
    } finally {
      pendingMarkRef.current = null;
    }
  }, []);

  const categories = React.useMemo(() => {
    const unique = new Set(announcements.map((item) => (item.category || "others").toLowerCase()));
    return ["all", ...Array.from(unique)];
  }, [announcements]);

  const filteredAnnouncements = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return announcements.filter((item) => {
      if (showUnreadOnly && item.isRead) {
        return false;
      }

      if (categoryFilter !== "all" && (item.category || "").toLowerCase() !== categoryFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [item.title, item.message, item.topic]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .some((value) => value.includes(term));
    });
  }, [announcements, categoryFilter, search, showUnreadOnly]);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setShowUnreadOnly(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 sm:text-base">
            Review recent updates, notices, and urgent communications.
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
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex items-center gap-3">
            <FiBell className="text-lg text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or message"
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${{
                    true: "bg-orange-500 text-white",
                    false: "border border-orange-200 bg-white text-orange-500 hover:bg-orange-50",
                  }[String(categoryFilter === category)]}`}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-orange-200 text-orange-500"
                checked={showUnreadOnly}
                onChange={(event) => setShowUnreadOnly(event.target.checked)}
              />
              Unread only
            </label>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {feedback && (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {feedback}
          </div>
        )}
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="h-4 w-32 rounded bg-orange-100" />
              <div className="mt-3 h-3 w-2/3 rounded bg-orange-100" />
              <div className="mt-2 h-3 w-3/4 rounded bg-orange-100" />
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          {announcements.length === 0
            ? "No announcements posted yet."
            : "Nothing matches your filters."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const urgency = announcement.urgency || (announcement.isImportant ? "high" : "medium");
            const urgencyStyles = URGENCY_COLOURS[urgency] || URGENCY_COLOURS.medium;
            const category = (announcement.category || "others").toLowerCase();

            return (
              <article
                key={announcement._id}
                className={`rounded-2xl border ${announcement.isRead ? "border-orange-100 bg-white" : "border-orange-200 bg-orange-50"} p-6 shadow-sm transition`}
              >
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyStyles}`}>
                        {urgency.toUpperCase()}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase text-indigo-600">
                        {CATEGORY_LABELS[category] || "Update"}
                      </span>
                      {!announcement.isRead && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold uppercase text-red-600">
                          New
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{announcement.title}</h2>
                    <p className="text-sm text-gray-600">{announcement.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={announcement.isRead || pendingMarkRef.current === announcement._id}
                      onClick={() => handleMarkAsRead(announcement._id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60"
                    >
                      <FiCheckCircle />
                      Mark as read
                    </button>
                  </div>
                </header>

                <footer className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  {announcement.topic && (
                    <span className="inline-flex items-center gap-1">
                      <FiTag />
                      {announcement.topic}
                    </span>
                  )}
                  {(announcement.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full bg-orange-100 px-2.5 py-1 font-semibold text-orange-600">
                      #{tag}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1">
                    <FiUser />
                    {announcement.targetAudience ? `Audience: ${announcement.targetAudience}` : "All audiences"}
                  </span>
                  <span>
                    {announcement.createdAt
                      ? new Date(announcement.createdAt).toLocaleString()
                      : "Timestamp unavailable"}
                  </span>
                  {announcement.expiresAt && (
                    <span>
                      Expires {new Date(announcement.expiresAt).toLocaleString()}
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

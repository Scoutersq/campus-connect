import React from "react";
import {
  FiBell,
  FiTag,
  FiClock,
  FiRefreshCcw,
  FiTrash2,
  FiPlusCircle,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { buildApiUrl } from "../../../utils/fetchResource";

const formatDate = (value) => {
  if (!value) return "--";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (_error) {
    return String(value);
  }
};

const urgencyBadge = (urgency, isImportant) => {
  const level = (urgency || (isImportant ? "high" : "medium")).toLowerCase();
  switch (level) {
    case "high":
      return "bg-red-100 text-red-600";
    case "low":
      return "bg-emerald-100 text-emerald-600";
    default:
      return "bg-orange-100 text-orange-600";
  }
};

const CATEGORY_OPTIONS = [
  { value: "notices", label: "Notices" },
  { value: "events", label: "Events" },
  { value: "update", label: "Update" },
  { value: "holidays", label: "Holidays" },
  { value: "others", label: "Others" },
  { value: "emergency", label: "Emergency" },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "faculty", label: "Faculty" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "update", label: "Update" },
  { value: "reminder", label: "Reminder" },
];

const URGENCY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const INITIAL_FORM_VALUES = {
  title: "",
  message: "",
  category: "notices",
  targetAudience: "all",
  urgency: "medium",
  status: "new",
  topic: "",
  expiresAt: "",
  isImportant: false,
  tags: "",
};

const normalizeAnnouncement = (item) => ({
  id: String(item._id || item.id),
  title: item.title,
  message: item.message,
  category: item.category,
  urgency: item.urgency,
  topic: item.topic,
  tags: Array.isArray(item.tags) ? item.tags : [],
  createdAt: item.createdAt,
  expiresAt: item.expiresAt,
  isImportant: Boolean(item.isImportant),
  targetAudience: item.targetAudience,
  status: item.status,
});

export default function AdminAnnouncementsPage({ onCreateAnnouncement }) {
  const [announcements, setAnnouncements] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState(INITIAL_FORM_VALUES);
  const [formError, setFormError] = React.useState("");
  const [formSubmitting, setFormSubmitting] = React.useState(false);

  const loadAnnouncements = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildApiUrl("/api/notifications"), {
        credentials: "include",
      });

      if (response.status === 404) {
        setAnnouncements([]);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load announcements.");
      }

      const items = Array.isArray(payload.notifications) ? payload.notifications : [];
      setAnnouncements(items.map(normalizeAnnouncement));
    } catch (err) {
      console.error("Admin announcements fetch error", err);
      setError(err.message || "Unable to load announcements.");
      toast.error(err.message || "Failed to refresh announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements, refreshKey]);

  const handleDelete = async (id) => {
    if (!id) return;
    const confirm = window.confirm("Delete this announcement? This cannot be undone.");
    if (!confirm) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/admin/announcements/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete announcement.");
      }

      toast.success("Announcement removed successfully.");
      setAnnouncements((items) => items.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Admin announcement delete error", err);
      toast.error(err.message || "Unable to delete announcement.");
    }
  };

  const handleOpenForm = () => {
    if (typeof onCreateAnnouncement === "function") {
      onCreateAnnouncement();
      return;
    }
    setFormError("");
    setFormSubmitting(false);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (formSubmitting) return;
    setIsFormOpen(false);
    setFormError("");
    setFormValues(INITIAL_FORM_VALUES);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formSubmitting) return;

    setFormError("");
    const payload = {
      title: formValues.title.trim(),
      message: formValues.message.trim(),
      category: formValues.category,
      targetAudience: formValues.targetAudience,
      urgency: formValues.urgency,
      status: formValues.status,
      isImportant: Boolean(formValues.isImportant),
    };

    if (!payload.title || !payload.message) {
      setFormError("Title and message are required.");
      return;
    }

    if (formValues.topic.trim()) {
      payload.topic = formValues.topic.trim();
    }

    if (formValues.expiresAt) {
      const expiresDate = new Date(formValues.expiresAt);
      if (Number.isNaN(expiresDate.getTime())) {
        setFormError("Provide a valid expiry date.");
        return;
      }
      if (expiresDate <= new Date()) {
        setFormError("Expiry must be in the future.");
        return;
      }
      payload.expiresAt = expiresDate.toISOString();
    }

    const parsedTags = formValues.tags
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (parsedTags.length > 0) {
      if (parsedTags.length > 6) {
        setFormError("Limit tags to 6 or fewer.");
        return;
      }
      payload.tags = [...new Set(parsedTags)].slice(0, 6);
    }

    setFormSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/notifications/create"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.notification) {
        throw new Error(result?.message || "Failed to create announcement.");
      }

      toast.success(result?.message || "Announcement published successfully.");
      setAnnouncements((items) => [normalizeAnnouncement(result.notification), ...items]);
      setFormSubmitting(false);
      handleCloseForm();
    } catch (err) {
      console.error("Admin create announcement error", err);
      setFormError(err.message || "Unable to create announcement.");
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">
            Broadcast key updates to the community and retire outdated alerts promptly.
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
            onClick={handleOpenForm}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <FiPlusCircle />
            New Announcement
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Latest Notices</h2>
            <p className="text-sm text-gray-500">
              {announcements.length} announcements live. Keep information timely and relevant.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-orange-100 bg-orange-50/60" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center text-sm text-gray-500">
            No announcements yet. Share updates as soon as they are ready.
          </div>
        ) : (
          <ul className="space-y-4">
            {announcements.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-500">
                      <FiBell />
                      {item.category || "Notices"}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${urgencyBadge(item.urgency, item.isImportant)}`}>
                        {item.urgency || (item.isImportant ? "high" : "medium")}
                      </span>
                      {item.targetAudience && (
                        <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {item.targetAudience}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.message}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FiClock />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.expiresAt && (
                        <span className="inline-flex items-center gap-1">
                          expires {formatDate(item.expiresAt)}
                        </span>
                      )}
                      {item.topic && (
                        <span className="inline-flex items-center gap-1">
                          <FiTag />
                          {item.topic}
                        </span>
                      )}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 self-end md:self-start">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Announcement</h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Title</span>
                  <input
                    type="text"
                    name="title"
                    value={formValues.title}
                    onChange={handleFormChange}
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="e.g. Maintenance notice"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Topic (optional)</span>
                  <input
                    type="text"
                    name="topic"
                    value={formValues.topic}
                    onChange={handleFormChange}
                    maxLength={50}
                    placeholder="e.g. Facilities"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Message</span>
                <textarea
                  name="message"
                  value={formValues.message}
                  onChange={handleFormChange}
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={4}
                  placeholder="Share the details of your announcement."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Category</span>
                  <select
                    name="category"
                    value={formValues.category}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Audience</span>
                  <select
                    name="targetAudience"
                    value={formValues.targetAudience}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    {AUDIENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Status</span>
                  <select
                    name="status"
                    value={formValues.status}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Urgency</span>
                  <select
                    name="urgency"
                    value={formValues.urgency}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    {URGENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Expires at (optional)</span>
                  <input
                    type="datetime-local"
                    name="expiresAt"
                    value={formValues.expiresAt}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    name="isImportant"
                    checked={formValues.isImportant}
                    onChange={handleFormChange}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />
                  Mark as important
                </label>
              </div>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Tags (optional)</span>
                <textarea
                  name="tags"
                  value={formValues.tags}
                  onChange={handleFormChange}
                  rows={2}
                  placeholder="Separate tags with commas or new lines (max 6)."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {formError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={formSubmitting}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  <FiPlusCircle />
                  {formSubmitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

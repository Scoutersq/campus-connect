import React from "react";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiRefreshCcw,
  FiTrash2,
  FiPlusCircle,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { buildApiUrl } from "../../../utils/fetchResource";

const formatDateTime = (value) => {
  if (!value) return { date: "--", time: "--" };
  try {
    const date = new Date(value);
    return {
      date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date),
      time: new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(date),
    };
  } catch (_error) {
    return { date: String(value), time: "--" };
  }
};

const capacityLabel = (capacity, attendees) => {
  if (!capacity || capacity <= 0) {
    return `${attendees} attending`;
  }
  return `${attendees}/${capacity} attending`;
};

export default function AdminEventsPage({ onCreateEvent }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    title: "",
    description: "",
    venue: "",
    date: "",
    category: "",
    time: "",
    capacity: "",
  });
  const [formError, setFormError] = React.useState("");
  const [formSubmitting, setFormSubmitting] = React.useState(false);

  const normalizeEvent = React.useCallback((event) => ({
    id: String(event._id || event.id),
    title: event.title,
    description: event.description,
    venue: event.venue,
    date: event.date,
    startTime: event.startTime,
    attendeesCount: event.attendeesCount || 0,
    capacity: event.capacity,
    category: event.category,
    createdAt: event.createdAt,
  }), []);

  const loadEvents = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildApiUrl("/api/events"), {
        credentials: "include",
      });

      if (response.status === 404) {
        setEvents([]);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to fetch events.");
      }

      const items = Array.isArray(payload.events) ? payload.events : [];
      setEvents(items.map(normalizeEvent));
    } catch (err) {
      console.error("Admin events fetch error", err);
      setError(err.message || "Unable to load events.");
      toast.error(err.message || "Failed to refresh events");
    } finally {
      setLoading(false);
    }
  }, [normalizeEvent]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshKey]);

  const handleDelete = async (eventId) => {
    if (!eventId) return;

    const confirm = window.confirm("Delete this event? This cannot be undone.");
    if (!confirm) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/admin/events/${eventId}`), {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete event.");
      }

      toast.success("Event removed successfully.");
      setEvents((items) => items.filter((item) => item.id !== eventId));
    } catch (err) {
      console.error("Admin event delete error", err);
      toast.error(err.message || "Unable to delete event.");
    }
  };

  const handleOpenForm = () => {
    if (typeof onCreateEvent === "function") {
      onCreateEvent();
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
    setFormValues({
      title: "",
      description: "",
      venue: "",
      date: "",
      category: "",
      time: "",
      capacity: "",
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formSubmitting) return;

    setFormError("");
    const trimmed = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      venue: formValues.venue.trim(),
      category: formValues.category.trim(),
      time: formValues.time.trim(),
      date: formValues.date.trim(),
      capacity: formValues.capacity.trim(),
    };

    if (!trimmed.title || !trimmed.description || !trimmed.venue || !trimmed.date) {
      setFormError("Please complete all required fields.");
      return;
    }

    const parsedDate = new Date(trimmed.date);
    if (Number.isNaN(parsedDate.getTime())) {
      setFormError("Provide a valid event date.");
      return;
    }

    const payload = {
      title: trimmed.title,
      description: trimmed.description,
      venue: trimmed.venue,
      date: parsedDate.toISOString(),
    };

    if (trimmed.category) {
      payload.category = trimmed.category;
    }
    if (trimmed.time) {
      payload.time = trimmed.time;
    }
    if (trimmed.capacity) {
      const parsedCapacity = Number.parseInt(trimmed.capacity, 10);
      if (Number.isNaN(parsedCapacity) || parsedCapacity < 0) {
        setFormError("Capacity must be a positive number.");
        return;
      }
      payload.capacity = parsedCapacity;
    }

    setFormSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/events/create"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.event) {
        throw new Error(result?.message || "Failed to create event.");
      }

      toast.success(result?.message || "Event created successfully.");
      setEvents((previous) => [normalizeEvent(result.event), ...previous]);
      setFormSubmitting(false);
      handleCloseForm();
    } catch (err) {
      console.error("Admin create event error", err);
      setFormError(err.message || "Unable to create event.");
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="text-sm text-gray-500">
            Review upcoming activities, monitor attendance, and remove outdated events.
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
            New Event
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
            <h2 className="text-lg font-semibold text-gray-900">Campus Events</h2>
            <p className="text-sm text-gray-500">
              {events.length} events in calendar. Stay current by clearing past items.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-orange-100 bg-orange-50/60" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center text-sm text-gray-500">
            No events scheduled yet. Create an event to get started.
          </div>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => {
              const { date, time } = formatDateTime(event.date);
              return (
                <li
                  key={event.id}
                  className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-500">
                        <FiCalendar />
                        {event.category || "General"}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin />
                          {event.venue}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiClock />
                          {date} • {time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiUsers />
                          {capacityLabel(event.capacity, event.attendeesCount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end md:self-start">
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Create New Event</h2>
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
                    placeholder="e.g. Career Fair 2025"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Category (optional)</span>
                  <input
                    type="text"
                    name="category"
                    value={formValues.category}
                    onChange={handleFormChange}
                    maxLength={50}
                    placeholder="e.g. Career"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Description</span>
                <textarea
                  name="description"
                  value={formValues.description}
                  onChange={handleFormChange}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  placeholder="Share event details and what students should expect."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Venue</span>
                  <input
                    type="text"
                    name="venue"
                    value={formValues.venue}
                    onChange={handleFormChange}
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="e.g. Main Auditorium"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Date & Time</span>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formValues.date}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-gray-700">
                  <span>Capacity (optional)</span>
                  <input
                    type="number"
                    min="0"
                    name="capacity"
                    value={formValues.capacity}
                    onChange={handleFormChange}
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Additional Time Note (optional)</span>
                <input
                  type="text"
                  name="time"
                  value={formValues.time}
                  onChange={handleFormChange}
                  maxLength={20}
                  placeholder="e.g. 10:00 AM - 2:00 PM"
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
                  {formSubmitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

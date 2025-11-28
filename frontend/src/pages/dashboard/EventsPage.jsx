import React from "react";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiRefreshCcw,
  FiClock,
  FiCheck,
} from "react-icons/fi";

const STATUS_BADGES = {
  open: "bg-emerald-100 text-emerald-600",
  full: "bg-red-100 text-red-600",
  ended: "bg-gray-200 text-gray-600",
};

const deriveStatus = (event) => {
  const now = Date.now();
  const eventDate = event.date ? new Date(event.date).getTime() : null;
  const capacity = typeof event.capacity === "number" ? event.capacity : null;
  const spotsRemaining = capacity ? Math.max(capacity - (event.attendeesCount || 0), 0) : null;

  if (eventDate && eventDate < now) {
    return { key: "ended", label: "Past" };
  }

  if (capacity && spotsRemaining === 0) {
    return { key: "full", label: "Full" };
  }

  return { key: "open", label: spotsRemaining !== null ? `${spotsRemaining} spots left` : "Open" };
};

export default function EventsPage() {
  const [events, setEvents] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const pendingActionRef = React.useRef(null);

  const loadEvents = React.useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/events", { credentials: "include", signal });

      if (response.status === 404) {
        setEvents([]);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load events.");
      }

      const fetched = Array.isArray(payload?.events) ? payload.events : [];
      setEvents(fetched);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Error fetching events", err);
      setError(err.message || "Unable to fetch events.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    loadEvents(controller.signal);
    return () => controller.abort();
  }, [loadEvents, refreshKey]);

  const handleRsvp = React.useCallback(
    async (eventId, isAttending) => {
      if (pendingActionRef.current) {
        return;
      }

      pendingActionRef.current = eventId;
      setFeedback("");

      try {
        const response = await fetch(`/api/events/${eventId}/rsvp`, {
          method: isAttending ? "DELETE" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.message || "Unable to update RSVP status.");
        }

        const updatedEvent = payload?.event;
        if (updatedEvent) {
          setEvents((existing) =>
            existing.map((entry) => (entry._id === eventId ? updatedEvent : entry))
          );
        }

        setFeedback(payload?.message || (isAttending ? "RSVP cancelled." : "RSVP confirmed."));
      } catch (err) {
        console.error("RSVP error", err);
        setFeedback(err.message || "Unable to process RSVP. Please try again.");
      } finally {
        pendingActionRef.current = null;
      }
    },
    []
  );

  const filteredEvents = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return events.filter((event) => {
      if (categoryFilter !== "all" && (event.category || "").toLowerCase() !== categoryFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [event.title, event.description, event.venue, event.category]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .some((value) => value.includes(term));
    });
  }, [categoryFilter, events, search]);

  const categories = React.useMemo(() => {
    const unique = new Set(events.map((event) => (event.category || "General").toLowerCase()));
    return ["all", ...Array.from(unique)];
  }, [events]);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campus Events</h1>
          <p className="text-sm text-gray-500 sm:text-base">
            RSVP to upcoming activities and keep track of what matters to you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            <FiRefreshCcw className="text-base" />
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <FiCalendar className="text-lg text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, description, or venue"
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="h-4 w-1/3 rounded bg-orange-100" />
              <div className="mt-3 h-3 w-1/2 rounded bg-orange-100" />
              <div className="mt-3 h-3 w-2/3 rounded bg-orange-100" />
              <div className="mt-6 h-10 w-full rounded bg-orange-100" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          {events.length === 0
            ? "No events scheduled yet. Check back soon!"
            : "No events match your filters. Try a different search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredEvents.map((event) => {
            const status = deriveStatus(event);
            const capacity =
              typeof event.capacity === "number" && event.capacity > 0
                ? `${event.attendeesCount || 0}/${event.capacity} attending`
                : `${event.attendeesCount || 0} attending`;
            const startTime = event.startTime || event.time || null;

            return (
              <article key={event._id} className="flex h-full flex-col justify-between rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase text-indigo-600">
                      {event.category || "General"}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGES[status.key]}`}>
                      {status.label}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <FiCalendar />
                      {event.date ? new Date(event.date).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }) : "Date TBA"}
                    </span>
                    {startTime && (
                      <span className="inline-flex items-center gap-1">
                        <FiClock />
                        {startTime}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin />
                      {event.venue || "Venue TBA"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiUsers />
                      {capacity}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {event.attendees?.slice(0, 3).map((attendee) => (
                      <span
                        key={`${event._id}-${attendee.email}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-orange-100 text-xs font-semibold text-orange-600"
                      >
                        {attendee?.name?.split(" ").map((part) => part[0]).join("") || "?"}
                      </span>
                    ))}
                    {event.attendeesCount > 3 && (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-gray-100 text-xs font-semibold text-gray-600">
                        +{event.attendeesCount - 3}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={pendingActionRef.current === event._id || status.key === "ended"}
                    onClick={() => handleRsvp(event._id, Boolean(event.isAttending))}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      event.isAttending
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-orange-500 text-white hover:bg-orange-400"
                    } disabled:opacity-60`}
                  >
                    {event.isAttending ? <FiCheck /> : <FiCalendar />}
                    {event.isAttending ? "Going" : "RSVP"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

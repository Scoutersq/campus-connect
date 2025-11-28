import React from "react";
import {
  FiAlertTriangle,
  FiRadio,
  FiUsers,
  FiClock,
  FiMapPin,
  FiRefreshCcw,
  FiCheck,
} from "react-icons/fi";
import { buildApiUrl } from "../../utils/fetchResource";

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

const AUDIENCE_LABELS = {
  all: "Entire campus",
  students: "Students",
  faculty: "Faculty",
};

export default function EmergencyAlertsPage() {
  const [alerts, setAlerts] = React.useState([]);
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [audienceFilter, setAudienceFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const pendingAckRef = React.useRef(null);

  const loadAlerts = React.useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/emergency/active"), { credentials: "include", signal });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load emergency alerts.");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setAlerts(data);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("Emergency alerts fetch error", err);
      setError(err.message || "Unable to fetch alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    loadAlerts(controller.signal);
    return () => controller.abort();
  }, [loadAlerts, refreshKey]);

  const handleAcknowledge = React.useCallback(async (alertId) => {
    if (pendingAckRef.current) {
      return;
    }

    pendingAckRef.current = alertId;
    setFeedback("");

    try {
      const response = await fetch(buildApiUrl(`/api/emergency/${alertId}/acknowledge`), {
        method: "POST",
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to acknowledge alert.");
      }

      setAlerts((existing) =>
        existing.map((alert) =>
          alert._id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
      setFeedback(payload?.message || "Alert acknowledged.");
    } catch (err) {
      console.error("Acknowledge alert error", err);
      setFeedback(err.message || "Unable to update alert status.");
    } finally {
      pendingAckRef.current = null;
    }
  }, []);

  const filteredAlerts = React.useMemo(() =>
    alerts.filter((alert) => {
      if (severityFilter !== "all" && alert.severity !== severityFilter) {
        return false;
      }
      if (audienceFilter !== "all" && alert.audience !== audienceFilter) {
        return false;
      }
      return true;
    }),
  [alerts, audienceFilter, severityFilter]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
          <p className="text-sm text-gray-500 sm:text-base">
            Monitor active alerts and acknowledge updates that apply to you.
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

      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {["all", "info", "warning", "critical"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSeverityFilter(level)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${{
                  true: "bg-orange-500 text-white",
                  false: "border border-orange-200 bg-white text-orange-500 hover:bg-orange-50",
                }[String(severityFilter === level)]}`}
              >
                {level === "all" ? "All Severity" : level}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {["all", "students", "faculty"].map((audience) => (
              <button
                key={audience}
                type="button"
                onClick={() => setAudienceFilter(audience)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${{
                  true: "bg-indigo-500 text-white",
                  false: "border border-indigo-200 bg-white text-indigo-500 hover:bg-indigo-50",
                }[String(audienceFilter === audience)]}`}
              >
                {audience === "all" ? "All Audiences" : AUDIENCE_LABELS[audience] || audience}
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
              <div className="mt-3 h-3 w-2/3 rounded bg-orange-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-orange-100" />
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          {alerts.length === 0
            ? "No active alerts right now."
            : "No alerts match your filters."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <article
              key={alert._id}
              className={`rounded-2xl border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info} p-6 shadow-sm`}
            >
              <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase">
                    <FiAlertTriangle />
                    <span>{alert.severity || "info"}</span>
                  </div>
                  <h2 className="text-xl font-bold">{alert.title}</h2>
                  <p className="text-sm">{alert.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={alert.acknowledged || pendingAckRef.current === alert._id}
                    onClick={() => handleAcknowledge(alert._id)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      alert.acknowledged
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border border-white bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:opacity-60`}
                  >
                    <FiCheck />
                    {alert.acknowledged ? "Acknowledged" : "Mark acknowledged"}
                  </button>
                </div>
              </header>
              <footer className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1">
                  <FiUsers />
                  {AUDIENCE_LABELS[alert.audience] || "All"}
                </span>
                {alert.metadata?.location && (
                  <span className="inline-flex items-center gap-1">
                    <FiMapPin />
                    {alert.metadata.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <FiRadio />
                  Channels: {(alert.deliveryChannels || []).join(", ") || "In-app"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FiClock />
                  {alert.createdAt
                    ? new Date(alert.createdAt).toLocaleString()
                    : "Posted just now"}
                </span>
                {alert.expiresAt && (
                  <span className="inline-flex items-center gap-1">
                    <FiClock />
                    Expires {new Date(alert.expiresAt).toLocaleString()}
                  </span>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

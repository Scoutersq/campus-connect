import React from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiAlertTriangle,
  FiRadio,
  FiUsers,
  FiClock,
  FiMapPin,
  FiRefreshCcw,
  FiCheck,
  FiPlusCircle,
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

const DELIVERY_CHANNELS = [
  { value: "in-app", label: "In-app" },
  { value: "push", label: "Push" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

const CATEGORY_OPTIONS = [
  { value: "weather", label: "Weather" },
  { value: "security", label: "Security" },
  { value: "health", label: "Health" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "other", label: "Other" },
];

const INITIAL_CREATE_VALUES = {
  title: "",
  message: "",
  severity: "info",
  category: "other",
  audience: "all",
  deliveryChannels: ["in-app"],
  expiresAt: "",
  location: "",
  attachments: "",
};

export default function EmergencyAlertsPage() {
  const outletContext = useOutletContext?.() ?? {};
  const { role = "user" } = outletContext;
  const isAdmin = role === "admin";
  const [alerts, setAlerts] = React.useState([]);
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [audienceFilter, setAudienceFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const pendingAckRef = React.useRef(null);
  const [createValues, setCreateValues] = React.useState(INITIAL_CREATE_VALUES);
  const [createState, setCreateState] = React.useState({ submitting: false, error: "", success: "" });

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

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleChannelToggle = (channel) => {
    setCreateValues((prev) => {
      const exists = prev.deliveryChannels.includes(channel);
      if (exists && prev.deliveryChannels.length === 1) {
        return prev; // ensure at least one channel remains selected
      }
      const nextChannels = exists
        ? prev.deliveryChannels.filter((item) => item !== channel)
        : [...prev.deliveryChannels, channel];
      return { ...prev, deliveryChannels: nextChannels };
    });
  };

  const handleResetForm = () => {
    setCreateValues(INITIAL_CREATE_VALUES);
    setCreateState((prev) => ({ ...prev, error: "", success: "" }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateState({ submitting: true, error: "", success: "" });

    if (!createValues.deliveryChannels.length) {
      setCreateState({ submitting: false, error: "Select at least one delivery channel.", success: "" });
      return;
    }

    let expiresAtIso;
    if (createValues.expiresAt) {
      const expiresDate = new Date(createValues.expiresAt);
      if (Number.isNaN(expiresDate.getTime())) {
        setCreateState({ submitting: false, error: "Provide a valid expiry date.", success: "" });
        return;
      }
      if (expiresDate <= new Date()) {
        setCreateState({ submitting: false, error: "Expiry must be in the future.", success: "" });
        return;
      }
      expiresAtIso = expiresDate.toISOString();
    }

    const metadata = {};
    if (createValues.location.trim()) {
      metadata.location = createValues.location.trim();
    }

    const attachmentLines = createValues.attachments
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (attachmentLines.length) {
      metadata.attachments = attachmentLines;
    }

    const payload = {
      title: createValues.title.trim(),
      message: createValues.message.trim(),
      severity: createValues.severity,
      category: createValues.category,
      audience: createValues.audience,
      deliveryChannels: createValues.deliveryChannels,
      ...(expiresAtIso ? { expiresAt: expiresAtIso } : {}),
      ...(Object.keys(metadata).length ? { metadata } : {}),
    };

    try {
      const response = await fetch(buildApiUrl("/api/emergency"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || "Failed to create emergency alert.");
      }

      setCreateState({ submitting: false, error: "", success: result?.message || "Emergency alert created." });
      setCreateValues(INITIAL_CREATE_VALUES);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error("Emergency alert create error", err);
      setCreateState({ submitting: false, error: err.message || "Unable to create alert.", success: "" });
    }
  };

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

      {isAdmin && (
        <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Emergency Alert</h2>
              <p className="text-sm text-gray-500">
                Publish urgent updates for the campus community. Fill in every required field before submitting.
              </p>
            </div>
          </header>
          {createState.error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {createState.error}
            </div>
          )}
          {createState.success && (
            <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-600">
              {createState.success}
            </div>
          )}
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  value={createValues.title}
                  onChange={handleCreateChange}
                  required
                  minLength={5}
                  maxLength={140}
                  placeholder="e.g. Severe weather warning"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Severity</span>
                <select
                  name="severity"
                  value={createValues.severity}
                  onChange={handleCreateChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>
            <label className="space-y-1 text-sm font-semibold text-gray-700">
              <span>Message</span>
              <textarea
                name="message"
                value={createValues.message}
                onChange={handleCreateChange}
                required
                minLength={20}
                maxLength={2000}
                rows={4}
                placeholder="Provide detailed instructions and the nature of the emergency."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Category</span>
                <select
                  name="category"
                  value={createValues.category}
                  onChange={handleCreateChange}
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
                  name="audience"
                  value={createValues.audience}
                  onChange={handleCreateChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="all">Entire campus</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </label>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Expires at (optional)</span>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={createValues.expiresAt}
                  onChange={handleCreateChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-gray-700">Delivery channels</legend>
              <div className="flex flex-wrap gap-3">
                {DELIVERY_CHANNELS.map((channel) => (
                  <label key={channel.value} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-600">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={createValues.deliveryChannels.includes(channel.value)}
                      onChange={() => handleChannelToggle(channel.value)}
                    />
                    {channel.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Location (optional)</span>
                <input
                  type="text"
                  name="location"
                  value={createValues.location}
                  onChange={handleCreateChange}
                  maxLength={120}
                  placeholder="e.g. North Hall, 2nd floor"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-gray-700">
                <span>Attachment URLs (optional, one per line)</span>
                <textarea
                  name="attachments"
                  value={createValues.attachments}
                  onChange={handleCreateChange}
                  rows={3}
                  placeholder="https://example.com/resource.pdf"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={createState.submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                <FiPlusCircle />
                {createState.submitting ? "Publishing..." : "Create Alert"}
              </button>
            </div>
          </form>
        </section>
      )}

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

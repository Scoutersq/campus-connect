import React from "react";
import {
  FiRefreshCcw,
  FiTrash2,
  FiMapPin,
  FiInbox,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { buildApiUrl } from "../../../utils/fetchResource";

const TABS = [
  {
    key: "lost",
    label: "Lost Items",
    description: "Reports submitted by students when they lose belongings.",
    emptyMessage: "No lost item reports found.",
  },
  {
    key: "found",
    label: "Found Items",
    description: "Items submitted as found and awaiting collection.",
    emptyMessage: "No found items recorded yet.",
  },
];

const formatDate = (value) => {
  if (!value) return "--";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch (_error) {
    return String(value);
  }
};

export default function AdminLostAndFoundPage() {
  const [activeTab, setActiveTab] = React.useState("lost");
  const [lostItems, setLostItems] = React.useState([]);
  const [foundItems, setFoundItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lostResponse, foundResponse] = await Promise.all([
        fetch(buildApiUrl("/api/admin/lost-items"), { credentials: "include" }),
        fetch(buildApiUrl("/api/admin/found-items"), { credentials: "include" }),
      ]);

      const lostPayload = await lostResponse.json().catch(() => ({}));
      const foundPayload = await foundResponse.json().catch(() => ({}));

      if (!lostResponse.ok) {
        throw new Error(lostPayload?.message || "Failed to load lost items.");
      }

      if (!foundResponse.ok) {
        throw new Error(foundPayload?.message || "Failed to load found items.");
      }

      setLostItems(Array.isArray(lostPayload.items) ? lostPayload.items : []);
      setFoundItems(Array.isArray(foundPayload.items) ? foundPayload.items : []);
    } catch (err) {
      console.error("Admin lost/found fetch error", err);
      setError(err.message || "Unable to load lost and found items.");
      toast.error(err.message || "Failed to refresh lost & found data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleDelete = async (type, id) => {
    if (!id) return;
    const confirm = window.confirm("Are you sure you want to remove this entry? This action cannot be undone.");
    if (!confirm) {
      return;
    }

    try {
      const endpoint = type === "lost" ? `/api/lost/${id}` : `/api/found/${id}`;
      const response = await fetch(buildApiUrl(endpoint), {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete record.");
      }

      toast.success("Entry deleted successfully.");
      if (type === "lost") {
        setLostItems((items) => items.filter((item) => item.id !== id));
      } else {
        setFoundItems((items) => items.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete lost/found error", err);
      toast.error(err.message || "Unable to delete entry.");
    }
  };

  const currentItems = activeTab === "lost" ? lostItems : foundItems;
  const currentTab = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found Control</h1>
          <p className="text-sm text-gray-500">
            Review and moderate reported items across the campus community.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
        >
          <FiRefreshCcw />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-orange-500 text-white"
                : "border border-orange-200 bg-white text-orange-500 hover:bg-orange-50"
            }`}
          >
            {tab.key === "lost" ? <FiAlertCircle /> : <FiInbox />}
            {tab.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{currentTab.label}</h2>
            <p className="text-sm text-gray-500">{currentTab.description}</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {currentItems.length} records
          </span>
        </header>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl border border-orange-100 bg-orange-50/60" />
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center text-sm text-gray-500">
            {currentTab.emptyMessage}
          </div>
        ) : (
          <ul className="space-y-4">
            {currentItems.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-500">
                      <FiMapPin />
                      {item.status?.toUpperCase() || "STATUS"}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="mr-3 font-semibold text-gray-600">Reported:</span>
                      {formatDate(activeTab === "lost" ? item.dateLost : item.dateFound)}
                    </div>
                    {item.reporter && (
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">Reporter:</span> {item.reporter.name} • {item.reporter.email}
                        {item.reporter.studentId ? ` • ${item.reporter.studentId}` : ""}
                      </div>
                    )}
                    {item.contact && (
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">Contact:</span> {item.contact}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 self-end md:self-start">
                    <button
                      type="button"
                      onClick={() => handleDelete(activeTab, item.id)}
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
    </div>
  );
}

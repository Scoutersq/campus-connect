import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiPlusCircle,
  FiSearch,
} from "react-icons/fi";
import ReportItemForm from "../../components/ReportItemForm";

const SUMMARY_CONFIG = [
  {
    label: "Open Lost Reports",
    accent: "bg-red-100 text-red-600",
    helper: (count) => (count ? `${Math.min(count, 5)} needs attention` : "All caught up"),
    sourceKey: "lost",
  },
  {
    label: "Found Items Logged",
    accent: "bg-orange-100 text-orange-600",
    helper: (count) => (count ? "Coordinate return with owners" : "No pickups pending"),
    sourceKey: "found",
  },
  {
    label: "New This Week",
    accent: "bg-indigo-100 text-indigo-600",
    helper: (count) => (count ? "Keep an eye on recent activity" : "No new reports this week"),
    sourceKey: "week",
  },
];

export default function LostAndFoundPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [showLostForm, setShowLostForm] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [lostItems, setLostItems] = React.useState([]);
  const [foundItems, setFoundItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (searchParams.get("report") === "1") {
      setShowLostForm(true);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("report");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const parsePayload = React.useCallback(async (response) => {
    if (response.status === 404) {
      return { preview: [] };
    }

    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }

    if (!response.ok) {
      throw new Error(body?.message || "Failed to fetch lost & found data.");
    }

    return body;
  }, []);

  const loadData = React.useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const [lostResponse, foundResponse] = await Promise.all([
          fetch("/api/lost/preview", { credentials: "include", signal }),
          fetch("/api/found/preview", { credentials: "include", signal }),
        ]);

        const lostData = await parsePayload(lostResponse);
        const foundData = await parsePayload(foundResponse);

        setLostItems(Array.isArray(lostData?.preview) ? lostData.preview : []);
        setFoundItems(Array.isArray(foundData?.preview) ? foundData.preview : []);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message || "Unable to load lost and found items.");
      } finally {
        setLoading(false);
      }
    },
    [parsePayload]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData, refreshKey]);

  const triggerRefresh = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const decoratedItems = React.useMemo(() => {
    const withType = (items, type) => items.map((entry) => ({ ...entry, _type: type }));
    return [...withType(lostItems, "lost"), ...withType(foundItems, "found")];
  }, [lostItems, foundItems]);

  const filteredItems = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return decoratedItems
      .filter((item) => {
        if (filter !== "all" && item._type !== filter) {
          return false;
        }

        if (!term) return true;

        const textFields = [
          item.title,
          item.description,
          item.category,
          item.location,
          item.locationFound,
          item.contact,
        ]
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

  const summaryValues = React.useMemo(
    () => ({
      lost: lostItems.length,
      found: foundItems.length,
      week: itemsThisWeek,
    }),
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
      <div key={item._id} className="flex flex-col gap-3 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500">{locationText || "Location not provided"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeStyles}`}>
            {item._type}
          </span>
        </div>
        <p className="max-h-20 overflow-hidden text-sm text-gray-600">
          {item.description || "No description provided."}
        </p>
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
          onClick={() => setSelectedItem(item)}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
        >
          View Details
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-[90vh] rounded-xl bg-[#FFF8F3] px-3 py-6 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Lost &amp; Found</h2>
          <p className="text-sm text-gray-500 sm:text-base">Help reunite items with their owners.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowLostForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400"
          >
            <FiPlusCircle className="text-lg" />
            Report Item
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_CONFIG.map((card) => (
          <div key={card.label} className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{summaryValues[card.sourceKey]}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${card.accent}`}
              >
                {card.helper(summaryValues[card.sourceKey])}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
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
                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${{
                  true: "bg-orange-500 text-white",
                  false: "border border-orange-200 bg-white text-orange-500 hover:bg-orange-50",
                }[String(filter === value)]}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 rounded-xl border border-orange-100 bg-white p-5 shadow-sm animate-pulse">
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
              onClick={() => setSelectedItem(null)}
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
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-2">
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
          onClose={() => setShowLostForm(false)}
          onSuccess={() => {
            setShowLostForm(false);
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}

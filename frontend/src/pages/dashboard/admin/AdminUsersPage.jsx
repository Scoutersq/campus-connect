import React from "react";
import {
  FiUsers,
  FiShield,
  FiRefreshCcw,
  FiMail,
  FiUserCheck,
  FiUserX,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { buildApiUrl } from "../../../utils/fetchResource";

const formatDate = (value) => {
  if (!value) return "--";
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
  } catch (_error) {
    return String(value);
  }
};

const statusBadge = (active) =>
  active
    ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
    : "bg-gray-100 text-gray-500 border border-gray-200";

export default function AdminUsersPage() {
  const [summary, setSummary] = React.useState({ totalUsers: 0, users: [], admins: [] });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [activeSection, setActiveSection] = React.useState("users");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");

  const loadDirectory = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildApiUrl("/api/admin/users"), {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load user directory.");
      }
      setSummary({
        totalUsers: payload.totalUsers || 0,
        users: Array.isArray(payload.users) ? payload.users : [],
        admins: Array.isArray(payload.admins) ? payload.admins : [],
      });
    } catch (err) {
      console.error("Admin users fetch error", err);
      setError(err.message || "Unable to load directory.");
      toast.error(err.message || "Failed to refresh directory");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDirectory();
  }, [loadDirectory, refreshKey]);

  const filteredItems = React.useMemo(() => {
    const source = activeSection === "admins" ? summary.admins : summary.users;
    if (!searchTerm.trim()) return source;
    const lower = searchTerm.trim().toLowerCase();
    return source.filter((item) => {
      return [item.name, item.email, item.studentId, item.adminCode]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower));
    });
  }, [summary, activeSection, searchTerm]);

  const sectionLabel = activeSection === "admins" ? "Admins" : "Students";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Directory</h1>
          <p className="text-sm text-gray-500">
            Track who has access, confirm activity, and keep contact details organized.
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              Total Users
            </span>
            <FiUsers className="text-orange-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
          <p className="text-xs text-gray-500">Registered students on the platform.</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              Active Students
            </span>
            <FiUserCheck className="text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {summary.users.filter((user) => user.active).length}
          </p>
          <p className="text-xs text-gray-500">Currently signed in with valid sessions.</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              Admin Team
            </span>
            <FiShield className="text-orange-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{summary.admins.length}</p>
          <p className="text-xs text-gray-500">Total administrators with dashboard access.</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              Admins Online
            </span>
            <FiUserCheck className="text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {summary.admins.filter((admin) => admin.active).length}
          </p>
          <p className="text-xs text-gray-500">Admins with active sessions right now.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSection("users")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSection === "users"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-200 bg-white text-orange-500 hover:bg-orange-50"
              }`}
            >
              <FiUsers />
              Students
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("admins")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSection === "admins"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-200 bg-white text-orange-500 hover:bg-orange-50"
              }`}
            >
              <FiShield />
              Admins
            </button>
          </div>
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder={`Search ${sectionLabel.toLowerCase()}...`}
              className="w-full rounded-full border border-orange-100 bg-orange-50/60 py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{sectionLabel}</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {filteredItems.length} records
            </span>
          </header>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl border border-orange-100 bg-orange-50/60" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center text-sm text-gray-500">
              No {sectionLabel.toLowerCase()} matched your filters.
            </div>
          ) : (
            <ul className="divide-y divide-orange-100">
              {filteredItems.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name || "Unnamed"}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FiMail />
                        {item.email || "--"}
                      </span>
                      {activeSection === "admins" ? (
                        <span className="inline-flex items-center gap-1">
                          Admin Code:
                          <strong className="font-semibold text-gray-700">{item.adminCode || "--"}</strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          Student ID:
                          <strong className="font-semibold text-gray-700">{item.studentId || "--"}</strong>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        Joined {formatDate(item.joinedAt || item.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(item.active)}`}
                  >
                    {item.active ? <FiUserCheck /> : <FiUserX />}
                    {item.active ? "Active" : "Offline"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

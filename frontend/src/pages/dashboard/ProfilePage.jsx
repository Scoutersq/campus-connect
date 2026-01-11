import React from "react";
import { FiUser, FiMail, FiPhone, FiBookOpen, FiCamera, FiEdit2, FiRefreshCw, FiAward, FiUploadCloud } from "react-icons/fi";
import { fetchResource, buildApiUrl } from "../../utils/fetchResource";

const INITIAL_PROFILE = {
  firstName: "",
  lastName: "",
  email: "",
  studentId: "",
  avatarUrl: "",
  phoneNumber: "",
  bio: "",
  academicYear: "",
  department: "",
};

const academicYearOptions = ["1", "2", "3", "4"];

function AvatarBadge({ name = "", avatarUrl = "", size = 64 }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase?.())
    .filter(Boolean)
    .slice(0, 2)
    .join("") || "?";

  const resolvedAvatar = React.useMemo(() => {
    if (!avatarUrl) return "";
    if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
    const normalized = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
    return buildApiUrl(normalized);
  }, [avatarUrl]);

  if (resolvedAvatar) {
    return (
      <img
        src={resolvedAvatar}
        alt={name || "Profile avatar"}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={(event) => {
          // fallback to initials if image fails
          event.currentTarget.style.display = "none";
          const sibling = event.currentTarget.nextElementSibling;
          if (sibling) sibling.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = React.useState(INITIAL_PROFILE);
  const [viewProfile, setViewProfile] = React.useState(INITIAL_PROFILE);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState("");
  const fileInputRef = React.useRef(null);

  const fullName = React.useMemo(() => {
    const name = `${profile.firstName} ${profile.lastName}`.trim();
    return name || profile.email || "Your Profile";
  }, [profile.firstName, profile.lastName, profile.email]);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await fetchResource("/api/profile/me", null);
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }
    const normalized = { ...INITIAL_PROFILE, ...(data?.profile || {}) };
    setProfile(normalized);
    setViewProfile(normalized);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    if (!editing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Please choose a PNG, JPG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be under 2MB.");
      event.target.value = "";
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(buildApiUrl("/api/profile/avatar"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const bodyText = await response.text();
      let body = {};
      try {
        body = JSON.parse(bodyText);
      } catch (_e) {
        body = {};
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Avatar upload is not available on this server. Please redeploy or point the app to the updated backend.");
        }
        throw new Error(body?.message || bodyText || "Failed to upload avatar.");
      }

      const updated = { ...profile, ...(body.profile || {}), avatarUrl: body.avatarUrl || body.profile?.avatarUrl };
      setProfile(updated);
      setViewProfile(updated);
    } catch (err) {
      setAvatarError(err.message || "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        avatarUrl: profile.avatarUrl.trim() || undefined,
        phoneNumber: profile.phoneNumber.trim() || undefined,
        bio: profile.bio.trim() || undefined,
        academicYear: profile.academicYear.trim() || undefined,
        department: profile.department.trim() || undefined,
      };
      const response = await fetch(buildApiUrl("/api/profile/me"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || "Failed to save profile.");
      }
      const updated = { ...profile, ...(body.profile || {}) };
      setProfile(updated);
      setViewProfile(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfile(viewProfile);
    setEditing(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal and academic details.</p>
        </div>
        <button
          type="button"
          onClick={loadProfile}
          className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
          disabled={loading}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={!editing || avatarUploading}
                className={`${editing ? "cursor-pointer" : "cursor-default"} relative rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200`}
              >
                <AvatarBadge name={fullName} avatarUrl={viewProfile.avatarUrl} size={72} />
                {editing && (
                  <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow">
                    {avatarUploading ? <FiUploadCloud className="animate-pulse" /> : <FiCamera />}
                  </span>
                )}
              </button>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{fullName}</p>
              {viewProfile.studentId && (
                <p className="text-sm text-gray-500">Student ID: {viewProfile.studentId}</p>
              )}
              <p className="text-sm text-gray-500">{viewProfile.email}</p>
            </div>
          </div>
          {editing ? null : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
            >
              <FiEdit2 />
              Edit Profile
            </button>
          )}
        </div>
        {avatarError && (
          <p className="mt-2 text-sm text-red-500">{avatarError}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleAvatarSelected}
        />
      </section>

      {!editing && !loading && (
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-50 bg-orange-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Personal</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{fullName}</p>
              <p className="text-sm text-gray-600">{viewProfile.email}</p>
              {viewProfile.phoneNumber && (
                <p className="mt-1 text-sm text-gray-600">{viewProfile.phoneNumber}</p>
              )}
            </div>
            <div className="rounded-2xl border border-orange-50 bg-orange-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Academic</p>
              <p className="mt-2 text-sm text-gray-700">Year: {viewProfile.academicYear || "--"}</p>
              <p className="text-sm text-gray-700">Department: {viewProfile.department || "--"}</p>
              {viewProfile.studentId && (
                <p className="text-sm text-gray-700">Student ID: {viewProfile.studentId}</p>
              )}
            </div>
          </div>
          {viewProfile.bio && (
            <div className="rounded-2xl border border-orange-50 bg-white p-4 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Bio</p>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{viewProfile.bio}</p>
            </div>
          )}
        </section>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-orange-500">
            <FiUser />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-orange-50/60" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>First Name</span>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={10}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Email</span>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <FiMail />
                  <span className="truncate">{profile.email || "--"}</span>
                </div>
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Phone Number</span>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                  <FiPhone className="text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profile.phoneNumber}
                    onChange={handleChange}
                    placeholder="+91 1234567890"
                    inputMode="tel"
                    pattern="^\+?[0-9]{1,3}\s?[0-9]{7,12}$"
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </label>
              <label className="md:col-span-2 space-y-2 text-sm font-medium text-gray-700">
                <span>Bio</span>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={400}
                  placeholder="Tell classmates a bit about you, interests, or goals."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>
          )}
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-orange-500">
            <FiBookOpen />
            <h2 className="text-lg font-semibold text-gray-900">Academic Information</h2>
          </div>
          {loading ? (
            <div className="h-28 animate-pulse rounded-2xl bg-orange-50/60" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2">
                  <FiAward className="text-orange-400" /> Year
                </span>
                <div className="relative">
                  <select
                    name="academicYear"
                    value={profile.academicYear}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-lg border border-orange-100 bg-gradient-to-r from-orange-50 to-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Select year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-orange-400">
                    ▼
                  </span>
                </div>
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Department</span>
                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  maxLength={80}
                  placeholder="Computer Science"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>
          )}
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow transition hover:from-orange-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              <FiEdit2 />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

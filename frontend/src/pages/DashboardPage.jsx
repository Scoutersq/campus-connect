import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getPortalRole } from "../utils/portalRole";
import OverviewPage from "./dashboard/OverviewPage";
import LostAndFoundPage from "./dashboard/LostAndFoundPage";
import EventsPage from "./dashboard/EventsPage";
import AnnouncementsPage from "./dashboard/AnnouncementsPage";
import EmergencyAlertsPage from "./dashboard/EmergencyAlertsPage";
import PlaceholderPage from "./dashboard/PlaceholderPage";
import NotesPage from "./dashboard/NotesPage";
import AdminOverviewPage from "./dashboard/admin/AdminOverviewPage";
import AdminLostAndFoundPage from "./dashboard/admin/AdminLostAndFoundPage";
import AdminEventsPage from "./dashboard/admin/AdminEventsPage";
import AdminAnnouncementsPage from "./dashboard/admin/AdminAnnouncementsPage";
import AdminUsersPage from "./dashboard/admin/AdminUsersPage";

export default function DashboardPage() {
  const [role, setRole] = React.useState(null);

  React.useEffect(() => {
    const stored = getPortalRole({ fallbackToLegacy: true });
    setRole(stored === "admin" ? "admin" : "user");
  }, []);

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-500">
          Loading dashboard...
        </span>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<DashboardLayout role={role} />}>
        {role === "admin" ? (
          <>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="manage/lost-found" element={<AdminLostAndFoundPage />} />
            <Route path="manage/events" element={<AdminEventsPage />} />
            <Route path="manage/announcements" element={<AdminAnnouncementsPage />} />
          </>
        ) : (
          <>
            <Route index element={<OverviewPage />} />
            <Route path="lost-and-found" element={<LostAndFoundPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="skills" element={<PlaceholderPage title="Skill Exchange" />} />
          </>
        )}

        <Route path="emergency-alerts" element={<EmergencyAlertsPage />} />
        <Route path="discussions" element={<PlaceholderPage title="Discussions" />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}

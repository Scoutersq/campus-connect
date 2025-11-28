import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import OverviewPage from "./dashboard/OverviewPage";
import LostAndFoundPage from "./dashboard/LostAndFoundPage";
import EventsPage from "./dashboard/EventsPage";
import AnnouncementsPage from "./dashboard/AnnouncementsPage";
import EmergencyAlertsPage from "./dashboard/EmergencyAlertsPage";
import PlaceholderPage from "./dashboard/PlaceholderPage";

export default function DashboardPage() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="lost-and-found" element={<LostAndFoundPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="emergency-alerts" element={<EmergencyAlertsPage />} />
        <Route path="discussions" element={<PlaceholderPage title="Discussions" />} />
        <Route path="notes" element={<PlaceholderPage title="Notes Sharing" />} />
        <Route path="skills" element={<PlaceholderPage title="Skill Exchange" />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import UnitsPage from "./pages/UnitsPage.jsx";
import AvailabilityPage from "./pages/AvailabilityPage.jsx";
import MatchingPage from "./pages/MatchingPage.jsx";
import RequestsPage from "./pages/RequestsPage.jsx";
import MatchesPage from "./pages/MatchesPage.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import FeedbackPage from "./pages/FeedbackPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import BlocksPage from "./pages/BlocksPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<div className="container">Not found</div>} />
      </Route>
    </Routes>
  );
}

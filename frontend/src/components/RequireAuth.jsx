import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../auth.js";

/** Blocks access to private routes if the user isn’t logged in. */
export default function RequireAuth() {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}

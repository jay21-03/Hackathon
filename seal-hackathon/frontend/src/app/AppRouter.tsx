import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { PlaceholderPage } from "../components/PlaceholderPage";

const routeDefinitions = [
  "/",
  "/login",
  "/events",
  "/me/profile",
  "/me/team",
  "/me/check-in",
  "/me/problem",
  "/me/countdown",
  "/me/results",
  "/organizer/dashboard",
  "/organizer/events",
  "/organizer/boards",
  "/organizer/check-ins",
  "/organizer/scoring",
  "/organizer/ranking",
  "/judge/dashboard",
  "/mentor/dashboard"
];

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {routeDefinitions.map((path) => (
          <Route
            key={path}
            path={path === "/" ? "" : path.slice(1)}
            element={<PlaceholderPage title={path} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

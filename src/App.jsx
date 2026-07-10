import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import AdminDashboard from "../pages/AdminDashboard";
import LoginPage from "../pages/LoginPage";
import MoMDashboard from "../pages/MoMDashboard";
import ProponentDashboard from "../pages/ProponentDashboard";
import ScrutinyDashboard from "../pages/ScrutinyDashboard";
import SignupPage from "../pages/SignupPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
      <Route path="/mom-dashboard/*" element={<MoMDashboard />} />
      <Route path="/proponent-dashboard" element={<ProponentDashboard />} />
      <Route path="/scrutiny-dashboard/*" element={<ScrutinyDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;

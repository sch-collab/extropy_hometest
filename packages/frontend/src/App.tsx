import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuthStore } from "./state/auth";
function Protected({ children }: { children: React.ReactElement }) { const token = useAuthStore((s) => s.token); if (!token) return <Navigate to="/auth?mode=login" replace />; return children; }
export default function App() { const token = useAuthStore((s) => s.token); return <Routes><Route path="/auth" element={<AuthPage />} /><Route path="/" element={<Protected><DashboardPage /></Protected>} /><Route path="*" element={<Navigate to={token ? "/" : "/auth?mode=login"} replace />} /></Routes>; }

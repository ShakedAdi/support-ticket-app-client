import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

export function ProtectedRoute() {
  const { session, isPending } = useAuth();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

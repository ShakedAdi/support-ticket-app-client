import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function HomePage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const name = session?.user.name ?? "";

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <span className="font-semibold text-card-foreground">{name}</span>
        <button
          onClick={handleLogout}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-card-foreground hover:bg-accent"
        >
          Logout
        </button>
      </nav>

      <main className="flex items-center justify-center p-12">
        <p className="text-lg text-muted-foreground">Welcome, {name}</p>
      </main>
    </div>
  );
}

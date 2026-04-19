import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";

export function HomePage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const name = session?.user.name ?? "";
  const isAdmin = session?.user.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        name={name}
        actions={<>
          {isAdmin && (
            <Link
              to="/users"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-card-foreground hover:bg-accent"
            >
              Users
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-card-foreground hover:bg-accent"
          >
            Logout
          </button>
        </>}
      />

      <main className="flex flex-col items-center justify-center p-12 gap-2">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">Helpdesk</h1>
        <p className="text-lg text-muted-foreground">Welcome, {name}</p>
      </main>
    </div>
  );
}

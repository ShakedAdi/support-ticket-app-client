import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

type Session = typeof authClient.$Infer.Session;

interface AuthContextValue {
  session: Session | null;
  isPending: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
  }

  return (
    <AuthContext.Provider value={{ session: session ?? null, isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

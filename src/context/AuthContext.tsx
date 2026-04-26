import { authClient } from "@/lib/auth-client";
import { AuthContext } from "./authContext";

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

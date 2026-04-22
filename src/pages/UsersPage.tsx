import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: users = [], isPending, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () =>
      axios
        .get<User[]>(`${import.meta.env.VITE_API_URL}/api/users`, { withCredentials: true })
        .then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        name={session?.user.name ?? ''}
        actions={
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-card-foreground hover:bg-accent"
          >
            Back
          </button>
        }
      />

      <main className="flex flex-col items-center justify-center p-12 gap-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        {isPending ? (
          <span className="text-sm text-muted-foreground">Loading…</span>
        ) : isError ? (
          <span className="text-sm text-destructive">Failed to load users.</span>
        ) : (
          <ul className="w-full max-w-md divide-y divide-border rounded-lg border">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{u.role}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

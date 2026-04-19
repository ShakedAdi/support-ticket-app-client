import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/users`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .finally(() => setIsPending(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      {isPending ? (
        <span className="text-sm text-muted-foreground">Loading…</span>
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
    </div>
  );
}

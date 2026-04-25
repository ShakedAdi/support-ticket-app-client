import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

type Ticket = {
  id: string;
  subject: string;
  senderEmail: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
};

const statusBadge: Record<Ticket['status'], string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

const statusLabel: Record<Ticket['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export function TicketsPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: tickets = [], isPending, isError } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () =>
      axios
        .get<Ticket[]>(`${import.meta.env.VITE_API_URL}/api/tickets`, { withCredentials: true })
        .then((res) => res.data),
  });

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  const name = session?.user.name ?? '';
  const isAdmin = session?.user.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        name={name}
        actions={
          <>
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
          </>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Tickets</h1>

        {isError && (
          <p className="text-sm text-destructive">Failed to load tickets. Please try again.</p>
        )}

        {isPending && (
          <ul className="divide-y divide-border rounded-lg border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </li>
            ))}
          </ul>
        )}

        {!isPending && !isError && tickets.length === 0 && (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        )}

        {!isPending && !isError && tickets.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm text-foreground">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ticket.senderEmail}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[ticket.status]}`}
                >
                  {statusLabel[ticket.status]}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

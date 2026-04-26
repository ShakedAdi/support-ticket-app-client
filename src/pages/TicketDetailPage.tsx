import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { type TicketDetail, statusBadge, statusLabel } from '@/types/ticket';
import { Role } from '@/types/role';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: ticket, isPending, isError } = useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios
        .get<TicketDetail>(`${import.meta.env.VITE_API_URL}/api/tickets/${id}`, {
          withCredentials: true,
        })
        .then((res) => res.data),
    enabled: !!id,
  });

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  const name = session?.user.name ?? '';
  const isAdmin = session?.user.role === Role.admin;

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

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          to="/tickets"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to tickets
        </Link>

        {isError && (
          <p className="mt-4 text-sm text-destructive">Ticket not found or failed to load.</p>
        )}

        {isPending && (
          <div className="mt-4 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}

        {!isPending && !isError && ticket && (
          <div className="mt-4 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground leading-snug">{ticket.subject}</h1>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[ticket.status]}`}>
                {statusLabel[ticket.status]}
              </span>
            </div>

            {/* Meta */}
            <div className="rounded-lg border divide-y divide-border text-sm">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-muted-foreground">From</span>
                <span className="text-foreground">{ticket.senderEmail}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Assigned to</span>
                <span className="text-foreground">{ticket.assignedTo?.name ?? 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Last updated</span>
                <span className="text-foreground">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Body */}
            <div>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Message
              </h2>
              <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.body}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

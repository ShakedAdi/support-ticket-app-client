import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { type TicketDetail, type TicketReply, statusBadge, statusLabel } from '@/types/ticket';
import { Role } from '@/types/role';

type Agent = { id: string; name: string };

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const [replyBody, setReplyBody] = useState('');

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () =>
      axios
        .get<Agent[]>(`${import.meta.env.VITE_API_URL}/api/agents`, { withCredentials: true })
        .then((res) => res.data),
  });

  const { data: replies = [] } = useQuery<TicketReply[]>({
    queryKey: ['ticket-replies', id],
    queryFn: () =>
      axios
        .get<TicketReply[]>(`${import.meta.env.VITE_API_URL}/api/tickets/${id}/replies`, {
          withCredentials: true,
        })
        .then((res) => res.data),
    enabled: !!id,
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/tickets/${id}/replies`, { body }, { withCredentials: true })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-replies', id] });
      setReplyBody('');
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tickets/${id}/assign`,
        { assignedToId },
        { withCredentials: true }
      ).then((res) => res.data),
    onSuccess: (updated: TicketDetail) => {
      queryClient.setQueryData(['ticket', id], updated);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketDetail['status']) =>
      axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tickets/${id}/status`,
        { status },
        { withCredentials: true }
      ).then((res) => res.data),
    onSuccess: (updated: TicketDetail) => {
      queryClient.setQueryData(['ticket', id], updated);
    },
  });

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  function handleAssignChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    assignMutation.mutate(value === '' ? null : value);
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
                <span className="text-muted-foreground">Status</span>
                <select
                  value={ticket.status}
                  onChange={(e) => statusMutation.mutate(e.target.value as TicketDetail['status'])}
                  disabled={statusMutation.isPending}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Assigned to</span>
                <select
                  value={ticket.assignedTo?.id ?? ''}
                  onChange={handleAssignChange}
                  disabled={assignMutation.isPending}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
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

            {assignMutation.isError && (
              <p className="text-sm text-destructive">Failed to reassign ticket. Please try again.</p>
            )}

            {statusMutation.isError && (
              <p className="text-sm text-destructive">Failed to update status. Please try again.</p>
            )}

            {/* Body */}
            <div>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Message
              </h2>
              <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.body}
              </div>
            </div>

            {/* Replies */}
            <div>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Replies{replies.length > 0 && ` (${replies.length})`}
              </h2>

              {replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-foreground">{reply.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (replyBody.trim()) replyMutation.mutate(replyBody);
                }}
                className="mt-4 space-y-2"
              >
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  disabled={replyMutation.isPending}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 resize-none"
                />
                {replyMutation.isError && (
                  <p className="text-sm text-destructive">Failed to send reply. Please try again.</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={replyMutation.isPending || !replyBody.trim()}
                    className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

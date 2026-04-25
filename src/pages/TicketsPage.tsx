import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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

  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  const sortBy = sorting[0]?.id ?? 'createdAt';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data: tickets = [], isPending, isError } = useQuery<Ticket[]>({
    queryKey: ['tickets', sortBy, sortOrder],
    queryFn: () =>
      axios
        .get<Ticket[]>(`${import.meta.env.VITE_API_URL}/api/tickets`, {
          params: { sortBy, sortOrder },
          withCredentials: true,
        })
        .then((res) => res.data),
  });

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: (info) => {
          const ticket = info.row.original;
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-sm text-foreground">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ticket.senderEmail}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue<Ticket['status']>();
          return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[status]}`}>
              {statusLabel[status]}
            </span>
          );
        },
      },
      {
        id: 'assignedToName',
        header: 'Assigned To',
        accessorFn: (row) => row.assignedTo?.name ?? 'Unassigned',
        cell: (info) => (
          <span className="text-xs text-muted-foreground">{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {new Date(info.getValue<string>()).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
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
          <div className="rounded-lg border divide-y divide-border">
            <div className="flex gap-4 px-4 py-2.5 bg-muted/50">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        )}

        {!isPending && !isError && tickets.length === 0 && (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        )}

        {!isPending && !isError && tickets.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                        >
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

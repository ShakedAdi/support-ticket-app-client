export type Ticket = {
  id: string;
  subject: string;
  senderEmail: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
};

export type TicketDetail = Ticket & {
  body: string;
  updatedAt: string;
};

export type TicketReply = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
};

export const statusBadge: Record<Ticket['status'], string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

export const statusLabel: Record<Ticket['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { UsersPage } from './UsersPage';

vi.mock('axios');
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { name: 'Admin' } } }),
}));

const mockedAxios = vi.mocked(axios);

const USERS = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', createdAt: '' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'agent', createdAt: '' },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UsersPage', () => {
  it('shows skeletons while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));
    renderPage();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(5);
    items.forEach((item) => expect(item.querySelector('.animate-pulse')).toBeTruthy());
  });

  it('renders user list on success', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
  });

  it('shows error message on server error', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('500'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Failed to load users.')).toBeInTheDocument(),
    );
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { UsersPage } from './UsersPage';
import { Role } from '@/types/role';

vi.mock('axios');
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { name: 'Admin' } } }),
}));

const mockedAxios = vi.mocked(axios);

const USERS = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: Role.admin, createdAt: '' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: Role.agent, createdAt: '' },
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

describe('UsersPage — Add User modal', () => {
  beforeEach(() => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
  });

  it('modal hidden by default', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Add User' })).not.toBeInTheDocument();
  });

  it('modal shown when Add User button clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add User' }));
    expect(screen.getByRole('heading', { name: 'Add User' })).toBeInTheDocument();
  });

  it('modal hidden when Cancel button clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add User' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Add User' })).not.toBeInTheDocument();
  });

  it('modal hidden when clicking outside (backdrop)', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add User' }));
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    await user.click(backdrop);
    expect(screen.queryByRole('heading', { name: 'Add User' })).not.toBeInTheDocument();
  });
});

describe('UsersPage — Add User form validation', () => {
  async function openModal() {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add User' }));
    return user;
  }

  it('shows name error when name shorter than 3 chars', async () => {
    const user = await openModal();
    await user.type(screen.getByLabelText('Name'), 'Ab');
    await user.click(screen.getByRole('button', { name: 'Create User' }));
    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument(),
    );
  });

  it('shows email error when email invalid', async () => {
    const user = await openModal();
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create User' }));
    await waitFor(() =>
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument(),
    );
  });

  it('shows password error when password shorter than 8 chars', async () => {
    const user = await openModal();
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create User' }));
    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument(),
    );
  });

  it('shows all errors when submitting empty form', async () => {
    const user = await openModal();
    await user.click(screen.getByRole('button', { name: 'Create User' }));
    await waitFor(() =>
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument(),
    );
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('submits and closes modal on valid input', async () => {
    const user = await openModal();
    const newUser = { id: '3', name: 'Carol', email: 'carol@example.com', role: Role.agent, createdAt: '' };
    mockedAxios.post = vi.fn().mockResolvedValue({ data: newUser });
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [...USERS, newUser] });

    await user.type(screen.getByLabelText('Name'), 'Carol');
    await user.type(screen.getByLabelText('Email'), 'carol@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepassword');
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Add User' })).not.toBeInTheDocument(),
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      { name: 'Carol', email: 'carol@example.com', password: 'securepassword' },
      { withCredentials: true },
    );
  });

  it('shows server error when POST fails', async () => {
    const user = await openModal();
    const axiosError = Object.assign(new Error(), {
      isAxiosError: true,
      response: { data: { error: 'A user with this email already exists' } },
    });
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
    mockedAxios.post = vi.fn().mockRejectedValue(axiosError);

    await user.type(screen.getByLabelText('Name'), 'Carol');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepassword');
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() =>
      expect(screen.getByText('A user with this email already exists')).toBeInTheDocument(),
    );
  });
});

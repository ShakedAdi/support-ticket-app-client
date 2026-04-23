import { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const addUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

export function UsersPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: users = [], isPending, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () =>
      axios
        .get<User[]>(`${import.meta.env.VITE_API_URL}/api/users`, { withCredentials: true })
        .then((res) => res.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
  });

  const createUser = useMutation({
    mutationFn: (data: AddUserFormData) =>
      axios
        .post<User>(`${import.meta.env.VITE_API_URL}/api/users`, data, { withCredentials: true })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      reset();
      setServerError('');
    },
  });

  function openModal() {
    reset();
    setServerError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    reset();
    setServerError('');
  }

  async function onSubmit(data: AddUserFormData) {
    setServerError('');
    try {
      await createUser.mutateAsync(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.error ?? 'Failed to create user');
      } else {
        setServerError('Failed to create user');
      }
    }
  }

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
        <div className="w-full max-w-md flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Users</h1>
          <Button onClick={openModal}>Add User</Button>
        </div>

        {isPending ? (
          <ul className="w-full max-w-md divide-y divide-border rounded-lg border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-10" />
              </li>
            ))}
          </ul>
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Add User</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="off"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

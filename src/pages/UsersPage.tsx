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

const verifyPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
});
type VerifyPasswordFormData = z.infer<typeof verifyPasswordSchema>;

const editUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  newPassword: z.string().refine((v) => v === '' || v.length >= 8, {
    message: 'New password must be at least 8 characters',
  }),
});
type EditUserFormData = z.infer<typeof editUserSchema>;

export function UsersPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Add user modal
  const [showModal, setShowModal] = useState(false);
  const [serverError, setServerError] = useState('');

  // Edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editStep, setEditStep] = useState<1 | 2>(1);
  const [verifiedCurrentPassword, setVerifiedCurrentPassword] = useState('');
  const [editServerError, setEditServerError] = useState('');

  const { data: users = [], isPending, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () =>
      axios
        .get<User[]>(`${import.meta.env.VITE_API_URL}/api/users`, { withCredentials: true })
        .then((res) => res.data),
  });

  // Add user form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
  });

  // Edit — step 1 form (verify current password)
  const step1Form = useForm<VerifyPasswordFormData>({
    resolver: zodResolver(verifyPasswordSchema),
  });

  // Edit — step 2 form (edit fields)
  const step2Form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: '', email: '', newPassword: '' },
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

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; email: string; currentPassword: string; newPassword?: string } }) =>
      axios
        .put<User>(`${import.meta.env.VITE_API_URL}/api/users/${id}`, data, { withCredentials: true })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeEditModal();
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

  function openEditModal(user: User) {
    setEditingUser(user);
    setEditStep(1);
    setVerifiedCurrentPassword('');
    setEditServerError('');
    step1Form.reset();
    step2Form.reset({ name: '', email: '', newPassword: '' });
  }

  function closeEditModal() {
    setEditingUser(null);
    setEditStep(1);
    setVerifiedCurrentPassword('');
    setEditServerError('');
    step1Form.reset();
    step2Form.reset({ name: '', email: '', newPassword: '' });
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

  function onStep1Submit(data: VerifyPasswordFormData) {
    setVerifiedCurrentPassword(data.currentPassword);
    setEditServerError('');
    step2Form.reset({ name: editingUser!.name, email: editingUser!.email, newPassword: '' });
    setEditStep(2);
  }

  async function onStep2Submit(data: EditUserFormData) {
    setEditServerError('');
    try {
      await updateUser.mutateAsync({
        id: editingUser!.id,
        data: {
          name: data.name,
          email: data.email,
          currentPassword: verifiedCurrentPassword,
          newPassword: data.newPassword || undefined,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setEditServerError(err.response?.data?.error ?? 'Failed to update user');
      } else {
        setEditServerError('Failed to update user');
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
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{u.role}</span>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>Edit</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Add User Modal */}
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

      {/* Edit User — Step 1: Verify current password */}
      {editingUser && editStep === 1 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="mb-1 text-lg font-semibold">Edit User</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter the current password for <span className="font-medium">{editingUser.name}</span>
            </p>
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-current-password">Current Password</Label>
                <Input
                  id="edit-current-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!step1Form.formState.errors.currentPassword}
                  {...step1Form.register('currentPassword')}
                />
                {step1Form.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{step1Form.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button type="submit">Next</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User — Step 2: Edit fields */}
      {editingUser && editStep === 2 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Edit User</h2>
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Jane Doe"
                  aria-invalid={!!step2Form.formState.errors.name}
                  {...step2Form.register('name')}
                />
                {step2Form.formState.errors.name && (
                  <p className="text-xs text-destructive">{step2Form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="off"
                  aria-invalid={!!step2Form.formState.errors.email}
                  {...step2Form.register('email')}
                />
                {step2Form.formState.errors.email && (
                  <p className="text-xs text-destructive">{step2Form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-new-password">
                  New Password <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="edit-new-password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  autoComplete="new-password"
                  aria-invalid={!!step2Form.formState.errors.newPassword}
                  {...step2Form.register('newPassword')}
                />
                {step2Form.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{step2Form.formState.errors.newPassword.message}</p>
                )}
              </div>

              {editServerError && <p className="text-sm text-destructive">{editServerError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeEditModal} disabled={step2Form.formState.isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={step2Form.formState.isSubmitting}>
                  {step2Form.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

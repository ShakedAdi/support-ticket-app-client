import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { session, isPending } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (!isPending && session) {
    return <Navigate to="/home" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setServerError("");
    const { error } = await authClient.signIn.email(data);
    if (error) {
      setServerError(error.message ?? "Invalid credentials");
      return;
    }
    navigate("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-card-foreground">Ticket AI</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} onChange={() => setServerError("")} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-card-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className={`rounded-md border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-ring ${errors.email ? "border-destructive" : "border-border"}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-card-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className={`rounded-md border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-ring ${errors.password ? "border-destructive" : "border-border"}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

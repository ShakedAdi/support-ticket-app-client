---
name: Playwright E2E project conventions
description: Auth setup, selector patterns, POM structure, and test data strategy for this support-ticket-app E2E suite
type: project
---

Auth is cookie-based (better-auth). Login is done by navigating to /login, filling `getByLabel('Email')` and `getByLabel('Password')`, clicking `getByRole('button', { name: /sign in/i })`, and asserting `toHaveURL('/home')`. There is a shared `loginAsAdmin` helper in auth.spec.ts and users.spec.ts.

**Why:** Session is not stored in localStorage; the browser cookie jar is populated on sign-in and inherited by `page.request` calls made after login.

**How to apply:** Always call `loginAsAdmin(page)` before navigating to protected routes. `page.request` inherits the same cookie jar — use it for API setup/teardown without separate auth.

Admin seed credentials: `admin@example.com` / `adminpassword1234` (from server/.env.test).

Test data strategy: Use timestamp-based unique emails (`test-<tag>-<Date.now()>@example.com`) to avoid conflicts. Create via API in `beforeEach` or inside tests; clean up via `DELETE /api/users/:id` after each test.

Non-admin session is simulated by intercepting `**/api/auth/get-session` with `page.route()` returning a mock agent session (no real non-admin DB user exists).

Skeleton loading state uses `[class*="animate-pulse"]` — wait for count 0 before asserting list contents.

Modal backdrop selector: `.fixed.inset-0` — click at position `{ x: 5, y: 5 }` to simulate clicking outside.

Field validation errors: `p.text-destructive` (xs variant for field errors, sm variant for server errors).

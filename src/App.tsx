import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

type HealthStatus = 'loading' | 'ok' | 'error';

function App() {
  const [health, setHealth] = useState<HealthStatus>('loading');

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setHealth('error'));
  }, []);

  const statusMessage = {
    loading: 'Connecting to server…',
    ok: 'Server is online',
    error: 'Could not reach server',
  }[health];

  const statusColor = {
    loading: 'text-muted-foreground',
    ok: 'text-green-600',
    error: 'text-destructive',
  }[health];

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm">
              <h1 className="mb-2 text-2xl font-semibold">Ticket AI</h1>
              <p className="text-sm text-muted-foreground">Login page — coming soon</p>
              <p className={`mt-4 text-sm font-medium ${statusColor}`}>{statusMessage}</p>
            </div>
          </div>
        }
      />
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <p className="text-muted-foreground">404 — Page not found</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;

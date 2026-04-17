import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-background">
              <p className="text-muted-foreground">404 — Page not found</p>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;

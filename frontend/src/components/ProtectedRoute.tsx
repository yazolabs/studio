import { Navigate } from 'react-router-dom';
import { useAuthUser } from '@/hooks/useAuthUser';
import { usePermission } from '@/hooks/usePermission';
import { Screen } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  screen?: Screen;
}

export function ProtectedRoute({ children, screen }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthUser();
  const { canAccess } = usePermission();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (screen && !canAccess(screen)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

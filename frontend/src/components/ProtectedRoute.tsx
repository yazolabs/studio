import { Navigate } from 'react-router-dom';
import { useAuthUser } from '@/hooks/useAuthUser';
import { usePermission } from '@/hooks/usePermission';
import { Screen } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  screen?: Screen;
}

export function ProtectedRoute({ children, screen }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthUser();
  const { canAccess } = usePermission();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (screen && !canAccess(screen)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

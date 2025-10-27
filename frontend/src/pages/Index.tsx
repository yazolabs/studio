import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '@/hooks/useAuthUser';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthUser();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.jpeg';

const loginSchema = z.object({
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    const result = login(data.username, data.password);
    
    if (result.success) {
      toast({
        title: 'Login realizado',
        description: `Bem-vindo, ${result.user?.name}!`,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Erro ao fazer login',
        description: result.error || 'Credenciais inválidas',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-primary">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex items-center justify-center">
            <img 
              src={logo} 
              alt="Studio Unhas Delicadas" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Digite seu username"
                {...register('username')}
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2">Credenciais de teste:</p>
              <p>Admin: <code className="bg-background px-2 py-1 rounded">admin / admin123</code></p>
              <p>Manager: <code className="bg-background px-2 py-1 rounded">manager / manager123</code></p>
              <p>Professional: <code className="bg-background px-2 py-1 rounded">professional / professional123</code></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

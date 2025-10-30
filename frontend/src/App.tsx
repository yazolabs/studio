// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import { useAuthUser } from "@/hooks/useAuthUser";
import { PermissionsProvider } from "@/contexts/permissionsContext"; // Importando o PermissionsProvider

// Função para redirecionar o usuário autenticado para a tela principal
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthUser();

  if (isLoading) return null; // Retorna null enquanto o status de autenticação está sendo carregado
  if (isAuthenticated) return <Navigate to="/dashboard" replace />; // Redireciona se já estiver autenticado
  return <>{children}</>; // Exibe as rotas de login caso não esteja autenticado
}

// Carregamento das páginas de forma assíncrona
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Users = lazy(() => import("./pages/Users"));
const Services = lazy(() => import("./pages/Services"));
const Professionals = lazy(() => import("./pages/Professionals"));
const Items = lazy(() => import("./pages/Items"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Cashier = lazy(() => import("./pages/Cashier"));
const ItemPrices = lazy(() => import("./pages/ItemPrices"));
const ItemPriceHistories = lazy(() => import("./pages/ItemPriceHistories"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const AccountsPayable = lazy(() => import("./pages/AccountsPayable"));
const Commissions = lazy(() => import("./pages/Commissions"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Instância do QueryClient para gerenciamento do estado da consulta
const queryClient = new QueryClient();

// Componente de fallback enquanto as páginas estão sendo carregadas
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PermissionsProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <AuthRedirect>
                    <Navigate to="/login" replace />
                  </AuthRedirect>
                }
              />

              <Route
                path="/login"
                element={
                  <AuthRedirect>
                    <Login />
                  </AuthRedirect>
                }
              />

              <Route
                element={
                  <ProtectedRoute>
                    <SidebarLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/users" element={<Users />} />
                <Route path="/services" element={<Services />} />
                <Route path="/professionals" element={<Professionals />} />
                <Route path="/items" element={<Items />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/cashier" element={<Cashier />} />
                <Route path="/item-prices" element={<ItemPrices />} />
                <Route path="/item-price-histories" element={<ItemPriceHistories />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/accounts-payable" element={<AccountsPayable />} />
                <Route path="/commissions" element={<Commissions />} />
              </Route>

              {/* Rota de NotFound para páginas não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PermissionsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

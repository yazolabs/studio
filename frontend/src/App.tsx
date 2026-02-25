import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import { PermissionsProvider } from "@/contexts/permissionsContext";
import { AuthProvider, useAuth } from "@/contexts/authContext";

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

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
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

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

      <AuthProvider>
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
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute screen="dashboard">
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/appointments"
                    element={
                      <ProtectedRoute screen="appointments">
                        <Appointments />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute screen="customers">
                        <Customers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/services"
                    element={
                      <ProtectedRoute screen="services">
                        <Services />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/items"
                    element={
                      <ProtectedRoute screen="items">
                        <Items />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/promotions"
                    element={
                      <ProtectedRoute screen="promotions">
                        <Promotions />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/commissions"
                    element={
                      <ProtectedRoute screen="commissions">
                        <Commissions />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/cashier"
                    element={
                      <ProtectedRoute screen="cashier">
                        <Cashier />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/item-prices"
                    element={
                      <ProtectedRoute screen="item-prices">
                        <ItemPrices />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/item-price-histories"
                    element={
                      <ProtectedRoute screen="item-price-histories">
                        <ItemPriceHistories />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/suppliers"
                    element={
                      <ProtectedRoute screen="suppliers">
                        <Suppliers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/accounts-payable"
                    element={
                      <ProtectedRoute screen="accounts-payable">
                        <AccountsPayable />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/professionals"
                    element={
                      <ProtectedRoute screen="professionals">
                        <Professionals />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute screen="users">
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PermissionsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";

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
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute screen="dashboard">
                  <SidebarLayout>
                    <Dashboard />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute screen="customers">
                  <SidebarLayout>
                    <Customers />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute screen="users">
                  <SidebarLayout>
                    <Users />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute screen="services">
                  <SidebarLayout>
                    <Services />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/professionals"
              element={
                <ProtectedRoute screen="professionals">
                  <SidebarLayout>
                    <Professionals />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/items"
              element={
                <ProtectedRoute screen="items">
                  <SidebarLayout>
                    <Items />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute screen="appointments">
                  <SidebarLayout>
                    <Appointments />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier"
              element={
                <ProtectedRoute screen="cashier">
                  <SidebarLayout>
                    <Cashier />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/item-prices"
              element={
                <ProtectedRoute screen="item-prices">
                  <SidebarLayout>
                    <ItemPrices />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/item-price-histories"
              element={
                <ProtectedRoute screen="item-price-histories">
                  <SidebarLayout>
                    <ItemPriceHistories />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/promotions"
              element={
                <ProtectedRoute screen="promotions">
                  <SidebarLayout>
                    <Promotions />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute screen="suppliers">
                  <SidebarLayout>
                    <Suppliers />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts-payable"
              element={
                <ProtectedRoute screen="accounts-payable">
                  <SidebarLayout>
                    <AccountsPayable />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/commissions"
              element={
                <ProtectedRoute screen="commissions">
                  <SidebarLayout>
                    <Commissions />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

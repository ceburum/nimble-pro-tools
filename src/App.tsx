import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import MileagePro from "./pages/MileagePro";
import SchedulingPro from "./pages/SchedulingPro";
import TaxPro from "./pages/TaxPro";
import PayInvoice from "./pages/PayInvoice";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/pay/:paymentToken" element={<PayInvoice />} />
              
              {/* Protected admin routes with AppLayout */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Index /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Clients /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Projects /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoices" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Invoices /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Reports /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/mileage" 
                element={
                  <ProtectedRoute>
                    <AppLayout><MileagePro /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/scheduling" 
                element={
                  <ProtectedRoute>
                    <AppLayout><SchedulingPro /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/tax-pro" 
                element={
                  <ProtectedRoute>
                    <AppLayout><TaxPro /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route path="/quotes" element={<Navigate to="/projects" replace />} />
              <Route path="/jobs" element={<Navigate to="/projects" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

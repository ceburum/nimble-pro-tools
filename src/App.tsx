import { useState, useEffect } from "react";
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
import Financials from "./pages/Financials";
import MileagePro from "./pages/MileagePro";
import SchedulingPro from "./pages/SchedulingPro";
import Appointments from "./pages/Appointments";
import TaxPro from "./pages/TaxPro";
import ServiceMenu from "./pages/ServiceMenu";
import Notepad from "./pages/Notepad";
import PayInvoice from "./pages/PayInvoice";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Affiliates from "./pages/Affiliates";
import AffiliateAdmin from "./pages/AffiliateAdmin";
import Upgrade from "./pages/Upgrade";
import { useReferralTracking } from "@/hooks/useReferralTracking";

// Component to track referral codes from URL
function ReferralTracker() {
  useReferralTracking();
  return null;
}

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ReferralTracker />
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/pay/:paymentToken" element={<PayInvoice />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              
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
                path="/financials" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Financials /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upgrade" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Upgrade /></AppLayout>
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
                path="/appointments" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Appointments /></AppLayout>
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
              <Route
                path="/services" 
                element={
                  <ProtectedRoute>
                    <AppLayout><ServiceMenu /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/notepad" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Notepad /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/affiliates" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Affiliates /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/affiliate-admin" 
                element={
                  <ProtectedRoute>
                    <AppLayout><AffiliateAdmin /></AppLayout>
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

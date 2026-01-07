import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Invoices from "./pages/Invoices";
import PayInvoice from "./pages/PayInvoice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public payment page - no AppLayout */}
          <Route path="/pay/:invoiceId" element={<PayInvoice />} />
          
          {/* Admin routes with AppLayout */}
          <Route element={<AppLayout><Index /></AppLayout>} path="/" />
          <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
          <Route path="/projects" element={<AppLayout><Projects /></AppLayout>} />
          <Route path="/invoices" element={<AppLayout><Invoices /></AppLayout>} />
          <Route path="/quotes" element={<Navigate to="/projects" replace />} />
          <Route path="/jobs" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

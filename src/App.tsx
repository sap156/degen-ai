
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import SyntheticData from "./pages/SyntheticData";
import DataAugmentation from "./pages/DataAugmentation";
import TimeSeries from "./pages/TimeSeries";
import PiiHandling from "./pages/PiiHandling";
import ImbalancedData from "./pages/ImbalancedData";
import DataParsing from "./pages/DataParsing";
import DataExtraction from "./pages/DataExtraction";
import EdgeCases from "./pages/EdgeCases";
import DataQuery from "./pages/DataQuery";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ApiKeyProvider } from "./contexts/ApiKeyContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ApiKeyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                {/* Public route - accessible without login */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes - require authentication */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/synthetic-data" element={<SyntheticData />} />
                  <Route path="/data-augmentation" element={<DataAugmentation />} />
                  <Route path="/time-series" element={<TimeSeries />} />
                  <Route path="/pii-handling" element={<PiiHandling />} />
                  <Route path="/imbalanced-data" element={<ImbalancedData />} />
                  <Route path="/data-parsing" element={<DataParsing />} />
                  <Route path="/extraction" element={<DataExtraction />} />
                  <Route path="/edge-cases" element={<EdgeCases />} />
                  <Route path="/data-query" element={<DataQuery />} />
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ApiKeyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

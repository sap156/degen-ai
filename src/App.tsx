
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout />}>
                {/* Dashboard is accessible to everyone */}
                <Route index element={<Index />} />
                
                {/* Protected routes requiring authentication */}
                <Route path="synthetic-data" element={
                  <ProtectedRoute>
                    <SyntheticData />
                  </ProtectedRoute>
                } />
                <Route path="data-augmentation" element={
                  <ProtectedRoute>
                    <DataAugmentation />
                  </ProtectedRoute>
                } />
                <Route path="time-series" element={
                  <ProtectedRoute>
                    <TimeSeries />
                  </ProtectedRoute>
                } />
                <Route path="pii-handling" element={
                  <ProtectedRoute>
                    <PiiHandling />
                  </ProtectedRoute>
                } />
                <Route path="imbalanced-data" element={
                  <ProtectedRoute>
                    <ImbalancedData />
                  </ProtectedRoute>
                } />
                <Route path="data-parsing" element={
                  <ProtectedRoute>
                    <DataParsing />
                  </ProtectedRoute>
                } />
                <Route path="extraction" element={
                  <ProtectedRoute>
                    <DataExtraction />
                  </ProtectedRoute>
                } />
                <Route path="edge-cases" element={
                  <ProtectedRoute>
                    <EdgeCases />
                  </ProtectedRoute>
                } />
                <Route path="data-query" element={
                  <ProtectedRoute>
                    <DataQuery />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ApiKeyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

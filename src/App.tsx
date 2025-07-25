
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ApiKeys from "./pages/ApiKeys";
import NotFound from "./pages/NotFound";
import { ApiKeyProvider } from "./contexts/ApiKeyContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./hooks/useAuth";

// Create a new QueryClient instance with specific settings for databases
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (replaced cacheTime with gcTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ApiKeyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/synthetic-data" element={<SyntheticData />} />
                  <Route path="/data-augmentation" element={<DataAugmentation />} />
                  <Route path="/time-series" element={<TimeSeries />} />
                  <Route path="/pii-handling" element={<PiiHandling />} />
                  <Route path="/imbalanced-data" element={<ImbalancedData />} />
                  <Route path="/data-parsing" element={<DataParsing />} />
                  <Route path="/extraction" element={<DataExtraction />} />
                  <Route path="/edge-cases" element={<EdgeCases />} />
                  <Route path="/data-query" element={<DataQuery />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </TooltipProvider>
          </ApiKeyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/synthetic-data" element={<SyntheticData />} />
            <Route path="/data-augmentation" element={<DataAugmentation />} />
            <Route path="/time-series" element={<TimeSeries />} />
            <Route path="/pii-handling" element={<PiiHandling />} />
            <Route path="/imbalanced-data" element={<ImbalancedData />} />
            {/* Add other routes here as they get implemented */}
            <Route path="/data-parsing" element={<NotFound />} />
            <Route path="/extraction" element={<NotFound />} />
            <Route path="/entity-recognition" element={<NotFound />} />
            <Route path="/data-query" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

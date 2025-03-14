
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import SyntheticData from "./pages/SyntheticData";
import DataAugmentation from "./pages/DataAugmentation";
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
            {/* Add other routes here as they get implemented */}
            <Route path="/time-series" element={<NotFound />} />
            <Route path="/pii-handling" element={<NotFound />} />
            <Route path="/imbalanced-data" element={<NotFound />} />
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExitIntentModal } from "@/components/ExitIntentModal";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ExitIntentModal />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cursos" element={<Courses />} />
          <Route path="/curso/:id" element={<CourseDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy load all page components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Explorer = lazy(() => import("./pages/Explorer"));
const Missions = lazy(() => import("./pages/Missions"));
const MissionDetail = lazy(() => import("./pages/MissionDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicStudentProfile = lazy(() => import("./pages/PublicStudentProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ClientMissions = lazy(() => import("./pages/ClientMissions"));
const PaymentDashboard = lazy(() => import("./pages/PaymentDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile/:id" element={<PublicStudentProfile />} />
            <Route path="/students/:id" element={<PublicStudentProfile />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/missions" element={<Missions />} />
            <Route
              path="/my-missions"
              element={
                <ProtectedRoute>
                  <ClientMissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/missions/:id" element={<MissionDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ThemeProvider>
);

export default App;

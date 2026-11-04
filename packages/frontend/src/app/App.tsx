import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { CompanyProvider } from "@/contexts/company-context";
import { Layout } from "@/components/layout";
import { ChatProvider } from "@/contexts/chat-context";
import { Index } from "@/pages/index";
import { Dashboard } from "@/pages/dashboard";
import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import { Settings } from "@/pages/settings";
import { Chat } from "@/pages/chat";
import { Agents } from "@/pages/agents";
import { Tasks } from "@/pages/tasks";
import { Finance } from "@/pages/finance";
import { Fleet } from "@/pages/fleet";
import { Evidence } from "@/pages/evidence";
import { Wiki } from "@/pages/wiki";
import { NotFound } from "@/pages/not-found";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandMenu } from "@/components/command-menu";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function BottomNavGuard() {
  const location = useLocation();
  const hide = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/chat");
  if (hide) return null;
  return <BottomNavigation />;
}

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <ChatProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <ScrollToTop />
                  <CommandMenu />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route element={<Layout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/agents" element={<Agents />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/fleet" element={<Fleet />} />
                      <Route path="/evidence" element={<Evidence />} />
                      <Route path="/wiki" element={<Wiki />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <BottomNavGuard />
                  <Toaster />
                </ErrorBoundary>
              </BrowserRouter>
            </ChatProvider>
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
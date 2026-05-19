import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import ResetPassword from "@/pages/reset-password";
import Privacy from "@/pages/privacy";
import Home from "./pages/home";
import Members from "./pages/members";
import MemberDetail from "./pages/member-detail";
import Connections from "./pages/connections";
import Notifications from "./pages/notifications";
import Profile from "./pages/profile";
import Recipes from "./pages/recipes";
import Layout from "./components/layout";

const queryClient = new QueryClient();

function Router() {
  const { userId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const path = window.location.pathname;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path === `${base}/privacy` || path === `${base}/privacy/`) {
    return <Privacy />;
  }

  if (!userId) {
    if (path === `${base}/reset-password` || path.startsWith(`${base}/reset-password?`)) {
      return <ResetPassword />;
    }
    return <Welcome />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/members" component={Members} />
        <Route path="/members/:id" component={MemberDetail} />
        <Route path="/connections" component={Connections} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="dark bg-background text-foreground min-h-screen">
              <Router />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

// ============================================================
// UniAgenda — App Root
// Design: Fresh Academic (Contemporary Academic)
// Routes + Providers + Auth guard
// ============================================================

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import Layout from "./components/Layout";
import PWAInstallBanner from "./components/PWAInstallBanner";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DisciplinasPage from "./pages/Disciplinas";
import HorariosPage from "./pages/Horarios";
import TarefasPage from "./pages/Tarefas";
import EventosPage from "./pages/Eventos";
import AnotacoesPage from "./pages/Anotacoes";
import ConfiguracoesPage from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

// ============================================================
// Auth-guarded app
// ============================================================
function AppContent() {
  const { user, isConfigured } = useAuth();
  console.log('[AppContent] Render:', { user: !!user, isConfigured });

  // Not authenticated — show login
  if (!user && isConfigured) {
    return <Login />;
  }

  // Demo mode (no Supabase configured) — allow access
  // or authenticated — show app
  return (
    <DataProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/disciplinas" component={DisciplinasPage} />
          <Route path="/horarios" component={HorariosPage} />
          <Route path="/tarefas" component={TarefasPage} />
          <Route path="/eventos" component={EventosPage} />
          <Route path="/anotacoes" component={AnotacoesPage} />
          <Route path="/configuracoes" component={ConfiguracoesPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <PWAInstallBanner />
    </DataProvider>
  );
}

// ============================================================
// Root App
// ============================================================
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

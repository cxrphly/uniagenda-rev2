// ============================================================
// UniAgenda — Main Layout
// Design: Fresh Academic — sidebar escura #1E293B + área clara #F8FAFC
// Sidebar fixa desktop, bottom nav mobile
// ============================================================

import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, BookOpen, Clock, CheckSquare, Calendar,
  FileText, Settings, Menu, X, Wifi, WifiOff,
  RefreshCw, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/disciplinas', label: 'Disciplinas', icon: BookOpen },
  { path: '/horarios', label: 'Horários', icon: Clock },
  { path: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { path: '/eventos', label: 'Eventos', icon: Calendar },
  { path: '/anotacoes', label: 'Anotações', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile } = useAuth();
  const { syncState, tarefas, forceSync } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const pendingTarefas = tarefas.filter(t => t.status !== 'concluida').length;

  const handleSync = async () => {
    setSyncing(true);
    await forceSync();
    setTimeout(() => setSyncing(false), 1000);
  };

  const SyncIcon = () => {
    if (syncState.status === 'offline') return <WifiOff size={14} className="text-amber-400" />;
    if (syncState.status === 'syncing' || syncing) return <RefreshCw size={14} className="text-indigo-400 animate-spin" />;
    if (syncState.status === 'error') return <WifiOff size={14} className="text-red-400" />;
    return <Wifi size={14} className="text-emerald-400" />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base leading-tight">UniAgenda</h1>
            <p className="text-slate-400 text-xs truncate">
              {profile?.nome || profile?.email || 'Estudante'}
            </p>
          </div>
          <button
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
                {label}
                {label === 'Tarefas' && pendingTarefas > 0 && (
                  <Badge className="ml-auto bg-amber-500 text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                    {pendingTarefas}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: sync status + settings */}
        <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
          {/* Sync status */}
          <button
            onClick={handleSync}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <SyncIcon />
            <span className="truncate">
              {syncState.status === 'syncing' ? 'Sincronizando...' :
               syncState.status === 'offline' ? 'Sem conexão' :
               syncState.status === 'error' ? 'Erro de sync' :
               syncState.lastSync ? `Sync: ${format(new Date(syncState.lastSync), 'HH:mm', { locale: ptBR })}` :
               'Não sincronizado'}
            </span>
            {syncState.pendingCount > 0 && (
              <Badge className="ml-auto bg-amber-500/20 text-amber-400 text-xs border-0 px-1.5">
                {syncState.pendingCount}
              </Badge>
            )}
          </button>

          <Link
            href="/configuracoes"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              location === '/configuracoes'
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={18} />
            Configurações
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button
            className="text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">UniAgenda</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SyncIcon />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="lg:hidden flex items-center bg-white border-t border-slate-200 flex-shrink-0 safe-bottom">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-500"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}
          <Link
            href="/configuracoes"
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
              location === '/configuracoes' ? "text-indigo-600" : "text-slate-500"
            )}
          >
            <Settings size={20} />
            <span className="text-[10px]">Config</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

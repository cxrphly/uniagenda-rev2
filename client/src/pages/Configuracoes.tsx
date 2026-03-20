// ============================================================
// UniAgenda — Configurações Page
// Design: Fresh Academic — settings com seções organizadas
// ============================================================

import React, { useState, useRef } from 'react';
import {
  Bell, BellOff, Download, Upload, RefreshCw,
  LogOut, Wifi, WifiOff, User, Shield, Database, Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  showNotification
} from '@/lib/notifications';
import type { ExportData } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ConfiguracoesPage() {
  const { user, profile, signOut, updateProfile, isConfigured } = useAuth();
  const {
    disciplinas, horarios, anotacoes, tarefas, eventos,
    syncState, forceSync,
    addDisciplina, addHorario, addAnotacao, addTarefa, addEvento
  } = useData();

  const [syncing, setSyncing] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifPermission = getNotificationPermission();
  const notifSupported = isNotificationSupported();

  // ============================================================
  // Export
  // ============================================================
  const handleExport = () => {
    if (!profile) return;

    const data: ExportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_email: profile.email,
      disciplinas,
      horarios,
      anotacoes,
      tarefas,
      eventos,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uniagenda-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  // ============================================================
  // Import
  // ============================================================
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.version || !data.disciplinas) {
        toast.error('Arquivo inválido. Use um backup exportado pelo UniAgenda.');
        return;
      }

      let count = 0;

      for (const d of (data.disciplinas || [])) {
        try {
          const { id, user_id, created_at, updated_at, sync_status, ...rest } = d;
          await addDisciplina(rest);
          count++;
        } catch {}
      }

      for (const h of (data.horarios || [])) {
        try {
          const { id, user_id, created_at, updated_at, sync_status, ...rest } = h;
          await addHorario(rest);
        } catch {}
      }

      for (const a of (data.anotacoes || [])) {
        try {
          const { id, user_id, created_at, updated_at, sync_status, ...rest } = a;
          await addAnotacao(rest);
        } catch {}
      }

      for (const t of (data.tarefas || [])) {
        try {
          const { id, user_id, created_at, updated_at, sync_status, ...rest } = t;
          await addTarefa(rest);
        } catch {}
      }

      for (const ev of (data.eventos || [])) {
        try {
          const { id, user_id, created_at, updated_at, sync_status, ...rest } = ev;
          await addEvento(rest);
        } catch {}
      }

      toast.success(`Importação concluída! ${count} disciplinas importadas.`);
    } catch {
      toast.error('Erro ao importar arquivo. Verifique se é um backup válido.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ============================================================
  // Notifications
  // ============================================================
  const handleToggleNotifications = async () => {
    if (!notifSupported) {
      toast.error('Notificações não suportadas neste dispositivo');
      return;
    }
    if (notifPermission === 'denied') {
      toast.error('Notificações bloqueadas. Habilite nas configurações do navegador.');
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      await updateProfile({ notificacoes_ativas: true });
      showNotification('UniAgenda', { body: 'Notificações ativadas com sucesso! 🎓' });
      toast.success('Notificações ativadas!');
    } else {
      toast.error('Permissão negada');
    }
  };

  const handleDisableNotifications = async () => {
    await updateProfile({ notificacoes_ativas: false });
    toast.success('Notificações desativadas');
  };

  // ============================================================
  // Force Sync
  // ============================================================
  const handleForceSync = async () => {
    if (!isConfigured) {
      toast.error('Supabase não configurado. Adicione as variáveis de ambiente.');
      return;
    }
    setSyncing(true);
    try {
      await forceSync();
      toast.success('Sincronização concluída!');
    } catch {
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const totalItems = disciplinas.length + horarios.length + anotacoes.length + tarefas.length + eventos.length;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Perfil" color="#6366F1">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {(profile?.nome || profile?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{profile?.nome || 'Sem nome'}</p>
            <p className="text-sm text-slate-500 truncate">{profile?.email || 'Modo offline'}</p>
          </div>
        </div>
      </Section>

      {/* Sync status */}
      <Section icon={Database} title="Sincronização" color="#10B981">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              {syncState.status === 'offline' ? (
                <WifiOff size={18} className="text-amber-500" />
              ) : syncState.status === 'syncing' ? (
                <RefreshCw size={18} className="text-indigo-500 animate-spin" />
              ) : syncState.status === 'error' ? (
                <WifiOff size={18} className="text-red-500" />
              ) : (
                <Wifi size={18} className="text-emerald-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {syncState.status === 'offline' ? 'Sem conexão' :
                   syncState.status === 'syncing' ? 'Sincronizando...' :
                   syncState.status === 'error' ? 'Erro de sincronização' :
                   'Sincronizado'}
                </p>
                {syncState.lastSync && (
                  <p className="text-xs text-slate-500">
                    Última sync: {format(new Date(syncState.lastSync), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                {syncState.pendingCount > 0 && (
                  <p className="text-xs text-amber-600">{syncState.pendingCount} item(s) pendente(s)</p>
                )}
              </div>
            </div>
          </div>

          {!isConfigured && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <span>Configure <code className="font-mono text-xs bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="font-mono text-xs bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> para habilitar a sincronização na nuvem.</span>
            </div>
          )}

          <Button
            onClick={handleForceSync}
            disabled={syncing || !isConfigured || syncState.status === 'offline'}
            variant="outline"
            className="w-full gap-2"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Forçar sincronização'}
          </Button>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notificações" color="#F59E0B">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              {notifPermission === 'granted' ? (
                <Bell size={18} className="text-emerald-500" />
              ) : (
                <BellOff size={18} className="text-slate-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {notifPermission === 'granted' ? 'Notificações ativas' :
                   notifPermission === 'denied' ? 'Notificações bloqueadas' :
                   notifPermission === 'unsupported' ? 'Não suportado' :
                   'Notificações desativadas'}
                </p>
                <p className="text-xs text-slate-500">
                  {notifPermission === 'denied'
                    ? 'Habilite nas configurações do navegador'
                    : 'Lembretes de tarefas e eventos'}
                </p>
              </div>
            </div>
            {notifPermission !== 'unsupported' && notifPermission !== 'denied' && (
              <Switch
                checked={notifPermission === 'granted' && (profile?.notificacoes_ativas ?? true)}
                onCheckedChange={v => v ? handleToggleNotifications() : handleDisableNotifications()}
              />
            )}
          </div>
          {notifPermission === 'denied' && (
            <p className="text-xs text-slate-500 px-1">
              Para reativar, acesse as configurações do seu navegador e permita notificações para este site.
            </p>
          )}
        </div>
      </Section>

      {/* Data management */}
      <Section icon={Database} title="Dados" color="#8B5CF6">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700">Total de registros</p>
              <p className="text-xs text-slate-500">
                {disciplinas.length} disciplinas · {tarefas.length} tarefas · {eventos.length} eventos · {anotacoes.length} notas
              </p>
            </div>
            <span className="text-2xl font-bold text-indigo-600">{totalItems}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2 h-auto py-3 flex-col items-center"
            >
              <Download size={20} className="text-indigo-500" />
              <div className="text-center">
                <p className="text-xs font-semibold">Exportar</p>
                <p className="text-xs text-slate-500">Backup JSON</p>
              </div>
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={importing}
              className="gap-2 h-auto py-3 flex-col items-center"
            >
              <Upload size={20} className="text-emerald-500" />
              <div className="text-center">
                <p className="text-xs font-semibold">{importing ? 'Importando...' : 'Importar'}</p>
                <p className="text-xs text-slate-500">Restaurar backup</p>
              </div>
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          <p className="text-xs text-slate-400 px-1">
            O backup exportado contém todos os seus dados e pode ser usado para restaurar ou migrar para outra conta.
          </p>
        </div>
      </Section>

      {/* Account */}
      <Section icon={Shield} title="Conta" color="#EF4444">
        <Button
          onClick={() => setLogoutDialog(true)}
          variant="outline"
          className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut size={16} />
          Sair da conta
        </Button>
      </Section>

      {/* App info */}
      <div className="text-center text-xs text-slate-400 pb-4">
        <p className="font-semibold">UniAgenda v1.0</p>
        <p className="mt-0.5">Offline-first · PWA · Supabase Sync</p>
      </div>

      {/* Logout dialog */}
      <AlertDialog open={logoutDialog} onOpenChange={setLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Seus dados locais serão removidos deste dispositivo. Os dados na nuvem permanecem seguros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { await signOut(); setLogoutDialog(false); }}
              className="bg-red-500 hover:bg-red-600"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Section component
// ============================================================
function Section({
  icon: Icon, title, color, children
}: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

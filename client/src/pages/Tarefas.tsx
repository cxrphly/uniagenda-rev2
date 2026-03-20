// ============================================================
// UniAgenda — Tarefas Page
// Design: Fresh Academic — kanban-style com prioridades coloridas
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Plus, CheckSquare, Clock, AlertTriangle, Flag, Pencil, Trash2,
  Check, Circle, ChevronDown, Bell, BellOff, Filter
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { DisciplinaChip } from '@/components/ColorPicker';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tarefa, PrioridadeTarefa, StatusTarefa } from '@/lib/types';
import { cn } from '@/lib/utils';
import { scheduleTaskReminder } from '@/lib/notifications';

const PRIORIDADE_CONFIG = {
  baixa: { label: 'Baixa', color: '#10B981', bg: '#10B98120', border: '#10B98140' },
  media: { label: 'Média', color: '#F59E0B', bg: '#F59E0B20', border: '#F59E0B40' },
  alta: { label: 'Alta', color: '#EF4444', bg: '#EF444420', border: '#EF444440' },
  urgente: { label: 'Urgente', color: '#7C3AED', bg: '#7C3AED20', border: '#7C3AED40' },
};

const EMPTY_FORM = {
  titulo: '', descricao: '', prioridade: 'media' as PrioridadeTarefa,
  status: 'pendente' as StatusTarefa, disciplina_id: '',
  prazo: '', lembrete: false, lembrete_minutos: 30,
};

export default function TarefasPage() {
  const { tarefas, disciplinas, addTarefa, updateTarefa, deleteTarefa } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'todas' | StatusTarefa>('todas');
  const [filterPrioridade, setFilterPrioridade] = useState<'todas' | PrioridadeTarefa>('todas');

  const filtered = useMemo(() => {
    return tarefas
      .filter(t => filterStatus === 'todas' || t.status === filterStatus)
      .filter(t => filterPrioridade === 'todas' || t.prioridade === filterPrioridade)
      .sort((a, b) => {
        const pOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 };
        return pOrder[a.prioridade] - pOrder[b.prioridade];
      });
  }, [tarefas, filterStatus, filterPrioridade]);

  const stats = useMemo(() => ({
    total: tarefas.length,
    pendentes: tarefas.filter(t => t.status === 'pendente').length,
    em_andamento: tarefas.filter(t => t.status === 'em_andamento').length,
    concluidas: tarefas.filter(t => t.status === 'concluida').length,
  }), [tarefas]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (t: Tarefa) => {
    setEditing(t);
    setForm({
      titulo: t.titulo, descricao: t.descricao || '',
      prioridade: t.prioridade, status: t.status,
      disciplina_id: t.disciplina_id || '',
      prazo: t.prazo ? t.prazo.slice(0, 16) : '',
      lembrete: t.lembrete, lembrete_minutos: t.lembrete_minutos || 30,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error('Informe o título da tarefa'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        disciplina_id: form.disciplina_id || null,
        prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
      };
      if (editing) {
        await updateTarefa(editing.id, data);
        toast.success('Tarefa atualizada!');
      } else {
        const t = await addTarefa(data);
        if (t.lembrete && t.prazo) scheduleTaskReminder(t);
        toast.success('Tarefa adicionada!');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar tarefa');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (t: Tarefa) => {
    const next: StatusTarefa = t.status === 'concluida' ? 'pendente' : 'concluida';
    await updateTarefa(t.id, { status: next });
  };

  const formatPrazo = (prazo: string) => {
    const d = new Date(prazo);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tarefas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{stats.pendentes} pendente{stats.pendentes !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus size={16} /> Nova tarefa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700' },
          { label: 'Pendentes', value: stats.pendentes, color: 'text-amber-600' },
          { label: 'Em andamento', value: stats.em_andamento, color: 'text-blue-600' },
          { label: 'Concluídas', value: stats.concluidas, color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(['todas', 'pendente', 'em_andamento', 'concluida'] as const).map(s => (
            <button
              key={s}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'todas' ? 'Todas' : s === 'pendente' ? 'Pendentes' : s === 'em_andamento' ? 'Em andamento' : 'Concluídas'}
            </button>
          ))}
        </div>

        <Select value={filterPrioridade} onValueChange={v => setFilterPrioridade(v as any)}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas prioridades</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <CheckSquare size={28} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-1">Nenhuma tarefa</h3>
          <p className="text-slate-500 text-sm mb-4">
            {filterStatus !== 'todas' || filterPrioridade !== 'todas'
              ? 'Nenhuma tarefa com esses filtros'
              : 'Adicione suas tarefas para começar'}
          </p>
          <Button onClick={openAdd} variant="outline" className="gap-2">
            <Plus size={16} /> Adicionar tarefa
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const pConfig = PRIORIDADE_CONFIG[t.prioridade];
            const disciplina = disciplinas.find(d => d.id === t.disciplina_id);
            const concluida = t.status === 'concluida';
            const atrasada = t.prazo && isPast(new Date(t.prazo)) && !concluida;

            return (
              <div
                key={t.id}
                className={cn(
                  "bg-white rounded-xl border transition-all",
                  concluida ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Checkbox */}
                  <button
                    className={cn(
                      "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      concluida
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 hover:border-indigo-500"
                    )}
                    onClick={() => toggleStatus(t)}
                  >
                    {concluida && <Check size={11} className="text-white" strokeWidth={3} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "font-medium text-sm",
                        concluida ? "line-through text-slate-400" : "text-slate-900"
                      )}>
                        {t.titulo}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {t.descricao && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.descricao}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Priority badge */}
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: pConfig.bg, color: pConfig.color, border: `1px solid ${pConfig.border}` }}
                      >
                        {pConfig.label}
                      </span>

                      {/* Disciplina */}
                      {disciplina && (
                        <DisciplinaChip nome={disciplina.nome} cor={disciplina.cor} size="sm" />
                      )}

                      {/* Prazo */}
                      {t.prazo && (
                        <span className={cn(
                          "text-xs flex items-center gap-1",
                          atrasada ? "text-red-500" : "text-slate-500"
                        )}>
                          <Clock size={11} />
                          {atrasada && <AlertTriangle size={11} />}
                          {formatPrazo(t.prazo)}
                        </span>
                      )}

                      {/* Lembrete */}
                      {t.lembrete && (
                        <span className="text-xs text-indigo-500 flex items-center gap-1">
                          <Bell size={11} /> Lembrete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Estudar para a prova de Cálculo"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes da tarefa..."
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v as PrioridadeTarefa }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as StatusTarefa }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Disciplina</Label>
              <Select value={form.disciplina_id || 'none'} onValueChange={v => setForm(f => ({ ...f, disciplina_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {disciplinas.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.cor }} />
                        {d.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Input
                type="datetime-local"
                value={form.prazo}
                onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Lembrete</p>
                  <p className="text-xs text-slate-500">Notificação antes do prazo</p>
                </div>
              </div>
              <Switch
                checked={form.lembrete}
                onCheckedChange={v => setForm(f => ({ ...f, lembrete: v }))}
              />
            </div>

            {form.lembrete && (
              <div className="space-y-1.5">
                <Label>Lembrar com antecedência (minutos)</Label>
                <Select
                  value={String(form.lembrete_minutos)}
                  onValueChange={v => setForm(f => ({ ...f, lembrete_minutos: Number(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="1440">1 dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteTarefa(deleteId); toast.success('Tarefa removida'); setDeleteId(null); } }} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

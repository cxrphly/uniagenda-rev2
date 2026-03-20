// ============================================================
// UniAgenda — Eventos Page
// Design: Fresh Academic — timeline de eventos com tipos coloridos
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Plus, Calendar, Clock, BookOpen, Pencil, Trash2,
  Bell, CheckCircle, Circle, ChevronRight, FileText, Mic
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
import { format, isToday, isTomorrow, isPast, parseISO, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Evento, TipoEvento } from '@/lib/types';
import { cn } from '@/lib/utils';
import { scheduleEventReminder } from '@/lib/notifications';

const TIPO_CONFIG: Record<TipoEvento, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  prova: { label: 'Prova', color: '#EF4444', bg: '#EF444415', icon: FileText },
  trabalho: { label: 'Trabalho', color: '#F59E0B', bg: '#F59E0B15', icon: BookOpen },
  apresentacao: { label: 'Apresentação', color: '#8B5CF6', bg: '#8B5CF615', icon: Mic },
  outro: { label: 'Outro', color: '#6366F1', bg: '#6366F115', icon: Calendar },
};

const EMPTY_FORM = {
  titulo: '', tipo: 'outro' as TipoEvento, disciplina_id: '',
  data: '', hora: '', descricao: '', lembrete: false, lembrete_minutos: 60,
  concluido: false,
};

export default function EventosPage() {
  const { eventos, disciplinas, addEvento, updateEvento, deleteEvento } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const sorted = [...eventos].sort((a, b) => a.data.localeCompare(b.data));
    return {
      upcoming: sorted.filter(e => !isPast(parseISO(e.data)) || isToday(parseISO(e.data))),
      past: sorted.filter(e => isPast(parseISO(e.data)) && !isToday(parseISO(e.data))).reverse(),
    };
  }, [eventos]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, data: format(new Date(), 'yyyy-MM-dd') });
    setDialogOpen(true);
  };

  const openEdit = (e: Evento) => {
    setEditing(e);
    setForm({
      titulo: e.titulo, tipo: e.tipo, disciplina_id: e.disciplina_id || '',
      data: e.data, hora: e.hora || '', descricao: e.descricao || '',
      lembrete: e.lembrete, lembrete_minutos: e.lembrete_minutos || 60,
      concluido: e.concluido,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error('Informe o título do evento'); return; }
    if (!form.data) { toast.error('Informe a data do evento'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        disciplina_id: form.disciplina_id || null,
        hora: form.hora || null,
      };
      if (editing) {
        await updateEvento(editing.id, data);
        toast.success('Evento atualizado!');
      } else {
        const ev = await addEvento(data);
        if (ev.lembrete) scheduleEventReminder(ev);
        toast.success('Evento adicionado!');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  const toggleConcluido = async (e: Evento) => {
    await updateEvento(e.id, { concluido: !e.concluido });
  };

  const formatData = (data: string) => {
    const d = parseISO(data);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "dd 'de' MMMM", { locale: ptBR });
  };

  const EventCard = ({ e }: { e: Evento }) => {
    const tipo = TIPO_CONFIG[e.tipo];
    const TipoIcon = tipo.icon;
    const disciplina = disciplinas.find(d => d.id === e.disciplina_id);
    const dataObj = parseISO(e.data);
    const atrasado = isPast(dataObj) && !isToday(dataObj) && !e.concluido;

    return (
      <div className={cn(
        "bg-white rounded-xl border transition-all",
        e.concluido ? "border-slate-100 opacity-60" : atrasado ? "border-red-200" : "border-slate-200 hover:shadow-sm"
      )}>
        <div className="flex items-start gap-3 p-4">
          {/* Type icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: tipo.bg }}
          >
            <TipoIcon size={18} style={{ color: tipo.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                "font-semibold text-sm",
                e.concluido ? "line-through text-slate-400" : "text-slate-900"
              )}>
                {e.titulo}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  onClick={() => openEdit(e)}
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => setDeleteId(e.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: tipo.bg, color: tipo.color }}
              >
                {tipo.label}
              </span>

              <span className={cn(
                "text-xs flex items-center gap-1",
                atrasado ? "text-red-500 font-medium" : "text-slate-500"
              )}>
                <Calendar size={11} />
                {formatData(e.data)}
                {e.hora && ` às ${e.hora}`}
              </span>

              {disciplina && <DisciplinaChip nome={disciplina.nome} cor={disciplina.cor} size="sm" />}
              {e.lembrete && <span className="text-xs text-indigo-500 flex items-center gap-1"><Bell size={11} /> Lembrete</span>}
            </div>

            {e.descricao && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{e.descricao}</p>
            )}
          </div>

          {/* Complete button */}
          <button
            className={cn(
              "flex-shrink-0 transition-colors",
              e.concluido ? "text-emerald-500" : "text-slate-300 hover:text-emerald-500"
            )}
            onClick={() => toggleConcluido(e)}
            title={e.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
          >
            {e.concluido ? <CheckCircle size={20} /> : <Circle size={20} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{upcoming.length} próximo{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus size={16} /> Novo evento
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(TIPO_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <span key={key} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: config.bg, color: config.color }}>
              <Icon size={12} /> {config.label}
            </span>
          );
        })}
      </div>

      {/* Upcoming events */}
      {upcoming.length === 0 && !showPast ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-1">Nenhum evento</h3>
          <p className="text-slate-500 text-sm mb-4">Adicione provas, trabalhos e eventos</p>
          <Button onClick={openAdd} variant="outline" className="gap-2">
            <Plus size={16} /> Adicionar evento
          </Button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Próximos eventos</h2>
              <div className="space-y-2">
                {upcoming.map(e => <EventCard key={e.id} e={e} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <button
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700"
                onClick={() => setShowPast(!showPast)}
              >
                <ChevronRight size={14} className={cn("transition-transform", showPast && "rotate-90")} />
                Eventos passados ({past.length})
              </button>
              {showPast && (
                <div className="space-y-2">
                  {past.map(e => <EventCard key={e.id} e={e} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Prova de Cálculo II"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TipoEvento }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prova">Prova</SelectItem>
                    <SelectItem value="trabalho">Trabalho</SelectItem>
                    <SelectItem value="apresentacao">Apresentação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes do evento..."
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Lembrete</p>
                  <p className="text-xs text-slate-500">Notificação antes do evento</p>
                </div>
              </div>
              <Switch checked={form.lembrete} onCheckedChange={v => setForm(f => ({ ...f, lembrete: v }))} />
            </div>

            {form.lembrete && (
              <div className="space-y-1.5">
                <Label>Lembrar com antecedência</Label>
                <Select value={String(form.lembrete_minutos)} onValueChange={v => setForm(f => ({ ...f, lembrete_minutos: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="1440">1 dia</SelectItem>
                    <SelectItem value="4320">3 dias</SelectItem>
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
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteEvento(deleteId); toast.success('Evento removido'); setDeleteId(null); } }} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

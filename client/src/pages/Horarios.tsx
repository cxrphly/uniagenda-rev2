// ============================================================
// UniAgenda — Horários Page (Grade Semanal)
// Design: Fresh Academic — grade visual com cores de disciplina
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, Clock, Trash2, MapPin, GripVertical } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { HorarioAula, DiaSemana } from '@/lib/types';
import { cn } from '@/lib/utils';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const HOURS = Array.from({ length: 16 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

const EMPTY_FORM = {
  disciplina_id: '',
  dia_semana: 1 as DiaSemana,
  hora_inicio: '08:00',
  hora_fim: '10:00',
  local: '',
};

export default function HorariosPage() {
  const { horarios, disciplinas, addHorario, deleteHorario } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'grade' | 'lista'>('grade');

  // Only show Mon-Sat by default
  const activeDays = [1, 2, 3, 4, 5, 6] as DiaSemana[];

  // Group horarios by day
  const byDay = useMemo(() => {
    const map: Record<number, (HorarioAula & { disciplina?: typeof disciplinas[0] })[]> = {};
    for (const dia of activeDays) {
      map[dia] = horarios
        .filter(h => h.dia_semana === dia)
        .map(h => ({ ...h, disciplina: disciplinas.find(d => d.id === h.disciplina_id) }))
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }
    return map;
  }, [horarios, disciplinas]);

  const handleSave = async () => {
    if (!form.disciplina_id) { toast.error('Selecione uma disciplina'); return; }
    if (!form.hora_inicio || !form.hora_fim) { toast.error('Informe os horários'); return; }
    if (form.hora_inicio >= form.hora_fim) { toast.error('Hora de início deve ser antes da hora de fim'); return; }
    setSaving(true);
    try {
      await addHorario(form);
      toast.success('Horário adicionado!');
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Erro ao salvar horário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteHorario(id);
    toast.success('Horário removido');
  };

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grade de Horários</h1>
          <p className="text-slate-500 text-sm mt-0.5">{horarios.length} aula{horarios.length !== 1 ? 's' : ''} cadastrada{horarios.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'grade' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              onClick={() => setViewMode('grade')}
            >Grade</button>
            <button
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'lista' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              onClick={() => setViewMode('lista')}
            >Lista</button>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Adicionar aula</span>
            <span className="sm:hidden">Aula</span>
          </Button>
        </div>
      </div>

      {horarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Clock size={28} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-1">Grade vazia</h3>
          <p className="text-slate-500 text-sm mb-4">Adicione suas aulas para montar a grade semanal</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
            <Plus size={16} /> Adicionar aula
          </Button>
        </div>
      ) : viewMode === 'grade' ? (
        /* ---- GRADE VIEW ---- */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Header row */}
              <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}>
                <div className="p-3 text-xs text-slate-400 font-medium" />
                {activeDays.map(dia => (
                  <div key={dia} className="p-3 text-center border-l border-slate-100">
                    <p className="text-xs font-semibold text-slate-700">{DIAS[dia]}</p>
                    <p className="text-xs text-slate-400 hidden sm:block">{DIAS_FULL[dia]}</p>
                  </div>
                ))}
              </div>

              {/* Time rows */}
              {HOURS.map((hour, hi) => (
                <div
                  key={hour}
                  className="grid border-b border-slate-100 last:border-0"
                  style={{ gridTemplateColumns: '60px repeat(6, 1fr)', minHeight: '48px' }}
                >
                  <div className="p-2 text-xs text-slate-400 text-right pr-3 pt-3 font-mono">{hour}</div>
                  {activeDays.map(dia => {
                    const aulasNaHora = (byDay[dia] || []).filter(h => {
                      const start = timeToMinutes(h.hora_inicio);
                      const end = timeToMinutes(h.hora_fim);
                      const slotStart = timeToMinutes(hour);
                      const slotEnd = slotStart + 60;
                      return start < slotEnd && end > slotStart;
                    });

                    return (
                      <div key={dia} className="border-l border-slate-100 p-0.5 relative">
                        {aulasNaHora.map(aula => {
                          const cor = aula.disciplina?.cor || '#6366F1';
                          const isStart = aula.hora_inicio === hour || (
                            timeToMinutes(aula.hora_inicio) > timeToMinutes(hour) &&
                            timeToMinutes(aula.hora_inicio) < timeToMinutes(hour) + 60
                          );
                          if (!isStart) return null;
                          return (
                            <div
                              key={aula.id}
                              className="rounded-lg p-1.5 text-xs group relative"
                              style={{ backgroundColor: cor + '20', borderLeft: `3px solid ${cor}` }}
                            >
                              <p className="font-semibold truncate" style={{ color: cor }}>
                                {aula.disciplina?.nome || 'Disciplina'}
                              </p>
                              <p className="text-slate-500 text-[10px]">
                                {aula.hora_inicio}–{aula.hora_fim}
                              </p>
                              {(aula.local || aula.disciplina?.local) && (
                                <p className="text-slate-400 text-[10px] truncate">
                                  {aula.local || aula.disciplina?.local}
                                </p>
                              )}
                              <button
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                onClick={() => handleDelete(aula.id)}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ---- LISTA VIEW ---- */
        <div className="space-y-4">
          {activeDays.map(dia => {
            const aulas = byDay[dia] || [];
            if (aulas.length === 0) return null;
            return (
              <div key={dia} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700 text-sm">{DIAS_FULL[dia]}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {aulas.map(aula => {
                    const cor = aula.disciplina?.cor || '#6366F1';
                    return (
                      <div key={aula.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {aula.disciplina?.nome || 'Disciplina'}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={11} /> {aula.hora_inicio}–{aula.hora_fim}
                            </span>
                            {(aula.local || aula.disciplina?.local) && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin size={11} /> {aula.local || aula.disciplina?.local}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          onClick={() => handleDelete(aula.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar aula</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Disciplina *</Label>
              <Select
                value={form.disciplina_id}
                onValueChange={v => setForm(f => ({ ...f, disciplina_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
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
              <Label>Dia da semana *</Label>
              <Select
                value={String(form.dia_semana)}
                onValueChange={v => setForm(f => ({ ...f, dia_semana: Number(v) as DiaSemana }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_FULL.map((dia, i) => (
                    <SelectItem key={i} value={String(i)}>{dia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início *</Label>
                <Input
                  type="time"
                  value={form.hora_inicio}
                  onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim *</Label>
                <Input
                  type="time"
                  value={form.hora_fim}
                  onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Local (opcional)</Label>
              <Input
                placeholder="Sala ou local específico"
                value={form.local}
                onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

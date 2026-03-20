// ============================================================
// UniAgenda — Disciplinas Page
// Design: Fresh Academic — cards com cor de disciplina
// ============================================================

import React, { useState } from 'react';
import {
  Plus, BookOpen, User, MapPin, AlertTriangle, Pencil, Trash2,
  GraduationCap, Hash, Clock
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import ColorPicker from '@/components/ColorPicker';
import { toast } from 'sonner';
import type { Disciplina } from '@/lib/types';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  nome: '', professor: '', local: '', cor: '#6366F1',
  faltas: 0, max_faltas: 15, codigo: '', carga_horaria: 60,
};

export default function DisciplinasPage() {
  const { disciplinas, addDisciplina, updateDisciplina, deleteDisciplina } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Disciplina | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (d: Disciplina) => {
    setEditing(d);
    setForm({
      nome: d.nome, professor: d.professor, local: d.local, cor: d.cor,
      faltas: d.faltas, max_faltas: d.max_faltas || 15,
      codigo: d.codigo || '', carga_horaria: d.carga_horaria || 60,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Informe o nome da disciplina'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateDisciplina(editing.id, form);
        toast.success('Disciplina atualizada!');
      } else {
        await addDisciplina(form);
        toast.success('Disciplina adicionada!');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar disciplina');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDisciplina(deleteId);
    toast.success('Disciplina removida');
    setDeleteId(null);
  };

  const faltasPercent = (d: Disciplina) => {
    const max = d.max_faltas || 15;
    return Math.min((d.faltas / max) * 100, 100);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disciplinas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''} cadastrada{disciplinas.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus size={16} />
          Nova disciplina
        </Button>
      </div>

      {/* Grid */}
      {disciplinas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-1">Nenhuma disciplina</h3>
          <p className="text-slate-500 text-sm mb-4">Adicione suas disciplinas para começar</p>
          <Button onClick={openAdd} variant="outline" className="gap-2">
            <Plus size={16} /> Adicionar disciplina
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplinas.map(d => {
            const pct = faltasPercent(d);
            const danger = pct >= 75;
            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: d.cor }} />

                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: d.cor + '20' }}
                      >
                        <BookOpen size={18} style={{ color: d.cor }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">{d.nome}</h3>
                        {d.codigo && <p className="text-xs text-slate-400">{d.codigo}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        onClick={() => openEdit(d)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => setDeleteId(d.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User size={12} className="flex-shrink-0" />
                      <span className="truncate">{d.professor || 'Professor não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{d.local || 'Local não informado'}</span>
                    </div>
                    {d.carga_horaria && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={12} className="flex-shrink-0" />
                        <span>{d.carga_horaria}h de carga horária</span>
                      </div>
                    )}
                  </div>

                  {/* Faltas */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        {danger && <AlertTriangle size={11} className="text-amber-500" />}
                        Faltas
                      </span>
                      <span className={cn(
                        "text-xs font-semibold",
                        danger ? "text-red-500" : "text-slate-700"
                      )}>
                        {d.faltas}/{d.max_faltas || 15}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
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
            <DialogTitle>{editing ? 'Editar disciplina' : 'Nova disciplina'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da disciplina *</Label>
              <Input
                placeholder="Ex: Cálculo I"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input
                  placeholder="Ex: MAT001"
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Carga horária (h)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.carga_horaria}
                  onChange={e => setForm(f => ({ ...f, carga_horaria: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Professor</Label>
              <Input
                placeholder="Nome do professor"
                value={form.professor}
                onChange={e => setForm(f => ({ ...f, professor: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Local / Sala</Label>
              <Input
                placeholder="Ex: Bloco A, Sala 203"
                value={form.local}
                onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Faltas atuais</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.faltas}
                  onChange={e => setForm(f => ({ ...f, faltas: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. de faltas</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_faltas}
                  onChange={e => setForm(f => ({ ...f, max_faltas: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor da disciplina</Label>
              <ColorPicker
                value={form.cor}
                onChange={cor => setForm(f => ({ ...f, cor }))}
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
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover disciplina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os horários associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

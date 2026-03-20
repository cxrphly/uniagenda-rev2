// ============================================================
// UniAgenda — Anotações Page
// Design: Fresh Academic — cards de notas com cores e editor rico
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, FileText, Pencil, Trash2, Search, Bold, Italic,
  List, Heading2, Undo, Redo, X, Save
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import ColorPicker, { DisciplinaChip } from '@/components/ColorPicker';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Anotacao } from '@/lib/types';
import { cn } from '@/lib/utils';

// TipTap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';

const EMPTY_FORM = {
  titulo: '', conteudo: '', disciplina_id: '', cor: '#6366F1', tags: [] as string[],
};

// ============================================================
// Rich Text Editor
// ============================================================
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] max-h-[400px] overflow-y-auto p-3 focus:outline-none prose prose-sm max-w-none text-slate-800',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, []);

  if (!editor) return null;

  const ToolbarBtn = ({ onClick, active, children, title }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-colors text-slate-600",
        active ? "bg-indigo-100 text-indigo-700" : "hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Itálico"
        >
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Título"
        >
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista"
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Destacar"
        >
          <span className="text-xs font-bold bg-yellow-200 px-1 rounded">H</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo size={14} />
        </ToolbarBtn>
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function AnotacoesPage() {
  const { anotacoes, disciplinas, addAnotacao, updateAnotacao, deleteAnotacao } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Anotacao | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDisciplina, setFilterDisciplina] = useState('todas');

  const filtered = anotacoes
    .filter(a => !search || a.titulo.toLowerCase().includes(search.toLowerCase()) ||
      a.conteudo.toLowerCase().includes(search.toLowerCase()))
    .filter(a => filterDisciplina === 'todas' || a.disciplina_id === filterDisciplina)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: Anotacao) => {
    setEditing(a);
    setForm({
      titulo: a.titulo, conteudo: a.conteudo,
      disciplina_id: a.disciplina_id || '', cor: a.cor, tags: a.tags || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error('Informe o título da anotação'); return; }
    setSaving(true);
    try {
      const data = { ...form, disciplina_id: form.disciplina_id || null };
      if (editing) {
        await updateAnotacao(editing.id, data);
        toast.success('Anotação atualizada!');
      } else {
        await addAnotacao(data);
        toast.success('Anotação salva!');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar anotação');
    } finally {
      setSaving(false);
    }
  };

  // Strip HTML for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anotações</h1>
          <p className="text-slate-500 text-sm mt-0.5">{anotacoes.length} nota{anotacoes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus size={16} /> Nova anotação
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar anotações..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterDisciplina} onValueChange={setFilterDisciplina}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas disciplinas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas disciplinas</SelectItem>
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

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText size={28} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-1">
            {search || filterDisciplina !== 'todas' ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação'}
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            {search || filterDisciplina !== 'todas' ? 'Tente outros filtros' : 'Crie sua primeira anotação'}
          </p>
          {!search && filterDisciplina === 'todas' && (
            <Button onClick={openAdd} variant="outline" className="gap-2">
              <Plus size={16} /> Nova anotação
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const disciplina = disciplinas.find(d => d.id === a.disciplina_id);
            const preview = stripHtml(a.conteudo);

            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openEdit(a)}
              >
                {/* Color top bar */}
                <div className="h-1.5" style={{ backgroundColor: a.cor }} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 flex-1">{a.titulo}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                        onClick={e => { e.stopPropagation(); setDeleteId(a.id); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {preview && (
                    <p className="text-xs text-slate-500 line-clamp-3 mb-3">{preview}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {disciplina ? (
                      <DisciplinaChip nome={disciplina.nome} cor={disciplina.cor} size="sm" />
                    ) : <span />}
                    <span className="text-xs text-slate-400">
                      {format(new Date(a.updated_at), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar anotação' : 'Nova anotação'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Título da anotação"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
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

            <div className="space-y-2">
              <Label>Cor</Label>
              <ColorPicker value={form.cor} onChange={cor => setForm(f => ({ ...f, cor }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Conteúdo</Label>
              <RichEditor
                value={form.conteudo}
                onChange={v => setForm(f => ({ ...f, conteudo: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Save size={15} />
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar anotação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anotação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteAnotacao(deleteId); toast.success('Anotação removida'); setDeleteId(null); } }} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

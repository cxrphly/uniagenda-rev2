// ============================================================
// UniAgenda — Dashboard Page
// Design: Fresh Academic — overview completo da vida acadêmica
// ============================================================

import React, { useMemo } from 'react';
import { Link } from 'wouter';
import {
  BookOpen, Clock, CheckSquare, Calendar, FileText,
  AlertTriangle, ChevronRight, GraduationCap, TrendingUp,
  Bell, Wifi, WifiOff, RefreshCw, Plus
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DisciplinaChip } from '@/components/ColorPicker';
import { format, isToday, isTomorrow, isPast, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Evento, Tarefa, HorarioAula, Disciplina } from '@/lib/types';
import { cn } from '@/lib/utils';


const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIPO_COLORS: Record<string, string> = {
  prova: '#EF4444',
  trabalho: '#F59E0B',
  apresentacao: '#8B5CF6',
  outro: '#6366F1',
};

const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: '#10B981', media: '#F59E0B', alta: '#EF4444', urgente: '#7C3AED',
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { disciplinas, horarios, tarefas, eventos, anotacoes, syncState, loading } = useData();

  const hoje = new Date();
  const diaSemanaHoje = getDay(hoje);

  const stats = useMemo(() => {
    const aulasHoje = horarios
      .filter(h => h.dia_semana === diaSemanaHoje)
      .map(h => ({ ...h, disciplina: disciplinas.find(d => d.id === h.disciplina_id) }))
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const tarefasPendentes = tarefas
      .filter(t => t.status !== 'concluida')
      .sort((a, b) => {
        const pOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 };
        return pOrder[a.prioridade] - pOrder[b.prioridade];
      })
      .slice(0, 5);

    const proximosEventos = eventos
      .filter(e => !e.concluido && !isPast(parseISO(e.data)))
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 5);

    const notasRecentes = [...anotacoes]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 4);

    const disciplinasComFaltasAltas = disciplinas.filter(d => {
      const max = d.max_faltas || 15;
      return (d.faltas / max) >= 0.75;
    });

    return { aulasHoje, tarefasPendentes, proximosEventos, notasRecentes, disciplinasComFaltasAltas };
  }, [disciplinas, horarios, tarefas, eventos, anotacoes, diaSemanaHoje]);

  const formatEventDate = (data: string) => {
    const d = parseISO(data);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "dd/MM", { locale: ptBR });
  };

  const hora = hoje.getHours();
  const greeting = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const nome = profile?.nome?.split(' ')[0] || 'Estudante';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <RefreshCw size={32} className="text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {nome}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200">
          {syncState.status === 'offline' ? (
            <><WifiOff size={12} className="text-amber-500" /><span className="text-amber-600">Offline</span></>
          ) : syncState.status === 'syncing' ? (
            <><RefreshCw size={12} className="text-indigo-500 animate-spin" /><span className="text-indigo-600">Sincronizando</span></>
          ) : (
            <><Wifi size={12} className="text-emerald-500" /><span className="text-emerald-600">Sincronizado</span></>
          )}
        </div>
      </div>

      {/* Alertas de faltas */}
      {stats.disciplinasComFaltasAltas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Atenção com as faltas!</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.disciplinasComFaltasAltas.map(d => (
              <span key={d.id} className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: d.cor + '20', color: d.cor }}>
                {d.nome}: {d.faltas}/{d.max_faltas || 15} faltas
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Disciplinas', value: disciplinas.length, icon: BookOpen,
            color: '#6366F1', bg: '#6366F115', link: '/disciplinas'
          },
          {
            label: 'Tarefas pendentes', value: tarefas.filter(t => t.status !== 'concluida').length,
            icon: CheckSquare, color: '#F59E0B', bg: '#F59E0B15', link: '/tarefas'
          },
          {
            label: 'Próximos eventos', value: stats.proximosEventos.length,
            icon: Calendar, color: '#EF4444', bg: '#EF444415', link: '/eventos'
          },
          {
            label: 'Anotações', value: anotacoes.length, icon: FileText,
            color: '#10B981', bg: '#10B98115', link: '/anotacoes'
          },
        ].map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} href={link} className="block">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aulas de hoje */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Aulas de hoje</h2>
            </div>
            <span className="text-xs text-slate-400">{DIAS_FULL[diaSemanaHoje]}</span>
          </div>
          <div className="p-4">
            {stats.aulasHoje.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Sem aulas hoje</p>
                <Link href="/horarios">
                  <span className="text-xs text-indigo-500 hover:underline mt-1 block cursor-pointer">Ver grade completa</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.aulasHoje.map(h => {
                  const cor = h.disciplina?.cor || '#6366F1';
                  return (
                    <div key={h.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {h.disciplina?.nome || 'Disciplina'}
                        </p>
                        <p className="text-xs text-slate-500">{h.hora_inicio} – {h.hora_fim}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Próximos eventos */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-red-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Próximos eventos</h2>
            </div>
            <Link href="/eventos">
              <span className="text-xs text-indigo-500 hover:underline cursor-pointer">Ver todos</span>
            </Link>
          </div>
          <div className="p-4">
            {stats.proximosEventos.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Nenhum evento próximo</p>
                <Link href="/eventos">
                  <span className="text-xs text-indigo-500 hover:underline mt-1 block cursor-pointer">Adicionar evento</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.proximosEventos.map(e => {
                  const cor = TIPO_COLORS[e.tipo] || '#6366F1';
                  const disciplina = disciplinas.find(d => d.id === e.disciplina_id);
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ backgroundColor: cor + '20', color: cor }}
                      >
                        {formatEventDate(e.data)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{e.titulo}</p>
                        {disciplina && <DisciplinaChip nome={disciplina.nome} cor={disciplina.cor} size="sm" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tarefas pendentes */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-amber-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Tarefas pendentes</h2>
            </div>
            <Link href="/tarefas">
              <span className="text-xs text-indigo-500 hover:underline cursor-pointer">Ver todas</span>
            </Link>
          </div>
          <div className="p-4">
            {stats.tarefasPendentes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Nenhuma tarefa pendente 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.tarefasPendentes.map(t => {
                  const cor = PRIORIDADE_COLORS[t.prioridade];
                  const atrasada = t.prazo && isPast(new Date(t.prazo));
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{t.titulo}</p>
                        {t.prazo && (
                          <p className={cn("text-xs", atrasada ? "text-red-500" : "text-slate-500")}>
                            {atrasada ? '⚠ ' : ''}
                            {format(new Date(t.prazo), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas recentes */}
      {stats.notasRecentes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              <h2 className="font-semibold text-slate-800">Notas recentes</h2>
            </div>
            <Link href="/anotacoes">
              <span className="text-xs text-indigo-500 hover:underline cursor-pointer">Ver todas</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.notasRecentes.map(a => {
              const disciplina = disciplinas.find(d => d.id === a.disciplina_id);
              const tmp = document.createElement('div');
              tmp.innerHTML = a.conteudo;
              const preview = tmp.textContent || '';
              return (
                <Link key={a.id} href="/anotacoes">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer">
                    <div className="h-1 rounded-full mb-3" style={{ backgroundColor: a.cor }} />
                    <h3 className="font-medium text-slate-900 text-sm truncate mb-1">{a.titulo}</h3>
                    {preview && <p className="text-xs text-slate-500 line-clamp-2">{preview}</p>}
                    {disciplina && <div className="mt-2"><DisciplinaChip nome={disciplina.nome} cor={disciplina.cor} size="sm" /></div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Disciplinas overview */}
      {disciplinas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Disciplinas</h2>
            </div>
            <Link href="/disciplinas">
              <span className="text-xs text-indigo-500 hover:underline cursor-pointer">Gerenciar</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {disciplinas.map(d => {
              const pct = Math.min(((d.faltas / (d.max_faltas || 15)) * 100), 100);
              return (
                <Link key={d.id} href="/disciplinas">
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center hover:shadow-md transition-all cursor-pointer">
                    <div
                      className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: d.cor + '20' }}
                    >
                      <BookOpen size={18} style={{ color: d.cor }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">{d.nome}</p>
                    <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", pct >= 75 ? "bg-red-500" : "bg-emerald-500")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{d.faltas}/{d.max_faltas || 15} faltas</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {disciplinas.length === 0 && tarefas.length === 0 && eventos.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={36} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Bem-vindo ao UniAgenda!</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Comece adicionando suas disciplinas para organizar sua vida acadêmica.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/disciplinas">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus size={16} /> Adicionar disciplina
              </Button>
            </Link>
            <Link href="/horarios">
              <Button variant="outline" className="gap-2">
                <Clock size={16} /> Montar grade
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
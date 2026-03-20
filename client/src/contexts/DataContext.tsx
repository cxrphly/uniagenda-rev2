// ============================================================
// UniAgenda — Data Context
// Design: Fresh Academic (Contemporary Academic)
// Manages all CRUD operations with offline-first approach
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useAuth } from './AuthContext';
import { dbGetAll, dbPut, dbGet } from '@/lib/db';
import { queueSync, fullSync, initSyncListeners, subscribeSyncState, SyncState } from '@/lib/sync';
import type {
  Disciplina, HorarioAula, Anotacao, Tarefa, Evento
} from '@/lib/types';

interface DataContextType {
  // Data
  disciplinas: Disciplina[];
  horarios: HorarioAula[];
  anotacoes: Anotacao[];
  tarefas: Tarefa[];
  eventos: Evento[];
  syncState: SyncState;
  loading: boolean;

  // Disciplinas
  addDisciplina: (d: Omit<Disciplina, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Disciplina>;
  updateDisciplina: (id: string, d: Partial<Disciplina>) => Promise<void>;
  deleteDisciplina: (id: string) => Promise<void>;

  // Horarios
  addHorario: (h: Omit<HorarioAula, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<HorarioAula>;
  updateHorario: (id: string, h: Partial<HorarioAula>) => Promise<void>;
  deleteHorario: (id: string) => Promise<void>;

  // Anotacoes
  addAnotacao: (a: Omit<Anotacao, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Anotacao>;
  updateAnotacao: (id: string, a: Partial<Anotacao>) => Promise<void>;
  deleteAnotacao: (id: string) => Promise<void>;

  // Tarefas
  addTarefa: (t: Omit<Tarefa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Tarefa>;
  updateTarefa: (id: string, t: Partial<Tarefa>) => Promise<void>;
  deleteTarefa: (id: string) => Promise<void>;

  // Eventos
  addEvento: (e: Omit<Evento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Evento>;
  updateEvento: (id: string, e: Partial<Evento>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;

  // Utils
  forceSync: () => Promise<void>;
  getDisciplinaById: (id: string) => Disciplina | undefined;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [horarios, setHorarios] = useState<HorarioAula[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({ status: 'idle', lastSync: null, pendingCount: 0 });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [d, h, a, t, e] = await Promise.all([
        dbGetAll<Disciplina>('disciplinas', user.id),
        dbGetAll<HorarioAula>('horarios', user.id),
        dbGetAll<Anotacao>('anotacoes', user.id),
        dbGetAll<Tarefa>('tarefas', user.id),
        dbGetAll<Evento>('eventos', user.id),
      ]);
      setDisciplinas(d);
      setHorarios(h);
      setAnotacoes(a);
      setTarefas(t);
      setEventos(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDisciplinas([]);
      setHorarios([]);
      setAnotacoes([]);
      setTarefas([]);
      setEventos([]);
      setLoading(false);
      return;
    }

    loadAll();

    // Subscribe to sync state
    const unsub = subscribeSyncState(setSyncState);

    // Init sync listeners
    initSyncListeners(() => user?.id || null);

    // Full sync on login
    fullSync(user.id).then(() => loadAll());

    return () => unsub();
  }, [user, loadAll]);

  // ============================================================
  // Helper: create base entity fields
  // ============================================================
  const makeBase = (userId: string) => ({
    id: nanoid(),
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: 'pending' as const,
  });

  // ============================================================
  // DISCIPLINAS
  // ============================================================
  const addDisciplina = async (data: Omit<Disciplina, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');
    const item: Disciplina = { ...makeBase(user.id), ...data };
    await dbPut('disciplinas', item);
    await queueSync('disciplinas', 'insert', item as any);
    setDisciplinas(prev => [...prev, item]);
    return item;
  };

  const updateDisciplina = async (id: string, data: Partial<Disciplina>) => {
    if (!user) return;
    const existing = await dbGet<Disciplina>('disciplinas', id);
    if (!existing) return;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await dbPut('disciplinas', updated);
    await queueSync('disciplinas', 'update', updated as any);
    setDisciplinas(prev => prev.map(d => d.id === id ? updated : d));
  };

  const deleteDisciplina = async (id: string) => {
    if (!user) return;
    const existing = await dbGet<Disciplina>('disciplinas', id);
    if (!existing) return;
    const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbPut('disciplinas', updated);
    await queueSync('disciplinas', 'delete', { id });
    setDisciplinas(prev => prev.filter(d => d.id !== id));
  };

  // ============================================================
  // HORARIOS
  // ============================================================
  const addHorario = async (data: Omit<HorarioAula, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');
    const item: HorarioAula = { ...makeBase(user.id), ...data };
    await dbPut('horarios', item);
    await queueSync('horarios', 'insert', item as any);
    setHorarios(prev => [...prev, item]);
    return item;
  };

  const updateHorario = async (id: string, data: Partial<HorarioAula>) => {
    if (!user) return;
    const existing = await dbGet<HorarioAula>('horarios', id);
    if (!existing) return;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await dbPut('horarios', updated);
    await queueSync('horarios', 'update', updated as any);
    setHorarios(prev => prev.map(h => h.id === id ? updated : h));
  };

  const deleteHorario = async (id: string) => {
    if (!user) return;
    const existing = await dbGet<HorarioAula>('horarios', id);
    if (!existing) return;
    const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbPut('horarios', updated);
    await queueSync('horarios', 'delete', { id });
    setHorarios(prev => prev.filter(h => h.id !== id));
  };

  // ============================================================
  // ANOTACOES
  // ============================================================
  const addAnotacao = async (data: Omit<Anotacao, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');
    const item: Anotacao = { ...makeBase(user.id), ...data };
    await dbPut('anotacoes', item);
    await queueSync('anotacoes', 'insert', item as any);
    setAnotacoes(prev => [...prev, item]);
    return item;
  };

  const updateAnotacao = async (id: string, data: Partial<Anotacao>) => {
    if (!user) return;
    const existing = await dbGet<Anotacao>('anotacoes', id);
    if (!existing) return;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await dbPut('anotacoes', updated);
    await queueSync('anotacoes', 'update', updated as any);
    setAnotacoes(prev => prev.map(a => a.id === id ? updated : a));
  };

  const deleteAnotacao = async (id: string) => {
    if (!user) return;
    const existing = await dbGet<Anotacao>('anotacoes', id);
    if (!existing) return;
    const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbPut('anotacoes', updated);
    await queueSync('anotacoes', 'delete', { id });
    setAnotacoes(prev => prev.filter(a => a.id !== id));
  };

  // ============================================================
  // TAREFAS
  // ============================================================
  const addTarefa = async (data: Omit<Tarefa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');
    const item: Tarefa = { ...makeBase(user.id), ...data };
    await dbPut('tarefas', item);
    await queueSync('tarefas', 'insert', item as any);
    setTarefas(prev => [...prev, item]);
    return item;
  };

  const updateTarefa = async (id: string, data: Partial<Tarefa>) => {
    if (!user) return;
    const existing = await dbGet<Tarefa>('tarefas', id);
    if (!existing) return;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await dbPut('tarefas', updated);
    await queueSync('tarefas', 'update', updated as any);
    setTarefas(prev => prev.map(t => t.id === id ? updated : t));
  };

  const deleteTarefa = async (id: string) => {
    if (!user) return;
    const existing = await dbGet<Tarefa>('tarefas', id);
    if (!existing) return;
    const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbPut('tarefas', updated);
    await queueSync('tarefas', 'delete', { id });
    setTarefas(prev => prev.filter(t => t.id !== id));
  };

  // ============================================================
  // EVENTOS
  // ============================================================
  const addEvento = async (data: Omit<Evento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');
    const item: Evento = { ...makeBase(user.id), ...data };
    await dbPut('eventos', item);
    await queueSync('eventos', 'insert', item as any);
    setEventos(prev => [...prev, item]);
    return item;
  };

  const updateEvento = async (id: string, data: Partial<Evento>) => {
    if (!user) return;
    const existing = await dbGet<Evento>('eventos', id);
    if (!existing) return;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await dbPut('eventos', updated);
    await queueSync('eventos', 'update', updated as any);
    setEventos(prev => prev.map(e => e.id === id ? updated : e));
  };

  const deleteEvento = async (id: string) => {
    if (!user) return;
    const existing = await dbGet<Evento>('eventos', id);
    if (!existing) return;
    const updated = { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbPut('eventos', updated);
    await queueSync('eventos', 'delete', { id });
    setEventos(prev => prev.filter(e => e.id !== id));
  };

  const forceSync = async () => {
    if (!user) return;
    await fullSync(user.id);
    await loadAll();
  };

  const getDisciplinaById = (id: string) => disciplinas.find(d => d.id === id);

  return (
    <DataContext.Provider value={{
      disciplinas, horarios, anotacoes, tarefas, eventos, syncState, loading,
      addDisciplina, updateDisciplina, deleteDisciplina,
      addHorario, updateHorario, deleteHorario,
      addAnotacao, updateAnotacao, deleteAnotacao,
      addTarefa, updateTarefa, deleteTarefa,
      addEvento, updateEvento, deleteEvento,
      forceSync, getDisciplinaById,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// ============================================================
// UniAgenda — Type Definitions
// Design: Fresh Academic (Contemporary Academic)
// ============================================================

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

export interface BaseEntity {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sync_status?: SyncStatus;
}

// ============================================================
// DISCIPLINA
// ============================================================
export interface Disciplina extends BaseEntity {
  nome: string;
  professor: string;
  local: string;
  cor: string;
  faltas: number;
  max_faltas?: number;
  codigo?: string;
  carga_horaria?: number;
}

// ============================================================
// HORÁRIO (Grade Semanal)
// ============================================================
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 1=Seg...6=Sab

export interface HorarioAula extends BaseEntity {
  disciplina_id: string;
  dia_semana: DiaSemana;
  hora_inicio: string; // "HH:MM"
  hora_fim: string;    // "HH:MM"
  local?: string;
}

// ============================================================
// ANOTAÇÃO
// ============================================================
export interface Anotacao extends BaseEntity {
  titulo: string;
  conteudo: string; // HTML do TipTap
  disciplina_id?: string | null;
  cor: string;
  tags?: string[];
}

// ============================================================
// TAREFA
// ============================================================
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente';
export type StatusTarefa = 'pendente' | 'em_andamento' | 'concluida';

export interface Tarefa extends BaseEntity {
  titulo: string;
  descricao?: string;
  prioridade: PrioridadeTarefa;
  status: StatusTarefa;
  disciplina_id?: string | null;
  prazo?: string | null; // ISO date string
  lembrete: boolean;
  lembrete_minutos?: number; // minutos antes do prazo
}

// ============================================================
// EVENTO
// ============================================================
export type TipoEvento = 'prova' | 'trabalho' | 'apresentacao' | 'outro';

export interface Evento extends BaseEntity {
  titulo: string;
  tipo: TipoEvento;
  disciplina_id?: string | null;
  data: string; // ISO date string (YYYY-MM-DD)
  hora?: string | null; // "HH:MM"
  descricao?: string;
  lembrete: boolean;
  lembrete_minutos?: number;
  concluido: boolean;
}

// ============================================================
// USUÁRIO (Auth)
// ============================================================
export interface UserProfile {
  id: string;
  email: string;
  nome?: string;
  avatar_url?: string;
  created_at: string;
  notificacoes_ativas: boolean;
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
export interface AppConfig {
  notificacoes_ativas: boolean;
  tema: 'light' | 'dark' | 'system';
  sincronizacao_automatica: boolean;
}

// ============================================================
// SYNC
// ============================================================
export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

// ============================================================
// EXPORT/IMPORT
// ============================================================
export interface ExportData {
  version: string;
  exported_at: string;
  user_email: string;
  disciplinas: Disciplina[];
  horarios: HorarioAula[];
  anotacoes: Anotacao[];
  tarefas: Tarefa[];
  eventos: Evento[];
}

// ============================================================
// DASHBOARD
// ============================================================
export interface DashboardStats {
  totalDisciplinas: number;
  tarefasPendentes: number;
  eventosHoje: number;
  notasRecentes: number;
  proximosEventos: Evento[];
  tarefasUrgentes: Tarefa[];
  aulasHoje: (HorarioAula & { disciplina?: Disciplina })[];
  notasRecentes5: Anotacao[];
}

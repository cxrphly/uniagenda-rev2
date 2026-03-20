// ============================================================
// UniAgenda — IndexedDB Layer (idb)
// Design: Fresh Academic (Contemporary Academic)
// Offline-first storage with sync queue
// ============================================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Disciplina, HorarioAula, Anotacao, Tarefa, Evento,
  SyncQueueItem, UserProfile
} from './types';

interface UniAgendaDB extends DBSchema {
  disciplinas: {
    key: string;
    value: Disciplina;
    indexes: { 'by-user': string; 'by-updated': string };
  };
  horarios: {
    key: string;
    value: HorarioAula;
    indexes: { 'by-user': string; 'by-disciplina': string };
  };
  anotacoes: {
    key: string;
    value: Anotacao;
    indexes: { 'by-user': string; 'by-disciplina': string; 'by-updated': string };
  };
  tarefas: {
    key: string;
    value: Tarefa;
    indexes: { 'by-user': string; 'by-status': string; 'by-prazo': string };
  };
  eventos: {
    key: string;
    value: Evento;
    indexes: { 'by-user': string; 'by-data': string };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
  profiles: {
    key: string;
    value: UserProfile;
  };
  app_meta: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'uniagenda-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<UniAgendaDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<UniAgendaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<UniAgendaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Disciplinas
      if (!db.objectStoreNames.contains('disciplinas')) {
        const s = db.createObjectStore('disciplinas', { keyPath: 'id' });
        s.createIndex('by-user', 'user_id');
        s.createIndex('by-updated', 'updated_at');
      }

      // Horarios
      if (!db.objectStoreNames.contains('horarios')) {
        const s = db.createObjectStore('horarios', { keyPath: 'id' });
        s.createIndex('by-user', 'user_id');
        s.createIndex('by-disciplina', 'disciplina_id');
      }

      // Anotacoes
      if (!db.objectStoreNames.contains('anotacoes')) {
        const s = db.createObjectStore('anotacoes', { keyPath: 'id' });
        s.createIndex('by-user', 'user_id');
        s.createIndex('by-disciplina', 'disciplina_id');
        s.createIndex('by-updated', 'updated_at');
      }

      // Tarefas
      if (!db.objectStoreNames.contains('tarefas')) {
        const s = db.createObjectStore('tarefas', { keyPath: 'id' });
        s.createIndex('by-user', 'user_id');
        s.createIndex('by-status', 'status');
        s.createIndex('by-prazo', 'prazo');
      }

      // Eventos
      if (!db.objectStoreNames.contains('eventos')) {
        const s = db.createObjectStore('eventos', { keyPath: 'id' });
        s.createIndex('by-user', 'user_id');
        s.createIndex('by-data', 'data');
      }

      // Sync Queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const s = db.createObjectStore('sync_queue', { keyPath: 'id' });
        s.createIndex('by-timestamp', 'timestamp');
      }

      // Profiles
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }

      // App Meta (last sync, config, etc)
      if (!db.objectStoreNames.contains('app_meta')) {
        db.createObjectStore('app_meta', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ============================================================
// Generic CRUD helpers
// ============================================================

export async function dbGetAll<T>(
  storeName: keyof UniAgendaDB,
  userId: string
): Promise<T[]> {
  const db = await getDB();
  const store = storeName as 'disciplinas' | 'horarios' | 'anotacoes' | 'tarefas' | 'eventos';
  const all = await (db as any).getAllFromIndex(store, 'by-user', userId) as T[];
  return (all as any[]).filter((item: any) => !item.deleted_at) as T[];
}

export async function dbGet<T>(
  storeName: keyof UniAgendaDB,
  id: string
): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName as any, id) as Promise<T | undefined>;
}

export async function dbPut<T>(
  storeName: keyof UniAgendaDB,
  item: T
): Promise<void> {
  const db = await getDB();
  await db.put(storeName as any, item as any);
}

export async function dbDelete(
  storeName: keyof UniAgendaDB,
  id: string
): Promise<void> {
  const db = await getDB();
  await db.delete(storeName as any, id);
}

export async function dbGetAllRaw<T>(
  storeName: keyof UniAgendaDB,
  userId: string
): Promise<T[]> {
  const db = await getDB();
  const store = storeName as 'disciplinas' | 'horarios' | 'anotacoes' | 'tarefas' | 'eventos';
  return (db as any).getAllFromIndex(store, 'by-user', userId) as Promise<T[]>;
}

// ============================================================
// Sync Queue helpers
// ============================================================

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'retries'>): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', { ...item, retries: 0 });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-timestamp');
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', item);
}

// ============================================================
// App Meta helpers
// ============================================================

export async function getAppMeta(key: string): Promise<unknown> {
  const db = await getDB();
  const item = await db.get('app_meta', key);
  return item?.value;
}

export async function setAppMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('app_meta', { key, value });
}

// ============================================================
// Clear all user data (logout)
// ============================================================

export async function clearUserData(userId: string): Promise<void> {
  const db = await getDB();
  const stores: Array<'disciplinas' | 'horarios' | 'anotacoes' | 'tarefas' | 'eventos'> = [
    'disciplinas', 'horarios', 'anotacoes', 'tarefas', 'eventos'
  ];

  for (const store of stores) {
    const items = await (db as any).getAllFromIndex(store, 'by-user', userId);
    for (const item of items) {
      await (db as any).delete(store, (item as any).id);
    }
  }

  // Clear sync queue
  const queue = await (db as any).getAll('sync_queue');
  for (const item of queue) {
    await (db as any).delete('sync_queue', item.id);
  }

  // Clear profile
  await (db as any).delete('profiles', userId);
}

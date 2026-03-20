// ============================================================
// UniAgenda — Sync Service (IndexedDB <-> Supabase)
// Design: Fresh Academic (Contemporary Academic)
// Conflict resolution: last-write-wins by updated_at
// ============================================================

import { supabase, isSupabaseConfigured } from './supabase';
import {
  getDB, getSyncQueue, removeSyncQueueItem, updateSyncQueueItem,
  dbPut, setAppMeta, getAppMeta, dbGetAllRaw
} from './db';
import type { SyncQueueItem } from './types';
import { nanoid } from 'nanoid';

const TABLES = ['disciplinas', 'horarios', 'anotacoes', 'tarefas', 'eventos'] as const;
type TableName = typeof TABLES[number];

let syncInProgress = false;
let syncListeners: Array<(status: SyncState) => void> = [];

export interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'offline';
  lastSync: string | null;
  pendingCount: number;
  error?: string;
}

let currentState: SyncState = {
  status: 'idle',
  lastSync: null,
  pendingCount: 0,
};

export function subscribeSyncState(cb: (state: SyncState) => void) {
  syncListeners.push(cb);
  cb(currentState);
  return () => {
    syncListeners = syncListeners.filter(l => l !== cb);
  };
}

function emitState(state: Partial<SyncState>) {
  currentState = { ...currentState, ...state };
  syncListeners.forEach(l => l(currentState));
}

// ============================================================
// Add to sync queue (called on every local write)
// ============================================================

export async function queueSync(
  table: TableName,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  const item: SyncQueueItem = {
    id: nanoid(),
    table,
    operation,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  await db.put('sync_queue', item);
  emitState({ pendingCount: currentState.pendingCount + 1 });

  // Try to sync immediately if online
  if (navigator.onLine && isSupabaseConfigured()) {
    syncNow();
  }
}

// ============================================================
// Process sync queue
// ============================================================

export async function syncNow(userId?: string): Promise<void> {
  if (syncInProgress || !isSupabaseConfigured()) return;
  if (!navigator.onLine) {
    emitState({ status: 'offline' });
    return;
  }

  syncInProgress = true;
  emitState({ status: 'syncing' });

  try {
    const queue = await getSyncQueue();

    for (const item of queue) {
      try {
        await processQueueItem(item);
        await removeSyncQueueItem(item.id);
      } catch (err) {
        if (item.retries >= 3) {
          await removeSyncQueueItem(item.id);
        } else {
          await updateSyncQueueItem({ ...item, retries: item.retries + 1 });
        }
      }
    }

    // Pull latest from Supabase (server wins for conflicts)
    if (userId) {
      await pullFromSupabase(userId);
    }

    const now = new Date().toISOString();
    await setAppMeta('last_sync', now);
    emitState({ status: 'idle', lastSync: now, pendingCount: 0 });
  } catch (err) {
    emitState({ status: 'error', error: String(err) });
  } finally {
    syncInProgress = false;
  }
}

async function processQueueItem(item: SyncQueueItem): Promise<void> {
  const { table, operation, data } = item;

  if (operation === 'delete') {
    await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', data.id as string);
  } else {
    // Remove sync_status field before sending to Supabase
    const { sync_status, ...cleanData } = data as any;
    await supabase.from(table).upsert(cleanData, { onConflict: 'id' });
  }
}

// ============================================================
// Pull from Supabase (merge with local, server wins on conflict)
// ============================================================

async function pullFromSupabase(userId: string): Promise<void> {
  const lastSync = (await getAppMeta('last_sync')) as string | null;

  for (const table of TABLES) {
    let query = supabase
      .from(table)
      .select('*')
      .eq('user_id', userId);

    if (lastSync) {
      query = query.gte('updated_at', lastSync);
    }

    const { data, error } = await query;
    if (error || !data) continue;

    for (const row of data) {
      const localItem = await (await getDB()).get(table as any, row.id) as any;

      if (!localItem) {
        // New from server
        await dbPut(table as any, { ...row, sync_status: 'synced' });
      } else {
        // Conflict resolution: last-write-wins by updated_at
        const serverTime = new Date(row.updated_at).getTime();
        const localTime = new Date(localItem.updated_at).getTime();

        if (serverTime >= localTime) {
          await dbPut(table as any, { ...row, sync_status: 'synced' });
        }
        // else: local is newer, it will be pushed via queue
      }
    }
  }
}

// ============================================================
// Full sync (initial load or force sync)
// ============================================================

export async function fullSync(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !navigator.onLine) return;

  emitState({ status: 'syncing' });
  syncInProgress = true;

  try {
    for (const table of TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId);

      if (error || !data) continue;

      for (const row of data) {
        await dbPut(table as any, { ...row, sync_status: 'synced' });
      }
    }

    // Push any local pending items
    const queue = await getSyncQueue();
    for (const item of queue) {
      try {
        await processQueueItem(item);
        await removeSyncQueueItem(item.id);
      } catch {
        // keep in queue
      }
    }

    const now = new Date().toISOString();
    await setAppMeta('last_sync', now);
    emitState({ status: 'idle', lastSync: now, pendingCount: 0 });
  } catch (err) {
    emitState({ status: 'error', error: String(err) });
  } finally {
    syncInProgress = false;
  }
}

// ============================================================
// Initialize sync listeners (online/offline events)
// ============================================================

export function initSyncListeners(getUserId: () => string | null): void {
  window.addEventListener('online', () => {
    const uid = getUserId();
    if (uid) syncNow(uid);
  });

  window.addEventListener('offline', () => {
    emitState({ status: 'offline' });
  });

  // Periodic sync every 2 minutes
  setInterval(() => {
    const uid = getUserId();
    if (uid && navigator.onLine) syncNow(uid);
  }, 2 * 60 * 1000);

  // Load last sync time
  getAppMeta('last_sync').then(v => {
    if (v) emitState({ lastSync: v as string });
  });
}

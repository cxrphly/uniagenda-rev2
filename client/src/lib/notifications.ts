// ============================================================
// UniAgenda — Notifications Service
// Design: Fresh Academic
// Push notifications for tasks and events
// ============================================================

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      options: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      },
    });
  } else {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      ...options,
    });
  }
}

// ============================================================
// Schedule a notification at a specific time
// ============================================================

const scheduledNotifications = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleNotification(
  id: string,
  title: string,
  body: string,
  scheduledAt: Date
): void {
  // Cancel existing
  cancelNotification(id);

  const delay = scheduledAt.getTime() - Date.now();
  if (delay <= 0) return;

  const timeout = setTimeout(() => {
    showNotification(title, { body });
    scheduledNotifications.delete(id);
  }, delay);

  scheduledNotifications.set(id, timeout);
}

export function cancelNotification(id: string): void {
  const existing = scheduledNotifications.get(id);
  if (existing) {
    clearTimeout(existing);
    scheduledNotifications.delete(id);
  }
}

// ============================================================
// Schedule reminders for tasks and events
// ============================================================

export function scheduleTaskReminder(tarefa: {
  id: string;
  titulo: string;
  prazo?: string | null;
  lembrete: boolean;
  lembrete_minutos?: number;
}): void {
  if (!tarefa.lembrete || !tarefa.prazo) return;

  const prazoDate = new Date(tarefa.prazo);
  const minutos = tarefa.lembrete_minutos || 30;
  const reminderDate = new Date(prazoDate.getTime() - minutos * 60 * 1000);

  scheduleNotification(
    `tarefa-${tarefa.id}`,
    `📋 Tarefa: ${tarefa.titulo}`,
    `Prazo em ${minutos} minutos`,
    reminderDate
  );
}

export function scheduleEventReminder(evento: {
  id: string;
  titulo: string;
  data: string;
  hora?: string | null;
  tipo: string;
  lembrete: boolean;
  lembrete_minutos?: number;
}): void {
  if (!evento.lembrete) return;

  const dateStr = evento.hora
    ? `${evento.data}T${evento.hora}`
    : `${evento.data}T09:00`;

  const eventoDate = new Date(dateStr);
  const minutos = evento.lembrete_minutos || 60;
  const reminderDate = new Date(eventoDate.getTime() - minutos * 60 * 1000);

  const tipoEmoji = {
    prova: '📝',
    trabalho: '📄',
    apresentacao: '🎤',
    outro: '📅',
  }[evento.tipo] || '📅';

  scheduleNotification(
    `evento-${evento.id}`,
    `${tipoEmoji} ${evento.titulo}`,
    `Em ${minutos} minutos`,
    reminderDate
  );
}

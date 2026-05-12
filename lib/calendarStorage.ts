const KEY = 'eficar-calendar';

export type CalendarChannel = 'linkedin' | 'kakao' | 'email' | 'cardnews' | 'etc';
export type CalendarStatus = 'planned' | 'done' | 'cancelled';

export interface CalendarEvent {
  id: string;
  date: string;        // 'YYYY-MM-DD'
  channel: CalendarChannel;
  title: string;
  customer: string;
  status: CalendarStatus;
  note: string;
}

function load(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function save(items: CalendarEvent[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function getCalendarEvents(): CalendarEvent[] { return load(); }

export function getEventsForMonth(yearMonth: string): CalendarEvent[] {
  return load().filter(e => e.date.startsWith(yearMonth));
}

export function addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
  const newEvent: CalendarEvent = { ...event, id: Date.now().toString() };
  save([...load(), newEvent]);
  return newEvent;
}

export function updateCalendarEvent(id: string, patch: Partial<CalendarEvent>) {
  save(load().map(e => e.id === id ? { ...e, ...patch } : e));
}

export function deleteCalendarEvent(id: string) {
  save(load().filter(e => e.id !== id));
}

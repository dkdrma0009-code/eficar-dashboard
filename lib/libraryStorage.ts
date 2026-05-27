import { syncUpsert, syncDelete } from './syncManager';

const KEY = 'eficar-library';

export type LibraryContentType = 'linkedin' | 'kakao' | 'email' | 'card' | 'cardnews' | 'sms';

export interface LibraryItem {
  id: string;
  type: LibraryContentType;
  title: string;
  content: string;
  customer: string;
  tags: string[];
  createdAt: string; // ISO
}

function load(): LibraryItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function save(items: LibraryItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function getLibrary(): LibraryItem[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addLibraryItem(item: Omit<LibraryItem, 'id' | 'createdAt'>): LibraryItem {
  const newItem: LibraryItem = { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
  save([...load(), newItem]);
  syncUpsert('library_items', newItem as unknown as Record<string, unknown>);
  return newItem;
}

export function deleteLibraryItem(id: string) {
  save(load().filter(i => i.id !== id));
  syncDelete('library_items', id);
}

export function updateLibraryItem(id: string, patch: Partial<LibraryItem>) {
  const updated = load().map(i => i.id === id ? { ...i, ...patch } : i);
  save(updated);
  const item = updated.find(i => i.id === id);
  if (item) syncUpsert('library_items', item as unknown as Record<string, unknown>);
}

const KEY = 'eficar-library';

export type LibraryContentType = 'linkedin' | 'kakao' | 'email' | 'card' | 'cardnews';

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
  const newItem: LibraryItem = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() };
  save([...load(), newItem]);
  return newItem;
}

export function deleteLibraryItem(id: string) {
  save(load().filter(i => i.id !== id));
}

export function updateLibraryItem(id: string, patch: Partial<LibraryItem>) {
  save(load().map(i => i.id === id ? { ...i, ...patch } : i));
}

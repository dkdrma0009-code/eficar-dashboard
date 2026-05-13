import { syncUpsert, syncDelete } from './syncManager';

const KEY = 'eficar-campaigns';

export type CampaignChannel = 'linkedin' | 'kakao' | 'email' | 'cardnews' | 'etc';
export type CampaignOutcome = 'sent' | 'responded' | 'meeting' | 'proposal' | 'closed';

export interface CampaignRecord {
  id: string;
  date: string;        // 'YYYY-MM-DD'
  customer: string;
  channel: CampaignChannel;
  contentSummary: string;
  outcome: CampaignOutcome;
  note: string;
  createdAt: string;
  scheduledDate?: string; // 'YYYY-MM-DD' — 예약 발송일
}

function load(): CampaignRecord[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function save(items: CampaignRecord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

function fixDate(date: string): string {
  // Excel 시리얼 숫자(예: "46153.4007") → 'YYYY-MM-DD'
  const num = parseFloat(date);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const ms = Math.round((Math.floor(num) - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  return date;
}

export function getCampaigns(): CampaignRecord[] {
  const raw = load();
  const seen = new Set<string>();
  const fixed = raw.map((r, i) => {
    const id = seen.has(r.id) ? `${r.id}-${i}` : r.id;
    seen.add(id);
    const date = fixDate(r.date);
    return { ...r, id, date };
  });
  if (fixed.some((r, i) => r.id !== raw[i]?.id || r.date !== raw[i]?.date)) save(fixed);
  return fixed.sort((a, b) => b.date.localeCompare(a.date));
}

export function addCampaign(item: Omit<CampaignRecord, 'id' | 'createdAt'>): CampaignRecord {
  const rec: CampaignRecord = { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
  save([...load(), rec]);
  syncUpsert('campaigns', rec as unknown as Record<string, unknown>);
  return rec;
}

export function updateCampaign(id: string, patch: Partial<CampaignRecord>) {
  const updated = load().map(r => r.id === id ? { ...r, ...patch } : r);
  save(updated);
  const rec = updated.find(r => r.id === id);
  if (rec) syncUpsert('campaigns', rec as unknown as Record<string, unknown>);
}

export function deleteCampaign(id: string) {
  save(load().filter(r => r.id !== id));
  syncDelete('campaigns', id);
}

export function isDuplicateCampaign(date: string, contentSummary: string): boolean {
  return load().some(r => r.date === date && r.contentSummary === contentSummary);
}

const CRM_KEY = 'eficar-crm';

export interface ContactPerson {
  name: string;
  phone: string;  // 01012345678 형식
  role?: string;
  email?: string;
}

export interface CRMNote {
  lastContact: string;  // 'YYYY-MM-DD'
  nextMeeting: string;  // 'YYYY-MM-DD'
  memo: string;
  contacts?: ContactPerson[];
}

type CRMData = Record<string, CRMNote>;

function load(): CRMData {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(CRM_KEY) ?? '{}'); }
  catch { return {}; }
}

export function getCRMNote(customer: string): CRMNote {
  return load()[customer] ?? { lastContact: '', nextMeeting: '', memo: '', contacts: [] };
}

export function setCRMNote(customer: string, note: CRMNote): void {
  const data = load();
  data[customer] = note;
  try { localStorage.setItem(CRM_KEY, JSON.stringify(data)); } catch {}
}

export function getAllCRM(): CRMData {
  return load();
}

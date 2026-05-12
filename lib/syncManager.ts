import { supabase } from './supabase';

// localStorage → Supabase 컬럼명 변환
function toRow(record: Record<string, unknown>, table: string) {
  if (table === 'campaigns') {
    return {
      id: record.id,
      date: record.date,
      customer: record.customer,
      channel: record.channel,
      content_summary: record.contentSummary,
      outcome: record.outcome,
      note: record.note,
      created_at: record.createdAt,
    };
  }
  if (table === 'library_items') {
    return {
      id: record.id,
      type: record.type,
      title: record.title,
      content: record.content,
      customer: record.customer,
      tags: record.tags,
      created_at: record.createdAt,
    };
  }
  if (table === 'calendar_events') {
    return {
      id: record.id,
      date: record.date,
      channel: record.channel,
      title: record.title,
      customer: record.customer,
      status: record.status,
      note: record.note,
      created_at: record.createdAt,
    };
  }
  return record;
}

function fromRow(row: Record<string, unknown>, table: string) {
  if (table === 'campaigns') {
    return {
      id: row.id,
      date: row.date,
      customer: row.customer,
      channel: row.channel,
      contentSummary: row.content_summary,
      outcome: row.outcome,
      note: row.note,
      createdAt: row.created_at,
    };
  }
  if (table === 'library_items') {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      customer: row.customer,
      tags: row.tags ?? [],
      createdAt: row.created_at,
    };
  }
  if (table === 'calendar_events') {
    return {
      id: row.id,
      date: row.date,
      channel: row.channel,
      title: row.title,
      customer: row.customer,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
    };
  }
  return row;
}

// 단건 upsert (쓰기 시 호출)
export function syncUpsert(table: string, record: Record<string, unknown>) {
  if (!supabase) return;
  supabase.from(table).upsert(toRow(record, table)).then(({ error }) => {
    if (error) console.warn(`[sync] upsert ${table} failed:`, error.message);
  });
}

// 단건 delete (삭제 시 호출)
export function syncDelete(table: string, id: string) {
  if (!supabase) return;
  supabase.from(table).delete().eq('id', id).then(({ error }) => {
    if (error) console.warn(`[sync] delete ${table} failed:`, error.message);
  });
}

// 앱 시작 시 Supabase → localStorage 전체 동기화
const KEYS: { table: string; lsKey: string }[] = [
  { table: 'campaigns',       lsKey: 'eficar-campaigns' },
  { table: 'library_items',   lsKey: 'eficar-library' },
  { table: 'calendar_events', lsKey: 'eficar-calendar' },
];

export async function pullFromSupabase() {
  if (!supabase || typeof window === 'undefined') return;
  for (const { table, lsKey } of KEYS) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) { console.warn(`[sync] pull ${table} failed:`, error.message); continue; }
    if (data && data.length > 0) {
      localStorage.setItem(lsKey, JSON.stringify(data.map(r => fromRow(r as Record<string, unknown>, table))));
    }
  }

  // goals는 별도 처리
  const { data: goalsData } = await supabase.from('goals').select('*');
  if (goalsData && goalsData.length > 0) {
    const goals: Record<string, number> = {};
    goalsData.forEach((r: Record<string, unknown>) => { goals[r.customer as string] = r.amount as number; });
    localStorage.setItem('eficar-goals', JSON.stringify(goals));
  }
}

// goals upsert/delete
export function syncGoalUpsert(customer: string, amount: number) {
  if (!supabase) return;
  supabase.from('goals').upsert({ customer, amount }).then(({ error }) => {
    if (error) console.warn('[sync] goal upsert failed:', error.message);
  });
}

export function syncGoalDelete(customer: string) {
  if (!supabase) return;
  supabase.from('goals').delete().eq('customer', customer).then(({ error }) => {
    if (error) console.warn('[sync] goal delete failed:', error.message);
  });
}

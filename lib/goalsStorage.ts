import { syncGoalUpsert, syncGoalDelete } from './syncManager';

const GOALS_KEY = 'eficar-goals';

export type Goals = Record<string, number>; // customerName -> monthly target (won)

export function getGoals(): Goals {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) ?? '{}'); }
  catch { return {}; }
}

export function setGoal(customer: string, amount: number) {
  const goals = getGoals();
  if (amount > 0) {
    goals[customer] = amount;
    syncGoalUpsert(customer, amount);
  } else {
    delete goals[customer];
    syncGoalDelete(customer);
  }
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); } catch {}
}

export function getGoal(customer: string): number {
  return getGoals()[customer] ?? 0;
}

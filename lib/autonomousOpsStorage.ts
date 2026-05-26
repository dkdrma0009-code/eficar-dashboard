export interface OpsTask {
  id: string;
  status: 'prepared' | 'done' | 'skipped';
  label: string;
}

export function syncAutoTasks(_stats: unknown[], _activities: unknown[]): OpsTask[] { return []; }
export function generateSignals(_stats: unknown[], _activities: unknown[]): unknown[] { return []; }

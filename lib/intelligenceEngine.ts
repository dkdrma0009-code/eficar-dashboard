export interface StrategicInsight {
  type: 'warning' | 'opportunity' | 'tip';
  icon: string;
  text: string;
  customerName?: string;
}

export interface PriorityRanking {
  customerName: string;
  score: number;
}

export interface HealthFactor {
  label: string;
  contribution: number;
}

export interface HealthScore {
  score: number;
  factors: HealthFactor[];
}

export interface PredictiveAlert {
  severity: 'high' | 'medium' | 'low';
  type: 'churn_risk' | 'growth_opportunity' | 'engagement_drop';
  signals: string[];
  recommendation: string;
}

export function computeStrategicInsights(_stats: unknown[], _activities: unknown[]): StrategicInsight[] { return []; }
export function computePriorityRankings(_stats: unknown[], _activities: unknown[], _campaigns: unknown[]): PriorityRanking[] { return []; }
export function computeHealthScore(_stats: unknown, _activities?: unknown, _campaigns?: unknown): HealthScore {
  return { score: 0, factors: [] };
}
export function computePredictiveAlerts(_stats: unknown[], _activities?: unknown[]): PredictiveAlert[] { return []; }

import type { SalesRecord, TrendState, TrendAnalysis } from './types';

export { TrendState };

export const TREND_CONFIG: Record<TrendState, { label: string; icon: string; bg: string; color: string }> = {
  rapid_growth:     { label: '급성장',   icon: '🚀', bg: '#D1FAE5', color: '#065F46' },
  stable_growth:    { label: '성장',     icon: '📈', bg: '#ECFDF5', color: '#047857' },
  recovering:       { label: '회복중',   icon: '🔄', bg: '#EDE9FE', color: '#5B21B6' },
  temporary_drop:   { label: '일시감소', icon: '📉', bg: '#FEF3C7', color: '#92400E' },
  long_decline:     { label: '장기하락', icon: '⚠️', bg: '#FEE2E2', color: '#991B1B' },
  high_volatility:  { label: '변동성',   icon: '〰️', bg: '#FFF7ED', color: '#C2410C' },
  seasonal_pattern: { label: '계절성',   icon: '🗓️', bg: '#F0F9FF', color: '#0369A1' },
  churn_risk:       { label: '이탈위험', icon: '🔴', bg: '#FEE2E2', color: '#DC2626' },
  stable:           { label: '안정',     icon: '➡️', bg: '#F3F4F6', color: '#6B7280' },
  new_customer:     { label: '신규',     icon: '✨', bg: '#EDE9FE', color: '#5B21B6' },
  dormant:          { label: '거래중단', icon: '⛔', bg: '#F3F4F6', color: '#9CA3AF' },
};

export function buildTrendMap(
  records: SalesRecord[],
  customers: string[],
  allMonths: string[],
  selectedMonth: string,
): Record<string, TrendAnalysis> {
  const map: Record<string, TrendAnalysis> = {};
  const idx = allMonths.indexOf(selectedMonth);
  if (idx < 0) return map;

  for (const customer of customers) {
    const cur = records.filter(r => r.date === selectedMonth && r.service === customer)
      .reduce((s, r) => s + r.amount, 0);
    const prev = idx > 0
      ? records.filter(r => r.date === allMonths[idx - 1] && r.service === customer)
          .reduce((s, r) => s + r.amount, 0)
      : -1;

    let state: TrendState;
    let growthRate = 0;

    if (prev < 0 || (prev === 0 && cur > 0)) {
      state = 'new_customer';
    } else if (cur === 0 && prev > 0) {
      state = 'dormant';
    } else if (cur === 0 && prev === 0) {
      state = 'stable';
    } else {
      growthRate = ((cur - prev) / prev) * 100;
      if (growthRate >= 30)       state = 'rapid_growth';
      else if (growthRate >= 5)   state = 'stable_growth';
      else if (growthRate >= -5)  state = 'stable';
      else if (growthRate >= -20) state = 'temporary_drop';
      else                        state = 'long_decline';
    }

    const description = state === 'new_customer' ? '이번 달 신규 거래'
      : state === 'dormant' ? '전월 대비 매출 없음'
      : `전월 대비 ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`;

    map[customer] = {
      state,
      consecutiveGrowths: growthRate > 0 ? 1 : 0,
      consecutiveDeclines: growthRate < 0 ? 1 : 0,
      movingAvg3: cur,
      movingAvg6: cur,
      volatilityScore: 0,
      seasonalityDetected: false,
      recoveryDetected: false,
      riskScore: state === 'dormant' ? 80 : state === 'long_decline' ? 60 : 0,
      trendDirection: growthRate > 2 ? 'up' : growthRate < -2 ? 'down' : 'flat',
      description,
      monthlyHistory: [],
    };
  }

  return map;
}

export function buildTrendContextNote(
  trendMap: Record<string, TrendAnalysis>,
  customers: string[],
): string {
  const entries = customers.map(c => trendMap[c]).filter(Boolean);
  const churned = entries.filter(e => e.state === 'dormant' || e.state === 'churn_risk');
  const decline = entries.filter(e => e.state === 'long_decline');
  const growth = entries.filter(e => e.state === 'rapid_growth');

  const lines: string[] = [];
  if (churned.length > 0) lines.push(`이탈 위험 고객 ${churned.length}개사`);
  if (decline.length > 0) lines.push(`장기 하락 고객 ${decline.length}개사`);
  if (growth.length > 0)  lines.push(`급성장 고객 ${growth.length}개사`);
  return lines.length > 0 ? `\n트렌드 요약: ${lines.join(', ')}` : '';
}

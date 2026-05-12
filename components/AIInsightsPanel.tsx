'use client';

import { useState } from 'react';
import { Sparkles, Trophy, AlertCircle, Lightbulb, Zap, RefreshCw } from 'lucide-react';
import type { DashboardData } from '@/lib/types';
import { formatMonth } from '@/lib/dataUtils';

interface Insights {
  achievement: string;
  warning: string;
  opportunity: string;
  action: string;
}

const CARDS = [
  { key: 'achievement' as const, label: '핵심 성과', icon: Trophy,       gradient: 'linear-gradient(135deg,#005957,#007A77)', light: '#E6F2F2', color: '#005957' },
  { key: 'warning'     as const, label: '주의 신호', icon: AlertCircle,  gradient: 'linear-gradient(135deg,#F04452,#FF6B6B)', light: '#FFF0F1', color: '#F04452' },
  { key: 'opportunity' as const, label: '성장 기회', icon: Lightbulb,    gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)', light: '#FFFBEB', color: '#D97706' },
  { key: 'action'      as const, label: '액션 제안', icon: Zap,          gradient: 'linear-gradient(135deg,#6366F1,#818CF8)', light: '#EEF2FF', color: '#4F46E5' },
];

interface Props {
  data: DashboardData;
}

export default function AIInsightsPanel({ data }: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastMonth, setLastMonth] = useState('');

  async function runAnalysis() {
    setLoading(true);
    setError('');
    const month = data.latestMonth;
    const prevMonthIdx = data.allMonths.indexOf(month) - 1;
    const prevMonth = prevMonthIdx >= 0 ? data.allMonths[prevMonthIdx] : '';

    const customers = data.customers.map(name => {
      const sales = data.records.filter(r => r.service === name && r.date === month).reduce((s, r) => s + r.amount, 0);
      const prevSales = prevMonth
        ? data.records.filter(r => r.service === name && r.date === prevMonth).reduce((s, r) => s + r.amount, 0)
        : 0;
      const growth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : 0;
      return { name, sales, prevSales, growth };
    }).sort((a, b) => b.sales - a.sales);

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: formatMonth(month), customers }),
      });
      const json = await res.json();
      if (json.error) throw new Error(`${json.error} | RAW: "${String(json.raw ?? '').slice(0, 400)}"`);
      setInsights(json);
      setLastMonth(formatMonth(month));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 분석 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: insights ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#005957,#007A77)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 15, height: 15, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>AI 인사이트</p>
            {lastMonth && <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 1 }}>{lastMonth} 기준 분석</p>}
          </div>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            background: loading ? '#F2F4F6' : 'linear-gradient(135deg,#005957,#007A77)',
            color: loading ? '#8B95A1' : 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.2s' }}>
          {loading
            ? <><span style={{ width: 14, height: 14, border: '2px solid #CBD5E0', borderTopColor: '#8B95A1', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 4 }} />분석 중...</>
            : insights
              ? <><RefreshCw style={{ width: 13, height: 13 }} />재분석</>
              : <><Sparkles style={{ width: 13, height: 13 }} />AI 분석 실행</>
          }
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', fontSize: 12, color: '#DC2626', marginTop: 12 }}>
          {error}
        </div>
      )}

      {/* 결과 카드 */}
      {insights && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {CARDS.map(card => {
            const Icon = card.icon;
            const text = insights[card.key];
            return (
              <div key={card.key} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${card.light}` }}>
                <div style={{ background: card.gradient, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 13, height: 13, color: 'white' }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{card.label}</p>
                </div>
                <div style={{ padding: '12px 14px', background: card.light }}>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: '#374151' }}>{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 빈 상태 */}
      {!insights && !loading && !error && (
        <div style={{ padding: '20px 0 4px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#8B95A1' }}>버튼을 클릭하면 Gemini AI가 이번 달 데이터를 분석합니다</p>
        </div>
      )}
    </div>
  );
}

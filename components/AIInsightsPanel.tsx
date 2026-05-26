'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, AlertCircle, Lightbulb, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import type { DashboardData, TrendAnalysis } from '@/lib/types';
import { formatMonth, getDaysInMonth } from '@/lib/dataUtils';
import { TREND_CONFIG, buildTrendContextNote } from '@/lib/trendIntelligence';

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

// Dormant = had sales last month but zero this month
function computeAnalysisData(data: DashboardData) {
  const month      = data.currentMonth;
  const isLatestMonth = month === data.latestMonth;
  const monthIdx   = data.allMonths.indexOf(month);
  const prevMonth  = monthIdx > 0 ? data.allMonths[monthIdx - 1] : '';
  const prev2Month = monthIdx > 1 ? data.allMonths[monthIdx - 2] : '';

  // MTD: 진행 중인 달이면 오늘 날짜 기준으로 전월 동일 기간 환산
  const todayDay       = isLatestMonth ? new Date().getDate() : 0;
  const daysInPrevMonth = prevMonth ? getDaysInMonth(prevMonth) : 30;

  const customers = data.customers.map(name => {
    const sales = data.records
      .filter(r => r.service === name && r.date === month)
      .reduce((s, r) => s + r.amount, 0);
    const prevSalesFull = prevMonth
      ? data.records.filter(r => r.service === name && r.date === prevMonth).reduce((s, r) => s + r.amount, 0)
      : 0;
    const prev2Sales = prev2Month
      ? data.records.filter(r => r.service === name && r.date === prev2Month).reduce((s, r) => s + r.amount, 0)
      : 0;

    // 성장률 비교는 MTD 환산값 사용 (진행 중인 달)
    const prevSalesForGrowth = (isLatestMonth && todayDay > 0 && daysInPrevMonth > 0)
      ? Math.round(prevSalesFull / daysInPrevMonth * todayDay)
      : prevSalesFull;
    const growth = prevSalesForGrowth > 0 ? ((sales - prevSalesForGrowth) / prevSalesForGrowth) * 100 : 0;

    // 거래 중단 판정은 전월 전체 기준 (prevSalesFull)
    const lastActiveMonth = [...data.allMonths].reverse().find(m =>
      data.records.some(r => r.service === name && r.date === m && r.amount > 0)
    ) ?? null;
    const monthsSinceActive = lastActiveMonth
      ? data.allMonths.indexOf(month) - data.allMonths.indexOf(lastActiveMonth)
      : null;

    return {
      name, sales,
      prevSales: prevSalesFull,      // 거래 중단 감지용 (전월 전체)
      prevSalesMtd: prevSalesForGrowth, // 성장률 비교용 (MTD 환산)
      prev2Sales, growth, lastActiveMonth, monthsSinceActive,
    };
  }).sort((a, b) => b.sales - a.sales);

  // 거래 중단: 전월 전체 기준 (prevSales)
  const dormant     = customers.filter(c => c.sales === 0 && c.prevSales > 0);
  const longDormant = customers.filter(c => c.sales === 0 && c.prevSales === 0 && c.monthsSinceActive !== null && c.monthsSinceActive >= 2);
  // 증감 판단: MTD 환산 성장률 기준
  const declining   = customers.filter(c => c.sales > 0 && c.growth < -20);
  const recovering  = customers.filter(c => c.sales > 0 && c.prevSales === 0 && c.prev2Sales > 0);
  const growing     = customers.filter(c => c.growth > 20 && c.prevSales > 0 && c.sales > 0);

  return { month, customers, dormant, longDormant, declining, recovering, growing, isLatestMonth, todayDay };
}

interface Props {
  data: DashboardData;
  trendMap?: Record<string, TrendAnalysis>;
}

export default function AIInsightsPanel({ data, trendMap }: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [analysedMonth, setAnalysedMonth] = useState('');

  // ── Key observation: reset whenever the selected month changes ──────────────
  const prevMonth = useRef(data.currentMonth);
  useEffect(() => {
    if (prevMonth.current !== data.currentMonth) {
      prevMonth.current = data.currentMonth;
      setInsights(null);
      setAnalysedMonth('');
      setError('');
    }
  }, [data.currentMonth]);

  // Compute context for dormant banner (no API needed)
  const { dormant, longDormant, declining, isLatestMonth: isMtdMonth, todayDay: mtdDay } = computeAnalysisData(data);
  const criticalCount = dormant.length + longDormant.length;

  async function runAnalysis() {
    setLoading(true);
    setError('');

    const { month, customers, dormant: d, longDormant: ld, declining: dec, recovering: rec, growing: grw, isLatestMonth: isCurrent, todayDay } = computeAnalysisData(data);

    const dormantNote = d.length > 0
      ? `\n거래 완전 중단 고객 (이번 달 0원, 전달 거래 있었음): ${d.map(c => c.name).join(', ')}`
      : '';
    const longDormantNote = ld.length > 0
      ? `\n장기 미거래 고객 (2개월 이상 거래 없음): ${ld.map(c => c.name).join(', ')}`
      : '';
    const recoveringNote = rec.length > 0
      ? `\n거래 재개 고객 (전전달 거래 있다가 중단됐다 이달 재개): ${rec.map(c => c.name).join(', ')}`
      : '';
    const growingNote = grw.length > 0
      ? `\n강한 성장 고객: ${grw.map(c => `${c.name}(+${c.growth.toFixed(0)}%)`).join(', ')}`
      : '';
    const decliningNote = dec.length > 0
      ? `\n하락 고객: ${dec.map(c => `${c.name}(${c.growth.toFixed(0)}%)`).join(', ')}`
      : '';
    const mtdNote = isCurrent
      ? `\n[중요] 현재 월은 진행 중입니다 (${todayDay}일 기준). 성장률은 전월 동일 기간(1~${todayDay}일) 대비로 계산되었습니다. 전월 전체와 비교하지 마세요.`
      : '';
    const trendNote = trendMap
      ? buildTrendContextNote(trendMap, data.customers)
      : '';

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: formatMonth(month),
          customers: customers.map(({ name, sales, prevSalesMtd, growth }) => ({ name, sales, prevSales: prevSalesMtd, growth })),
          dormantNames:     d.map(c => c.name),
          longDormantNames: ld.map(c => c.name),
          contextNotes: [dormantNote, longDormantNote, recoveringNote, growingNote, decliningNote, mtdNote, trendNote].filter(Boolean).join(''),
        }),
      });
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(`${json.error} | RAW: "${String(json.raw ?? '').slice(0, 400)}"`);
      setInsights(json);
      setAnalysedMonth(formatMonth(month));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 분석 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (insights || criticalCount > 0) ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#005957,#007A77)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 15, height: 15, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>AI 인사이트</p>
            <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 1 }}>
              {analysedMonth ? `${analysedMonth} 기준 분석` : `${formatMonth(data.currentMonth)} 기준`}
              {isMtdMonth && (
                <span style={{ color: '#005957', fontWeight: 700 }}> · MTD ({mtdDay}일 기준)</span>
              )}
              {analysedMonth && analysedMonth !== formatMonth(data.currentMonth) && (
                <span style={{ color: '#F59E0B', fontWeight: 700 }}> · 월 변경됨 — 재분석 필요</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            background: loading ? '#F2F4F6' : 'linear-gradient(135deg,#005957,#007A77)',
            color: loading ? '#8B95A1' : 'white', border: 'none', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s',
          }}
        >
          {loading
            ? <><span style={{ width: 14, height: 14, border: '2px solid #CBD5E0', borderTopColor: '#8B95A1', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 4 }} />분석 중...</>
            : insights
              ? <><RefreshCw style={{ width: 13, height: 13 }} />재분석</>
              : <><Sparkles style={{ width: 13, height: 13 }} />AI 분석 실행</>
          }
        </button>
      </div>

      {/* ── 거래 중단 경보 (API 없이 즉시 표시) ── */}
      {(dormant.length > 0 || longDormant.length > 0) && (
        <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', border: '1px solid #FECACA' }}>
          <div style={{ padding: '9px 14px', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: '#DC2626', flexShrink: 0 }} />
            <p style={{ fontSize: 12, fontWeight: 800, color: '#DC2626' }}>
              거래 중단 감지 — {criticalCount}개 고객사
            </p>
          </div>
          {dormant.map(c => {
            const trend = trendMap?.[c.name];
            const trendCfg = trend ? TREND_CONFIG[trend.state] : null;
            return (
              <div key={c.name} style={{ padding: '8px 14px', background: '#FFFBFB', borderTop: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{c.name}</span>
                  {trendCfg && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 9999, background: trendCfg.bg, color: trendCfg.color }}>
                      {trendCfg.icon} {trendCfg.label}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#8B95A1' }}>이번 달 거래 없음 — 전달 거래 있었음</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>즉시 대응</span>
              </div>
            );
          })}
          {longDormant.map(c => (
            <div key={c.name} style={{ padding: '8px 14px', background: '#FFFBFB', borderTop: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{c.name}</span>
                <span style={{ fontSize: 11, color: '#8B95A1', marginLeft: 8 }}>2개월 이상 거래 없음</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 100 }}>재활성화 필요</span>
            </div>
          ))}
        </div>
      )}

      {/* ── 단순 감소 요약 ── */}
      {declining.length > 0 && !insights && (
        <div style={{ marginBottom: 14, padding: '9px 14px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📉</span>
          <p style={{ fontSize: 12, color: '#92400E' }}>
            <strong>{declining.map(c => c.name).join(', ')}</strong> — 매출 20% 이상 감소
          </p>
        </div>
      )}

      {/* ── 에러 ── */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', fontSize: 12, color: '#DC2626', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* ── AI 인사이트 카드 ── */}
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

      {/* ── 빈 상태 ── */}
      {!insights && !loading && !error && criticalCount === 0 && declining.length === 0 && (
        <div style={{ padding: '20px 0 4px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#8B95A1' }}>버튼을 클릭하면 Gemini AI가 {formatMonth(data.currentMonth)} 데이터를 분석합니다</p>
        </div>
      )}
      {!insights && !loading && !error && (criticalCount > 0 || declining.length > 0) && (
        <div style={{ paddingTop: 4, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#8B95A1' }}>AI 분석을 실행하면 더 구체적인 대응 방향을 확인할 수 있습니다</p>
        </div>
      )}
    </div>
  );
}

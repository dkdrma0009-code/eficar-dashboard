'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Target, TrendingUp, TrendingDown, Trophy, AlertCircle, ChevronRight } from 'lucide-react';
import { useDashboardData } from '@/lib/DataContext';
import { getGoals, setGoal } from '@/lib/goalsStorage';
import { formatCurrency, formatCurrencyFull, formatPercent, formatMonth, getCustomerGrade, GRADE_CONFIG } from '@/lib/dataUtils';

export default function GoalsPage() {
  const { data } = useDashboardData();
  const [goals, setGoalsState] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => { setGoalsState(getGoals()); }, []);

  const customerStats = useMemo(() => {
    if (!data) return [];
    const month = data.latestMonth;
    const prevMonthIdx = data.allMonths.indexOf(month) - 1;
    const prevMonth = prevMonthIdx >= 0 ? data.allMonths[prevMonthIdx] : '';

    return data.customers.map(name => {
      const sales = data.records.filter(r => r.service === name && r.date === month).reduce((s, r) => s + r.amount, 0);
      const prevSales = prevMonth
        ? data.records.filter(r => r.service === name && r.date === prevMonth).reduce((s, r) => s + r.amount, 0)
        : 0;
      const growth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : 0;
      const goal = goals[name] ?? 0;
      const achievement = goal > 0 ? (sales / goal) * 100 : 0;
      const grade = getCustomerGrade(sales, prevSales, growth);
      return { name, sales, prevSales, growth, goal, achievement, grade };
    }).sort((a, b) => b.sales - a.sales);
  }, [data, goals]);

  const totalGoal = customerStats.reduce((s, c) => s + c.goal, 0);
  const totalSales = customerStats.reduce((s, c) => s + c.sales, 0);
  const withGoals = customerStats.filter(c => c.goal > 0).length;
  const achieved = customerStats.filter(c => c.goal > 0 && c.achievement >= 100).length;
  const overallAch = totalGoal > 0 ? (totalSales / totalGoal) * 100 : 0;

  function handleSave(name: string) {
    const raw = (editing[name] ?? '').replace(/[^0-9]/g, '');
    const val = parseInt(raw, 10) || 0;
    setGoal(name, val);
    setGoalsState(prev => { const next = { ...prev }; if (val > 0) next[name] = val; else delete next[name]; return next; });
    setSaved(prev => ({ ...prev, [name]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [name]: false })), 1800);
  }

  function handleInput(name: string, raw: string) {
    const digits = raw.replace(/[^0-9]/g, '');
    setEditing(prev => ({ ...prev, [name]: digits ? parseInt(digits).toLocaleString() : '' }));
  }

  if (!data) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📂</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>먼저 대시보드에서 데이터를 업로드하세요</h2>
          <a href="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20, textDecoration: 'none' }}>대시보드로 이동</a>
        </div>
      </main>
    );
  }

  const achColor = (r: number) => r >= 100 ? '#005957' : r >= 70 ? '#F59E0B' : '#F04452';

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* 타이틀 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>목표 관리</h1>
          <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>
            {formatMonth(data.latestMonth)} 기준 · 고객사별 목표 설정 및 달성률 추적
          </p>
        </div>

        {/* 요약 카드 4개 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: '전체 목표 달성률', value: totalGoal > 0 ? `${Math.min(overallAch, 999).toFixed(1)}%` : '-', sub: totalGoal > 0 ? `목표 ${formatCurrency(totalGoal)}원` : '목표 미설정', icon: Target, color: achColor(overallAch) },
            { label: '이번 달 총 매출', value: totalSales > 0 ? `${formatCurrency(totalSales)}원` : '-', sub: formatCurrencyFull(totalSales), icon: TrendingUp, color: '#005957' },
            { label: '목표 설정 고객사', value: `${withGoals}개`, sub: `전체 ${customerStats.length}개 중`, icon: Trophy, color: '#007A77' },
            { label: '목표 달성 고객사', value: `${achieved}개`, sub: withGoals > 0 ? `달성률 ${Math.round((achieved / withGoals) * 100)}%` : '-', icon: Trophy, color: '#005957' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 14, height: 14, color: '#005957' }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600 }}>{card.label}</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</p>
                <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 4 }}>{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* 전체 진행 바 */}
        {totalGoal > 0 && (
          <div className="card" style={{ marginBottom: 20, padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>전체 달성률</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: achColor(overallAch) }}>{Math.min(overallAch, 999).toFixed(1)}%</span>
            </div>
            <div style={{ height: 14, background: '#F2F4F6', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{ height: 14, borderRadius: 7, width: `${Math.min(overallAch, 100)}%`, background: `linear-gradient(90deg, ${achColor(overallAch)}, ${achColor(overallAch)}CC)`, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#8B95A1' }}>실적 {formatCurrencyFull(totalSales)}</span>
              <span style={{ fontSize: 12, color: '#8B95A1' }}>목표 {formatCurrencyFull(totalGoal)}</span>
            </div>
          </div>
        )}

        {/* 고객사 목표 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {customerStats.map(c => {
            const cfg = GRADE_CONFIG[c.grade];
            const editVal = editing[c.name] ?? (c.goal > 0 ? c.goal.toLocaleString() : '');
            const color = achColor(c.achievement);
            const hasGoal = c.goal > 0;

            return (
              <div key={c.name} className="card" style={{ padding: '18px 20px' }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: 10, flexShrink: 0 }}>{cfg.label}</span>
                  </div>
                  <Link href={`/customers/${encodeURIComponent(c.name)}`}
                    style={{ display: 'flex', alignItems: 'center', color: '#8B95A1', flexShrink: 0 }}>
                    <ChevronRight style={{ width: 16, height: 16 }} />
                  </Link>
                </div>

                {/* 이번 달 매출 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#8B95A1' }}>이번 달 매출</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>
                      {c.sales > 0 ? `${formatCurrency(c.sales)}원` : '-'}
                    </p>
                  </div>
                  {c.prevSales > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20,
                      background: c.growth >= 0 ? '#E6F2F2' : '#FFF0F1',
                      color: c.growth >= 0 ? '#005957' : '#F04452', fontSize: 12, fontWeight: 700 }}>
                      {c.growth >= 0
                        ? <TrendingUp style={{ width: 12, height: 12 }} />
                        : <TrendingDown style={{ width: 12, height: 12 }} />}
                      {formatPercent(c.growth)}
                    </div>
                  )}
                </div>

                {/* 목표 달성률 바 */}
                {hasGoal && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#8B95A1' }}>목표 달성률</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{Math.min(c.achievement, 999).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: 8, borderRadius: 4, width: `${Math.min(c.achievement, 100)}%`, background: color, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#8B95A1' }}>달성 {formatCurrency(c.sales)}원</span>
                      <span style={{ fontSize: 10, color: '#8B95A1' }}>목표 {formatCurrency(c.goal)}원</span>
                    </div>
                  </div>
                )}

                {/* 상태 뱃지 */}
                {hasGoal && c.achievement >= 100 && (
                  <div style={{ marginBottom: 12, padding: '6px 10px', background: '#E6F2F2', borderRadius: 6, fontSize: 12, color: '#005957', fontWeight: 700, textAlign: 'center' }}>
                    🎉 목표 달성!
                  </div>
                )}
                {hasGoal && c.achievement > 0 && c.achievement < 70 && c.sales > 0 && (
                  <div style={{ marginBottom: 12, padding: '6px 10px', background: '#FFF0F1', borderRadius: 6, fontSize: 11, color: '#F04452', fontWeight: 600 }}>
                    <AlertCircle style={{ width: 11, height: 11, display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    {formatCurrency(c.goal - c.sales)}원 부족
                  </div>
                )}

                {/* 목표 입력 */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={editVal}
                    onChange={e => handleInput(c.name, e.target.value)}
                    placeholder="목표 금액 (원)"
                    style={{ flex: 1, padding: '7px 10px', border: '1px solid #F2F4F6', borderRadius: 7, fontSize: 12, color: '#191F28', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={() => handleSave(c.name)}
                    style={{ padding: '7px 12px', background: saved[c.name] ? '#005957' : '#191F28', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}>
                    {saved[c.name] ? '✓ 저장됨' : '저장'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

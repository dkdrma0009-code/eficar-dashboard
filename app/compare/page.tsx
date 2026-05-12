'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { useDashboardData } from '@/lib/DataContext';
import {
  getCustomerMonthlyData, formatCurrency, formatCurrencyFull, formatPercent,
  formatMonth, formatAxisMonth, GRADE_CONFIG, getCustomerGrade,
} from '@/lib/dataUtils';

const SAVINGS_RATE = 0.30;
const COLOR_A = '#005957';
const COLOR_B = '#3B82F6';

function computeStats(monthly: { month: string; sales: number }[]) {
  const totalSales = monthly.reduce((s, d) => s + d.sales, 0);
  const activeMonths = monthly.filter(d => d.sales > 0).length;
  const maxEntry = monthly.reduce((a, b) => (a.sales >= b.sales ? a : b), { month: '', sales: 0 });
  const savings = Math.round(totalSales * SAVINGS_RATE);
  const validPairs = monthly.slice(1).filter((_, i) => monthly[i].sales > 0);
  const avgGrowth = validPairs.length > 0
    ? validPairs.reduce((s, d, i) => {
        const prev = monthly[i].sales;
        return prev > 0 ? s + (d.sales - prev) / prev * 100 : s;
      }, 0) / validPairs.length
    : 0;
  const avgMonthlySales = activeMonths > 0 ? totalSales / activeMonths : 0;
  return { totalSales, activeMonths, maxEntry, savings, avgGrowth, avgMonthlySales };
}

export default function ComparePage() {
  const { data } = useDashboardData();
  const [customerA, setCustomerA] = useState('');
  const [customerB, setCustomerB] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const allMonths = data?.allMonths ?? [];
  const customers = data?.customers ?? [];

  const cA = customerA || customers[0] || '';
  const cB = customerB || (customers[1] ?? customers[0] ?? '');
  const rStart = rangeStart || allMonths[0] || '';
  const rEnd = rangeEnd || allMonths[allMonths.length - 1] || '';

  const filteredMonths = allMonths.filter(m => m >= rStart && m <= rEnd);

  const monthlyA = data ? getCustomerMonthlyData(data.records, cA, filteredMonths) : [];
  const monthlyB = data ? getCustomerMonthlyData(data.records, cB, filteredMonths) : [];

  const statsA = useMemo(() => computeStats(monthlyA), [monthlyA]);
  const statsB = useMemo(() => computeStats(monthlyB), [monthlyB]);

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

  const chartData = filteredMonths.map((month, i) => ({
    month,
    a: monthlyA[i]?.sales ?? 0,
    b: monthlyB[i]?.sales ?? 0,
  }));

  // Grade based on last two months in range
  const lastA = monthlyA[monthlyA.length - 1];
  const prevA = monthlyA[monthlyA.length - 2];
  const lastB = monthlyB[monthlyB.length - 1];
  const prevB = monthlyB[monthlyB.length - 2];
  const growA = prevA?.sales ? ((lastA?.sales ?? 0) - prevA.sales) / prevA.sales * 100 : 0;
  const growB = prevB?.sales ? ((lastB?.sales ?? 0) - prevB.sales) / prevB.sales * 100 : 0;
  const gradeA = getCustomerGrade(lastA?.sales ?? 0, prevA?.sales ?? 0, growA);
  const gradeB = getCustomerGrade(lastB?.sales ?? 0, prevB?.sales ?? 0, growB);

  const metrics = [
    {
      label: '기간 누적 공급액',
      a: statsA.totalSales > 0 ? formatCurrencyFull(statsA.totalSales) : '-',
      b: statsB.totalSales > 0 ? formatCurrencyFull(statsB.totalSales) : '-',
      winner: statsA.totalSales >= statsB.totalSales ? 'a' : 'b',
    },
    {
      label: '월 평균 공급액',
      a: statsA.avgMonthlySales > 0 ? `${formatCurrency(statsA.avgMonthlySales)}원` : '-',
      b: statsB.avgMonthlySales > 0 ? `${formatCurrency(statsB.avgMonthlySales)}원` : '-',
      winner: statsA.avgMonthlySales >= statsB.avgMonthlySales ? 'a' : 'b',
    },
    {
      label: 'OEM 대비 절감액',
      a: statsA.savings > 0 ? formatCurrencyFull(statsA.savings) : '-',
      b: statsB.savings > 0 ? formatCurrencyFull(statsB.savings) : '-',
      winner: statsA.savings >= statsB.savings ? 'a' : 'b',
    },
    {
      label: '활성 거래 월 수',
      a: `${statsA.activeMonths}개월`,
      b: `${statsB.activeMonths}개월`,
      winner: statsA.activeMonths >= statsB.activeMonths ? 'a' : 'b',
    },
    {
      label: '평균 성장률',
      a: `${statsA.avgGrowth >= 0 ? '+' : ''}${statsA.avgGrowth.toFixed(1)}%`,
      b: `${statsB.avgGrowth >= 0 ? '+' : ''}${statsB.avgGrowth.toFixed(1)}%`,
      winner: statsA.avgGrowth >= statsB.avgGrowth ? 'a' : 'b',
    },
    {
      label: '최고 매출 월',
      a: statsA.maxEntry.month ? `${formatMonth(statsA.maxEntry.month)} (${formatCurrency(statsA.maxEntry.sales)}원)` : '-',
      b: statsB.maxEntry.month ? `${formatMonth(statsB.maxEntry.month)} (${formatCurrency(statsB.maxEntry.sales)}원)` : '-',
      winner: statsA.maxEntry.sales >= statsB.maxEntry.sales ? 'a' : 'b',
    },
  ];

  // Bar chart data for total comparison
  const barData = [
    { label: '누적 공급액', a: statsA.totalSales, b: statsB.totalSales },
    { label: '월 평균', a: statsA.avgMonthlySales, b: statsB.avgMonthlySales },
    { label: '절감액(추정)', a: statsA.savings, b: statsB.savings },
  ];

  const winsA = metrics.filter(m => m.winner === 'a').length;
  const winsB = metrics.filter(m => m.winner === 'b').length;

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>고객사 비교 분석</h1>
          <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>두 고객사의 공급 실적을 기간별로 비교합니다</p>
        </div>

        {/* 설정 바 */}
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR_A, marginBottom: 6 }}>고객사 A</p>
              <select value={cA} onChange={e => setCustomerA(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `2px solid ${COLOR_A}`, borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', cursor: 'pointer', background: 'white' }}>
                {data.customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR_B, marginBottom: 6 }}>고객사 B</p>
              <select value={cB} onChange={e => setCustomerB(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `2px solid ${COLOR_B}`, borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', cursor: 'pointer', background: 'white' }}>
                {data.customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>시작 월</p>
              <select value={rStart} onChange={e => setRangeStart(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', cursor: 'pointer', background: 'white' }}>
                {data.allMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>종료 월</p>
              <select value={rEnd} onChange={e => setRangeEnd(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', cursor: 'pointer', background: 'white' }}>
                {[...data.allMonths].reverse().map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 고객사 헤더 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'A', customer: cA, color: COLOR_A, stats: statsA, grade: gradeA, wins: winsA },
            { label: 'B', customer: cB, color: COLOR_B, stats: statsB, grade: gradeB, wins: winsB },
          ].map(side => {
            const gradeConfig = GRADE_CONFIG[side.grade];
            return (
              <div key={side.label} className="card" style={{ padding: '20px', borderTop: `3px solid ${side.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: side.color, color: 'white', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {side.label}
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#191F28' }}>{side.customer}</p>
                      <span className="badge" style={{ background: gradeConfig.bg, color: gradeConfig.color, fontSize: 11 }}>{gradeConfig.label}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: '#8B95A1' }}>우위 지표</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: side.color }}>{side.wins}/{metrics.length}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: '누적 공급', value: side.stats.totalSales > 0 ? `${formatCurrency(side.stats.totalSales)}원` : '-' },
                    { label: '절감액', value: side.stats.savings > 0 ? `${formatCurrency(side.stats.savings)}원` : '-' },
                    { label: '평균 성장률', value: `${side.stats.avgGrowth >= 0 ? '+' : ''}${side.stats.avgGrowth.toFixed(1)}%` },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: '#F8F9FA', borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 10, color: '#8B95A1' }}>{kpi.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginTop: 2 }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 추이 차트 + 막대 비교 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* 월별 추이 라인차트 */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28', marginBottom: 4 }}>월별 공급 추이 비교</h3>
            <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 16 }}>{formatMonth(rStart)} ~ {formatMonth(rEnd)}</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
                <XAxis dataKey="month" tickFormatter={formatAxisMonth} tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false} interval={Math.max(0, Math.ceil(filteredMonths.length / 10) - 1)} />
                <YAxis tickFormatter={v => formatCurrency(v as number)} tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  formatter={(v: number, key: string) => [formatCurrencyFull(v), key === 'a' ? cA : cB]}
                  labelFormatter={(l: string) => formatMonth(l)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #F2F4F6', fontSize: 12 }}
                />
                <Legend formatter={(value: string) => value === 'a' ? cA : cB} />
                <Line type="monotone" dataKey="a" stroke={COLOR_A} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="b" stroke={COLOR_B} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 막대 비교 */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>주요 지표 비교</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" horizontal={false} />
                <XAxis type="number" tickFormatter={v => formatCurrency(v as number)} tick={{ fontSize: 10, fill: '#8B95A1' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  formatter={(v: number, key: string) => [formatCurrencyFull(v), key === 'a' ? cA : cB]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #F2F4F6', fontSize: 12 }}
                />
                <Bar dataKey="a" name="a" fill={COLOR_A} radius={[0, 4, 4, 0]} barSize={18} />
                <Bar dataKey="b" name="b" fill={COLOR_B} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상세 지표 비교 테이블 */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F2F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>상세 지표 비교</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8F9FA' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, color: '#8B95A1', fontSize: 12, width: '30%' }}>지표</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 700, color: COLOR_A, fontSize: 12, width: '35%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_A }} />
                    {cA}
                  </div>
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 700, color: COLOR_B, fontSize: 12, width: '35%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_B }} />
                    {cB}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: '1px solid #F2F4F6', background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ padding: '14px 20px', color: '#8B95A1', fontWeight: 500 }}>{row.label}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ fontWeight: row.winner === 'a' ? 800 : 500, color: row.winner === 'a' ? COLOR_A : '#191F28', background: row.winner === 'a' ? '#E6F2F2' : 'transparent', padding: row.winner === 'a' ? '4px 10px' : '4px 10px', borderRadius: 6 }}>
                      {row.winner === 'a' && '▲ '}
                      {row.a}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ fontWeight: row.winner === 'b' ? 800 : 500, color: row.winner === 'b' ? COLOR_B : '#191F28', background: row.winner === 'b' ? '#EFF6FF' : 'transparent', padding: '4px 10px', borderRadius: 6 }}>
                      {row.winner === 'b' && '▲ '}
                      {row.b}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}

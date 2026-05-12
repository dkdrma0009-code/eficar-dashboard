'use client';

import { useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
} from 'recharts';
import type { DashboardData } from '@/lib/types';
import {
  getCustomerMonthlyData, getCustomerTopItems, getCustomerPartTypeData,
  formatCurrency, formatCurrencyFull, formatPercent, formatAxisMonth, formatMonth,
  CHART_COLORS, PIE_COLORS, GRADE_CONFIG,
} from '@/lib/dataUtils';
import { computeViewData } from '@/lib/dataUtils';

interface Props {
  customerName: string;
  data: DashboardData;
  selectedMonth: string;
  onClose: () => void;
  onReport?: () => void;
}

type Tab = 'trend' | 'items' | 'parttype';

const TABS: { key: Tab; label: string }[] = [
  { key: 'trend',    label: '월별 매출' },
  { key: 'items',    label: '품목 Top 5' },
  { key: 'parttype', label: '부품 유형' },
];

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="card" style={{ padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 2 }}>{p.name}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>{formatCurrencyFull(p.value)}</p>
    </div>
  );
};

export default function CustomerModal({ customerName, data, selectedMonth, onClose, onReport }: Props) {
  const [tab, setTab] = useState<Tab>('trend');
  const { records, allMonths, customers } = data;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const monthlyData = getCustomerMonthlyData(records, customerName, allMonths);
  const topItems = getCustomerTopItems(records, customerName, selectedMonth, 5);
  const partTypeData = getCustomerPartTypeData(records, customerName, selectedMonth);

  const selectedLabel = formatAxisMonth(selectedMonth);
  const chartData = monthlyData.map(d => ({ ...d, month: formatAxisMonth(d.month) }));

  const currentSales = monthlyData.find(d => d.month === selectedMonth)?.sales ?? 0;
  const prevMonthKey = (() => { const idx = allMonths.indexOf(selectedMonth); return idx > 0 ? allMonths[idx - 1] : ''; })();
  const prevSales = monthlyData.find(d => d.month === prevMonthKey)?.sales ?? 0;
  const growth = prevSales === 0 ? 0 : ((currentSales - prevSales) / prevSales) * 100;
  const totalSales = monthlyData.reduce((s, d) => s + d.sales, 0);

  const viewData = computeViewData(records, selectedMonth, customers, data.latestMonth);
  const stats = viewData.customerStats.find(c => c.name === customerName);
  const grade = stats ? GRADE_CONFIG[stats.grade] : null;
  const color = CHART_COLORS[customers.indexOf(customerName) % CHART_COLORS.length] || '#005957';

  const ptTotal = partTypeData.reduce((s, p) => s + p.value, 0);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 600,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
      }} className="animate-slide-up">

        {/* 헤더 */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F2F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {grade && <span className="badge" style={{ background: grade.bg, color: grade.color }}>{grade.label}</span>}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{customerName}</h2>
                <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>{formatMonth(selectedMonth)} 기준</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F4F6', border: 'none', cursor: 'pointer' }}>
              <X style={{ width: 16, height: 16, color: '#8B95A1' }} />
            </button>
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
            {[
              { label: `${formatMonth(selectedMonth)} 매출`, value: currentSales > 0 ? formatCurrencyFull(currentSales) : '-', color: '#191F28' },
              { label: '전월 대비', value: prevSales > 0 ? formatPercent(growth) : '-', color: prevSales > 0 ? (growth >= 0 ? '#00B386' : '#F04452') : '#191F28' },
              { label: '누적 매출', value: formatCurrencyFull(totalSales), color: '#191F28' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 1, marginTop: 16, background: '#F2F4F6', borderRadius: 10, padding: 3 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? '#005957' : '#8B95A1',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 바디 (스크롤) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* 탭 1: 월별 매출 바차트 */}
          {tab === 'trend' && (
            <div className="animate-fade-in">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false}
                      interval={chartData.length > 12 ? Math.ceil(chartData.length / 12) - 1 : 0} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false}
                      tickFormatter={v => formatCurrency(v)} width={56} />
                    <Tooltip formatter={(v: number) => [formatCurrencyFull(v), '매출']} />
                    <Bar dataKey="sales" radius={[5, 5, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.month === selectedLabel ? '#005957' : '#E6F2F2'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#005957' }} />
                  <span style={{ fontSize: 12, color: '#8B95A1' }}>선택 월</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#E6F2F2' }} />
                  <span style={{ fontSize: 12, color: '#8B95A1' }}>기타 월</span>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: 품목 Top 5 */}
          {tab === 'items' && (
            <div className="animate-fade-in">
              {topItems.length === 0 ? (
                <p style={{ color: '#8B95A1', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>해당 월 데이터 없음</p>
              ) : topItems.map((item, i) => {
                const pct = parseFloat(item.percent);
                const rankColors = ['#005957', '#00B386', '#3B82F6', '#F59E0B', '#8B5CF6'];
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: rankColors[i] ?? '#8B95A1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {item.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                          <span style={{ fontSize: 12, color: '#8B95A1' }}>{item.percent}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{formatCurrency(item.value)}원</span>
                        </div>
                      </div>
                      <div style={{ width: '100%', background: '#F2F4F6', borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, background: rankColors[i] ?? '#8B95A1', height: 6, borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 탭 3: 부품 유형 도넛 */}
          {tab === 'parttype' && (
            <div className="animate-fade-in">
              {partTypeData.length === 0 ? (
                <p style={{ color: '#8B95A1', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>해당 월 데이터 없음</p>
              ) : (
                <>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={partTypeData} cx="50%" cy="50%"
                          innerRadius="38%" outerRadius="68%"
                          paddingAngle={2} dataKey="value">
                          {partTypeData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<DonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {partTypeData.map((pt, i) => (
                      <div key={pt.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ fontSize: 13, color: '#8B95A1', flex: 1 }}>{pt.name}</span>
                        <span style={{ fontSize: 12, color: '#8B95A1' }}>
                          {ptTotal > 0 ? `${((pt.value / ptTotal) * 100).toFixed(1)}%` : '0%'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{formatCurrency(pt.value)}원</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 하단 sticky 버튼 */}
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #F2F4F6', flexShrink: 0 }}>
          <button
            onClick={onReport}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          >
            <FileText style={{ width: 16, height: 16 }} />
            이 고객사 리포트 PDF 생성
          </button>
        </div>
      </div>
    </div>
  );
}

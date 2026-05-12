'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import type { ViewData, CustomerStats, CustomerGrade } from '@/lib/types';
import { formatCurrency, formatCurrencyFull, formatPercent, formatMonth, GRADE_CONFIG } from '@/lib/dataUtils';
import { getGoals, type Goals } from '@/lib/goalsStorage';

interface Props {
  viewData: ViewData;
  onSelectCustomer: (name: string) => void;
  gradeFilter?: CustomerGrade | 'all';
}

type SortKey = keyof Pick<CustomerStats,
  'name' | 'currentMonthSales' | 'prevMonthSales' | 'growthRate' | 'totalSales' | 'transactionCount'
>;

const GRADE_FILTERS: { key: CustomerGrade | 'all'; label: string }[] = [
  { key: 'all',     label: '전체' },
  { key: 'vip',     label: '🏆 VIP' },
  { key: 'normal',  label: '✅ 일반' },
  { key: 'warning', label: '⚠️ 주의' },
  { key: 'danger',  label: '🚨 위험' },
  { key: 'new',     label: '🆕 신규' },
];

export default function CustomerTable({ viewData, onSelectCustomer, gradeFilter: externalFilter }: Props) {
  const { customerStats, selectedMonth, prevMonth } = viewData;
  const [sortKey, setSortKey] = useState<SortKey>('currentMonthSales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [internalFilter, setInternalFilter] = useState<CustomerGrade | 'all'>('all');
  const [goals, setGoals] = useState<Goals>({});

  useEffect(() => { setGoals(getGoals()); }, []);

  const activeFilter = externalFilter ?? internalFilter;
  const hasGoals = Object.keys(goals).length > 0;

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = activeFilter === 'all'
    ? customerStats
    : customerStats.filter(c => c.grade === activeFilter);

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1" style={{ color: '#CBD5E0' }} />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 inline ml-1" style={{ color: '#005957' }} />
      : <ChevronUp className="w-3 h-3 inline ml-1" style={{ color: '#005957' }} />;
  }

  const cols: { key: SortKey; label: string; align: string }[] = [
    { key: 'name',               label: '고객사명',                         align: 'left' },
    { key: 'currentMonthSales',  label: `${formatMonth(selectedMonth)} 매출`, align: 'right' },
    { key: 'prevMonthSales',     label: `${formatMonth(prevMonth)} 매출`,     align: 'right' },
    { key: 'growthRate',         label: '증감률',                           align: 'center' },
    { key: 'totalSales',         label: '누적 매출',                        align: 'right' },
    { key: 'transactionCount',   label: '거래건수',                         align: 'right' },
  ];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191F28' }}>고객사별 매출 현황</h2>
            <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>
              {formatMonth(selectedMonth)} 기준 · 행 클릭 시 드릴다운 · ↗ 아이콘으로 상세 페이지
            </p>
          </div>
          <span className="badge" style={{ background: '#E6F2F2', color: '#005957' }}>
            {sorted.length}개사
          </span>
        </div>

        {/* 등급 필터 */}
        {!externalFilter && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GRADE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setInternalFilter(f.key)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: activeFilter === f.key ? '#005957' : 'white',
                  color: activeFilter === f.key ? 'white' : '#8B95A1',
                  border: activeFilter === f.key ? 'none' : '1px solid #F2F4F6',
                }}
              >
                {f.label}
              </button>
            ))}
            {hasGoals && (
              <span style={{ fontSize: 11, color: '#005957', padding: '4px 10px', background: '#E6F2F2', borderRadius: 9999, fontWeight: 600 }}>
                목표 설정됨 {Object.keys(goals).length}개사
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table w-full">
          <thead>
            <tr>
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ textAlign: col.align as React.CSSProperties['textAlign'], cursor: 'pointer', userSelect: 'none' }}
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#8B95A1' }}>
                  해당 등급의 고객사가 없습니다
                </td>
              </tr>
            ) : sorted.map(row => {
              const grade = GRADE_CONFIG[row.grade];
              const goal = goals[row.name] ?? 0;
              const achRate = goal > 0 ? Math.min((row.currentMonthSales / goal) * 100, 100) : 0;
              const achColor = achRate >= 100 ? '#005957' : achRate >= 70 ? '#F59E0B' : '#F04452';

              return (
                <tr key={row.name} onClick={() => onSelectCustomer(row.name)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge" style={{ background: grade.bg, color: grade.color, fontSize: 11 }}>
                        {grade.label}
                      </span>
                      <span style={{ fontWeight: 600, color: '#191F28' }}>{row.name}</span>
                      <Link
                        href={`/customers/${encodeURIComponent(row.name)}`}
                        onClick={e => e.stopPropagation()}
                        style={{ color: '#8B95A1', display: 'flex', alignItems: 'center', marginLeft: 2 }}
                        title="상세 페이지"
                      >
                        <ExternalLink style={{ width: 12, height: 12 }} />
                      </Link>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#191F28' }}>
                    {row.currentMonthSales > 0 ? (
                      <div>
                        <span title={formatCurrencyFull(row.currentMonthSales)}>{formatCurrency(row.currentMonthSales)}원</span>
                        {goal > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ height: 4, background: '#F2F4F6', borderRadius: 9999, width: 80, marginLeft: 'auto' }}>
                              <div style={{ height: 4, width: `${achRate}%`, background: achColor, borderRadius: 9999 }} />
                            </div>
                            <p style={{ fontSize: 10, color: achColor, textAlign: 'right', marginTop: 2, fontWeight: 700 }}>
                              {((row.currentMonthSales / goal) * 100).toFixed(0)}%
                            </p>
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: '#CBD5E0' }}>-</span>}
                  </td>
                  <td style={{ textAlign: 'right', color: '#8B95A1' }}>
                    {row.prevMonthSales > 0
                      ? <span title={formatCurrencyFull(row.prevMonthSales)}>{formatCurrency(row.prevMonthSales)}원</span>
                      : <span style={{ color: '#CBD5E0' }}>-</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {(row.prevMonthSales > 0 || row.currentMonthSales > 0) ? (
                      <span className="badge" style={{
                        background: row.growthRate >= 0 ? '#E6FAF5' : '#FFF0F1',
                        color: row.growthRate >= 0 ? '#00B386' : '#F04452',
                      }}>
                        {row.growthRate >= 0 ? '▲' : '▼'} {Math.abs(row.growthRate).toFixed(1)}%
                      </span>
                    ) : <span style={{ color: '#CBD5E0', fontSize: 12 }}>-</span>}
                  </td>
                  <td style={{ textAlign: 'right', color: '#191F28' }}>
                    <span title={formatCurrencyFull(row.totalSales)}>
                      {formatCurrency(row.totalSales)}원
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#8B95A1' }}>
                    {row.transactionCount > 0 ? `${row.transactionCount.toLocaleString()}건` : <span style={{ color: '#CBD5E0' }}>-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

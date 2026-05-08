'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import type { ViewData, CustomerStats } from '@/lib/types';
import { formatCurrency, formatCurrencyFull, formatPercent, formatMonth, RISK_THRESHOLD_PCT } from '@/lib/dataUtils';

interface Props {
  viewData: ViewData;
  onSelectCustomer: (name: string) => void;
}

type SortKey = keyof Pick<CustomerStats,
  'name' | 'currentMonthSales' | 'prevMonthSales' | 'growthRate' | 'totalSales' | 'transactionCount'
>;

function GrowthBadge({ value, prevSales }: { value: number; prevSales: number }) {
  const isRisk = prevSales > 0 && value <= -RISK_THRESHOLD_PCT;
  if (isRisk) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3" />
        {formatPercent(value)}
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <ChevronUp className="w-3 h-3" />
        {formatPercent(value)}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500">
        <ChevronDown className="w-3 h-3" />
        {formatPercent(value)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      {formatPercent(value)}
    </span>
  );
}

export default function CustomerTable({ viewData, onSelectCustomer }: Props) {
  const { customerStats, selectedMonth, prevMonth } = viewData;
  const [sortKey, setSortKey] = useState<SortKey>('currentMonthSales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...customerStats].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 inline ml-1" style={{ color: '#1D9E75' }} />
      : <ChevronUp className="w-3 h-3 inline ml-1" style={{ color: '#1D9E75' }} />;
  }

  const cols: { key: SortKey; label: string; align: string }[] = [
    { key: 'name', label: '고객사명', align: 'left' },
    { key: 'currentMonthSales', label: `${formatMonth(selectedMonth)} 매출`, align: 'right' },
    { key: 'prevMonthSales', label: `${formatMonth(prevMonth)} 매출`, align: 'right' },
    { key: 'growthRate', label: '증감률', align: 'center' },
    { key: 'totalSales', label: '누적 매출', align: 'right' },
    { key: 'transactionCount', label: '거래건수', align: 'right' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">고객사별 매출 현황</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatMonth(selectedMonth)} 기준 · 행 클릭 시 상세 드릴다운 · 헤더 클릭 시 정렬
        </p>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap text-${col.align}`}
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(row => (
              <tr
                key={row.name}
                onClick={() => onSelectCustomer(row.name)}
                className="hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  <span className="group-hover:text-green-700 group-hover:underline transition-colors">
                    {row.name}
                  </span>
                  {row.prevMonthSales > 0 && row.growthRate <= -RISK_THRESHOLD_PCT && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1.5" />
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {row.currentMonthSales > 0 ? (
                    <span
                      className="font-semibold text-gray-800 tabular-nums"
                      title={formatCurrencyFull(row.currentMonthSales)}
                    >
                      {formatCurrency(row.currentMonthSales)}원
                    </span>
                  ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap tabular-nums">
                  {row.prevMonthSales > 0
                    ? <span title={formatCurrencyFull(row.prevMonthSales)}>{formatCurrency(row.prevMonthSales)}원</span>
                    : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.prevMonthSales > 0 || row.currentMonthSales > 0
                    ? <GrowthBadge value={row.growthRate} prevSales={row.prevMonthSales} />
                    : <span className="text-gray-300 text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap tabular-nums">
                  <span title={formatCurrencyFull(row.totalSales)}>
                    {formatCurrency(row.totalSales)}원
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                  {row.transactionCount > 0 ? `${row.transactionCount.toLocaleString()}건` : <span className="text-gray-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-400">총 {sorted.length}개 고객사</p>
        <p className="text-xs text-gray-400">
          ⚠️ 전월 대비 -{RISK_THRESHOLD_PCT}% 이상 하락 시 경고
        </p>
      </div>
    </div>
  );
}

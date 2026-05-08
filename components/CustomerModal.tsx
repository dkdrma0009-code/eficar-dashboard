'use client';

import { useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import type { DashboardData } from '@/lib/types';
import {
  getCustomerMonthlyData, getCustomerTopItems, getCustomerPartTypeData,
  formatCurrency, formatCurrencyFull, formatPercent, formatAxisMonth, formatMonth,
  CHART_COLORS, PIE_COLORS,
} from '@/lib/dataUtils';

interface Props {
  customerName: string;
  data: DashboardData;
  selectedMonth: string;
  onClose: () => void;
}

function SalesAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-800">{formatCurrencyFull(payload[0].value)}</p>
    </div>
  );
}

export default function CustomerModal({ customerName, data, selectedMonth, onClose }: Props) {
  const { records, allMonths } = data;

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

  const chartData = monthlyData.map(d => ({ ...d, month: formatAxisMonth(d.month) }));
  const selectedLabel = formatAxisMonth(selectedMonth);

  const currentData = monthlyData.find(d => d.month === selectedMonth);
  const prevMonthKey = (() => {
    const idx = allMonths.indexOf(selectedMonth);
    return idx > 0 ? allMonths[idx - 1] : '';
  })();
  const prevData = monthlyData.find(d => d.month === prevMonthKey);
  const currentSales = currentData?.sales ?? 0;
  const prevSales = prevData?.sales ?? 0;
  const growth = prevSales === 0 ? 0 : ((currentSales - prevSales) / prevSales) * 100;
  const totalSales = monthlyData.reduce((s, d) => s + d.sales, 0);
  const peakMonth = monthlyData.reduce((a, b) => (a.sales > b.sales ? a : b), monthlyData[0]);

  const colorIdx = data.customers.indexOf(customerName);
  const color = CHART_COLORS[colorIdx % CHART_COLORS.length] || '#1D9E75';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">

        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{customerName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatMonth(selectedMonth)} 기준 상세 현황</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* KPI 요약 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: `${formatMonth(selectedMonth)} 매출`,
                value: currentSales > 0 ? formatCurrencyFull(currentSales) : '-',
              },
              {
                label: '전월 대비',
                value: prevSales > 0 ? formatPercent(growth) : '-',
                valueColor: prevSales > 0 ? (growth >= 0 ? '#1D9E75' : '#EF4444') : undefined,
                sub: prevSales > 0 ? (
                  <span className={`flex items-center gap-1 text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    전월 {formatCurrencyFull(prevSales)}
                  </span>
                ) : undefined,
              },
              {
                label: '누적 매출',
                value: formatCurrencyFull(totalSales),
                sub: peakMonth?.sales > 0
                  ? <span className="text-xs text-gray-400">최고: {formatAxisMonth(peakMonth.month)}</span>
                  : undefined,
              },
            ].map((card, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className="text-sm font-bold leading-tight tabular-nums"
                   style={{ color: (card as any).valueColor ?? '#111827' }}>
                  {card.value}
                </p>
                {card.sub && <div className="mt-1">{card.sub}</div>}
              </div>
            ))}
          </div>

          {/* 월별 매출 추이 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">월별 매출 추이</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`grad-m-${customerName}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} width={58} />
                  <Tooltip content={<SalesAreaTooltip />} />
                  <Area type="monotone" dataKey="sales" name="매출"
                    stroke={color} strokeWidth={2.5}
                    fill={`url(#grad-m-${customerName})`}
                    dot={(p: any) => {
                      const isSelected = p.payload?.month === selectedLabel;
                      return <circle key={p.key} cx={p.cx} cy={p.cy} r={isSelected ? 5 : 3} fill={color} stroke={isSelected ? 'white' : 'none'} strokeWidth={2} />;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 거래 건수 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">월별 거래 건수</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()}건`, '거래건수']} />
                  <Bar dataKey="count" name="거래건수" radius={[3, 3, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.month === selectedLabel ? color : `${color}60`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Top 5 품목 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              주요 품목 Top 5
              <span className="ml-2 text-xs font-normal text-gray-400">{formatMonth(selectedMonth)} 기준</span>
            </h3>
            {topItems.length === 0 ? (
              <p className="text-sm text-gray-400">해당 월 데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {topItems.map((item, i) => {
                  const pct = parseFloat(item.percent);
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700 truncate max-w-[180px]">{item.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-xs text-gray-400 tabular-nums">{item.percent}</span>
                            <span
                              className="text-xs font-semibold text-gray-800 tabular-nums"
                              title={formatCurrencyFull(item.value)}
                            >
                              {formatCurrency(item.value)}원
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 부품유형별 비중 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              부품유형별 매출
              <span className="ml-2 text-xs font-normal text-gray-400">{formatMonth(selectedMonth)} 기준</span>
            </h3>
            {partTypeData.length === 0 ? (
              <p className="text-sm text-gray-400">해당 월 데이터 없음</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const ptTotal = partTypeData.reduce((s, p) => s + p.value, 0);
                  return partTypeData.map((pt, i) => {
                    const pct = ptTotal > 0 ? ((pt.value / ptTotal) * 100).toFixed(1) : '0';
                    return (
                      <div
                        key={pt.name}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-700">{pt.name}</p>
                          <p className="text-xs text-gray-400 tabular-nums">{pct}%</p>
                        </div>
                        <p
                          className="text-xs font-semibold text-gray-800 flex-shrink-0 tabular-nums"
                          title={formatCurrencyFull(pt.value)}
                        >
                          {formatCurrency(pt.value)}원
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </section>

          {/* 월별 상세 테이블 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">월별 상세</h3>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">월</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">매출</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">건수</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">증감률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...monthlyData].reverse().map((row, i, arr) => {
                    const prev = arr[i + 1];
                    const gr = prev && prev.sales > 0
                      ? ((row.sales - prev.sales) / prev.sales) * 100
                      : null;
                    const isSelected = row.month === selectedMonth;
                    return (
                      <tr key={row.month} className={isSelected ? 'bg-green-50' : ''}>
                        <td className="px-3 py-2 font-medium text-gray-700">
                          {formatAxisMonth(row.month)}
                          {isSelected && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: '#1D9E75' }}>
                              선택
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800 tabular-nums">
                          {row.sales > 0
                            ? <span title={formatCurrencyFull(row.sales)}>{formatCurrency(row.sales)}원</span>
                            : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 tabular-nums">
                          {row.count > 0 ? `${row.count.toLocaleString()}건` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {gr !== null ? (
                            <span className={`text-xs font-semibold ${gr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatPercent(gr)}
                            </span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

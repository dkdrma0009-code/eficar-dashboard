'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardData } from '@/lib/types';
import { CHART_COLORS, formatCurrency, formatAxisMonth } from '@/lib/dataUtils';

interface Props {
  data: DashboardData;
  selectedMonth: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[190px]">
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-gray-600 truncate max-w-[100px]">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-gray-800 tabular-nums">
            {formatCurrency(entry.value)}원
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MonthlyChart({ data }: Props) {
  const { monthlyData, customers } = data;

  // 기본값: 전체 합산만 활성화, 고객사 토글 접혀있음
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set(['total']));
  const [showCustomerToggles, setShowCustomerToggles] = useState(false);

  const chartData = useMemo(
    () => monthlyData.map(d => ({ ...d, month: formatAxisMonth(d.month) })),
    [monthlyData],
  );

  // 전체 합산 클릭: 항상 전체로 리셋
  // 고객사 클릭: 전체 합산 비활성화하고 해당 고객사 토글
  function toggle(key: string) {
    if (key === 'total') {
      setActiveKeys(new Set(['total']));
    } else {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete('total');
        if (next.has(key)) {
          next.delete(key);
          if (next.size === 0) return new Set(['total']); // 모두 꺼지면 전체로
        } else {
          next.add(key);
        }
        return next;
      });
    }
  }

  function handleExpandCustomers() {
    setShowCustomerToggles(true);
  }

  function handleCollapseCustomers() {
    setShowCustomerToggles(false);
    setActiveKeys(new Set(['total']));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">월별 매출 추이</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.allMonths[0] && formatAxisMonth(data.allMonths[0])} ~{' '}
            {data.allMonths[data.allMonths.length - 1] && formatAxisMonth(data.allMonths[data.allMonths.length - 1])}
            {' · '}총 {data.allMonths.length}개월
          </p>
        </div>
      </div>

      {/* 토글 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* 전체 합산 버튼 */}
        {(() => {
          const isTotal = activeKeys.has('total');
          return (
            <button
              onClick={() => toggle('total')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={
                isTotal
                  ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: 'white' }
                  : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isTotal ? 'white' : '#1D9E75' }} />
              전체 합산
            </button>
          );
        })()}

        {/* 고객사 토글 버튼들 (펼쳐진 상태일 때만 표시) */}
        {showCustomerToggles && customers.map((c, i) => {
          const color = CHART_COLORS[(i + 1) % CHART_COLORS.length];
          const active = activeKeys.has(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={
                active
                  ? { backgroundColor: color, borderColor: color, color: 'white' }
                  : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? 'white' : color }} />
              {c}
            </button>
          );
        })}

        {/* 펼치기 / 접기 버튼 */}
        {!showCustomerToggles ? (
          <button
            onClick={handleExpandCustomers}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
          >
            +{customers.length}개 더 ▾
          </button>
        ) : (
          <button
            onClick={handleCollapseCustomers}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
          >
            접기 ▴
          </button>
        )}
      </div>

      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatCurrency(v)}
              width={58}
            />
            <Tooltip content={<CustomTooltip />} />

            {activeKeys.has('total') && (
              <Line
                type="monotone" dataKey="total" name="전체 합산"
                stroke="#1D9E75" strokeWidth={2.5}
                dot={{ r: 3, fill: '#1D9E75' }} activeDot={{ r: 5 }}
              />
            )}
            {customers.map((c, i) =>
              activeKeys.has(c) ? (
                <Line
                  key={c} type="monotone" dataKey={c} name={c}
                  stroke={CHART_COLORS[(i + 1) % CHART_COLORS.length]}
                  strokeWidth={1.8}
                  dot={{ r: 2.5 }} activeDot={{ r: 4.5 }}
                  strokeDasharray={i % 2 === 0 ? undefined : '4 2'}
                />
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

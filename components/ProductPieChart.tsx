'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ViewData } from '@/lib/types';
import { PIE_COLORS, formatCurrency, formatCurrencyFull, formatMonth } from '@/lib/dataUtils';

interface Props {
  viewData: ViewData;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-[180px]">
      <p className="text-xs font-semibold text-gray-700 mb-1">{item.name}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrencyFull(item.value)}</p>
      <p className="text-xs text-gray-400 mt-0.5">{item.payload.percent}</p>
    </div>
  );
}

export default function ProductPieChart({ viewData }: Props) {
  const { productData, selectedMonth } = viewData;

  if (!productData.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-center min-h-[300px]">
        <p className="text-gray-400 text-sm">데이터 없음</p>
      </div>
    );
  }

  const total = productData.reduce((s, d) => s + d.value, 0);
  const withPercent = productData.map(d => ({
    ...d,
    percent: total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '0%',
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">품목별 매출 구성</h2>
        <p className="text-xs text-gray-400 mt-0.5">{formatMonth(selectedMonth)} 기준</p>
      </div>

      {/* 도넛 차트 — 범례 없음, 아래 리스트로 대체 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withPercent}
              cx="50%" cy="50%"
              innerRadius="42%" outerRadius="72%"
              paddingAngle={2}
              dataKey="value"
            >
              {withPercent.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 커스텀 범례 — 스크롤 가능, 잘림 없음 */}
      <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
        {withPercent.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-xs text-gray-600 flex-1 truncate min-w-0">{item.name}</span>
            <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">{item.percent}</span>
            <span
              className="text-xs font-semibold text-gray-800 flex-shrink-0 tabular-nums"
              title={formatCurrencyFull(item.value)}
            >
              {formatCurrency(item.value)}원
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

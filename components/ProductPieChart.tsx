'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ViewData } from '@/lib/types';
import { PIE_COLORS, formatCurrency, formatCurrencyFull, formatMonth } from '@/lib/dataUtils';

interface Props { viewData: ViewData; }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="card" style={{ padding: '10px 14px', minWidth: 140, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: '#8B95A1' }}>{item.name}</p>
      <p className="text-sm font-bold" style={{ color: '#191F28' }}>{formatCurrencyFull(item.value)}</p>
      <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>{item.payload.pct}</p>
    </div>
  );
};

export default function ProductPieChart({ viewData }: Props) {
  const { productData, selectedMonth } = viewData;

  if (!productData.length) {
    return (
      <div className="card flex items-center justify-center" style={{ minHeight: 300 }}>
        <p style={{ color: '#8B95A1', fontSize: 14 }}>데이터 없음</p>
      </div>
    );
  }

  const total = productData.reduce((s, d) => s + d.value, 0);
  const withPct = productData.map(d => ({
    ...d,
    pct: total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '0%',
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191F28' }}>품목별 매출 구성</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>{formatMonth(selectedMonth)} 기준</p>
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={withPct} cx="50%" cy="50%"
              innerRadius="40%" outerRadius="70%"
              paddingAngle={2} dataKey="value"
            >
              {withPct.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto' }}>
        {withPct.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
            }} />
            <span style={{ fontSize: 12, color: '#8B95A1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </span>
            <span style={{ fontSize: 12, color: '#8B95A1', flexShrink: 0 }}>{item.pct}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#191F28', flexShrink: 0 }}
              title={formatCurrencyFull(item.value)}>
              {formatCurrency(item.value)}원
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

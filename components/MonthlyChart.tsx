'use client';
import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CHART_COLORS, formatCurrency, formatAxisMonth } from '@/lib/dataUtils';
import type { MonthlyData } from '@/lib/types';

interface Props { monthlyData: MonthlyData[]; customers: string[]; }

function formatYAxis(v: number) {
  if (v === 0) return '0';
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억`;
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(0)}천만`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만`;
  return v.toString();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '12px 16px', minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#8B95A1' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}
          </span>
          <span className="font-bold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function MonthlyChart({ monthlyData, customers }: Props) {
  const [showCustomers, setShowCustomers] = useState(false);
  const [activeCustomers, setActiveCustomers] = useState<Set<string>>(new Set());

  const toggleCustomer = (name: string) => {
    setActiveCustomers(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const showTotal = activeCustomers.size === 0;
  const displayData = useMemo(() => monthlyData.map(d => ({
    ...d, month: formatAxisMonth(d.month),
  })), [monthlyData]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191F28' }}>월별 매출 추이</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8B95A1' }}>전체 합산 기준</p>
        </div>
        <button onClick={() => setShowCustomers(v => !v)} className="btn-outline gap-1.5">
          고객사 토글
          {showCustomers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 고객사 토글 버튼 목록 */}
      {showCustomers && (
        <div className="flex flex-wrap gap-2 mb-4 animate-slide-down">
          {customers.map((c, i) => {
            const active = activeCustomers.has(c);
            return (
              <button key={c} onClick={() => toggleCustomer(c)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? CHART_COLORS[i % CHART_COLORS.length] : '#F2F4F6',
                  color: active ? 'white' : '#8B95A1',
                  border: 'none',
                }}>
                {c}
              </button>
            );
          })}
          {activeCustomers.size > 0 && (
            <button onClick={() => setActiveCustomers(new Set())}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{ background: '#F2F4F6', color: '#8B95A1', border: 'none' }}>
              전체 보기
            </button>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={displayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8B95A1' }} axisLine={false} tickLine={false}
            interval={displayData.length > 12 ? Math.ceil(displayData.length / 12) - 1 : 0} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: '#8B95A1' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          {showTotal && (
            <Line type="monotone" dataKey="total" name="전체 합산"
              stroke="#005957" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#005957' }} />
          )}
          {!showTotal && customers.filter(c => activeCustomers.has(c)).map((c, i) => (
            <Line key={c} type="monotone" dataKey={c} name={c}
              stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2}
              dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

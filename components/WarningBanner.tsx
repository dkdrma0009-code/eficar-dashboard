'use client';
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { AtRiskCustomer } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/dataUtils';

interface Props { customers: AtRiskCustomer[]; onSelectCustomer: (name: string) => void; }

export default function WarningBanner({ customers, onSelectCustomer }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = customers.filter(c => !dismissed.has(c.name));
  if (visible.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #FFE0B2' }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#FFF8F0', borderLeft: '4px solid #FF9500' }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#FF9500' }} />
        <p className="text-sm font-semibold" style={{ color: '#191F28' }}>
          이탈 위험 고객사 {visible.length}개사
        </p>
        <p className="text-xs" style={{ color: '#8B95A1' }}>전월 대비 30% 이상 감소</p>
      </div>
      {visible.map(c => (
        <div key={c.name} onClick={() => onSelectCustomer(c.name)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
          style={{ background: '#FFFCF8', borderTop: '1px solid #F2F4F6' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FFF3E0')}
          onMouseLeave={e => (e.currentTarget.style.background = '#FFFCF8')}>
          <div className="flex items-center gap-3">
            <span className="badge" style={{ background: '#FFF0F1', color: '#F04452', fontSize: 11 }}>위험</span>
            <span className="font-semibold text-sm" style={{ color: '#191F28' }}>{c.name}</span>
            <span className="text-xs" style={{ color: '#8B95A1' }}>
              {formatCurrency(c.currentSales)} (전월 {formatCurrency(c.prevSales)})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm" style={{ color: '#F04452' }}>{formatPercent(c.growthRate)}</span>
            <button onClick={e => { e.stopPropagation(); setDismissed(p => new Set([...p, c.name])); }}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-3.5 h-3.5" style={{ color: '#8B95A1' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

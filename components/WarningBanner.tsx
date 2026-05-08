'use client';

import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import type { ViewData } from '@/lib/types';
import { formatPercent } from '@/lib/dataUtils';
import { useState } from 'react';

interface Props {
  viewData: ViewData;
  onSelectCustomer: (name: string) => void;
}

export default function WarningBanner({ viewData, onSelectCustomer }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = viewData.atRiskCustomers.filter(c => !dismissed.has(c.name));
  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map(c => (
        <div
          key={c.name}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1 min-w-0">
            <span className="font-semibold">[{c.name}]</span> 전월 대비{' '}
            <span className="font-bold text-red-600">{formatPercent(c.growthRate)}</span> 감소 —
            확인이 필요합니다
          </p>
          <button
            onClick={() => onSelectCustomer(c.name)}
            className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0 transition-colors"
          >
            상세보기
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(c.name))}
            className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

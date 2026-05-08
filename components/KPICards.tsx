'use client';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Minus } from 'lucide-react';
import type { ViewData } from '@/lib/types';
import { formatCurrency, formatCurrencyFull, formatPercent, formatMonth } from '@/lib/dataUtils';

interface Props {
  viewData: ViewData;
}

export default function KPICards({ viewData }: Props) {
  const {
    selectedMonth, totalCurrentSales, totalPrevSales,
    growthRate, transactionCount, activeCustomers,
  } = viewData;

  const cards = [
    {
      title: '이번 달 총 매출',
      subtitle: formatMonth(selectedMonth),
      value: `${formatCurrency(totalCurrentSales)}원`,
      exact: formatCurrencyFull(totalCurrentSales),
      icon: DollarSign,
      iconColor: '#1D9E75',
      iconBg: '#E8F7F2',
    },
    {
      title: '전월 대비 증감률',
      subtitle: `전월 ${formatCurrency(totalPrevSales)}원`,
      value: totalPrevSales > 0 ? formatPercent(growthRate) : '-',
      exact: totalPrevSales > 0 ? `${formatCurrencyFull(totalCurrentSales)} vs ${formatCurrencyFull(totalPrevSales)}` : undefined,
      icon: growthRate > 0 ? TrendingUp : growthRate < 0 ? TrendingDown : Minus,
      iconColor: growthRate > 0 ? '#1D9E75' : growthRate < 0 ? '#EF4444' : '#6B7280',
      iconBg: growthRate > 0 ? '#E8F7F2' : growthRate < 0 ? '#FEF2F2' : '#F3F4F6',
      valueColor: growthRate > 0 ? '#1D9E75' : growthRate < 0 ? '#EF4444' : '#6B7280',
    },
    {
      title: '총 거래 건수',
      subtitle: '이번 달 기준',
      value: `${transactionCount.toLocaleString()}건`,
      icon: ShoppingCart,
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      title: '활성 고객사 수',
      subtitle: '이번 달 거래 발생',
      value: `${activeCustomers}개사`,
      icon: Users,
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            title={card.exact}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                  {card.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{card.subtitle}</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2"
                style={{ backgroundColor: card.iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
            </div>
            <p
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: (card as any).valueColor ?? '#111827' }}
            >
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

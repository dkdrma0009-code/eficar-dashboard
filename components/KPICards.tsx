'use client';
import { TrendingUp, TrendingDown, BarChart2, Users, ShoppingCart, Activity } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCurrency } from '@/lib/dataUtils';
import type { ViewData } from '@/lib/types';

function KPICard({ label, rawValue, displayFn, sub, growth, icon: Icon, accentColor }: {
  label: string; rawValue: number;
  displayFn: (v: number) => string;
  sub?: string; growth?: number;
  icon: React.ElementType;
  accentColor: string;
}) {
  const count = useCountUp(rawValue);
  const isGrowth = growth !== undefined;
  const up = isGrowth && growth >= 0;

  return (
    <div className="card card-hover" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* 상단 배경 장식 */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: accentColor, opacity: 0.06,
      }} />

      {/* 상단 행 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', lineHeight: 1.4 }}>{label}</p>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: accentColor + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 18, height: 18, color: accentColor }} />
        </div>
      </div>

      {/* 수치 */}
      <p style={{ fontSize: 28, fontWeight: 800, color: '#191F28', lineHeight: 1, marginBottom: 10 }}>
        {displayFn(count)}
      </p>

      {/* 하단 행 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {sub && <span style={{ fontSize: 12, color: '#8B95A1', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
        {isGrowth && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0,
            background: up ? '#E6FAF5' : '#FFF0F1',
            color: up ? '#00B386' : '#F04452',
          }}>
            {up
              ? <TrendingUp style={{ width: 11, height: 11 }} />
              : <TrendingDown style={{ width: 11, height: 11 }} />}
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function KPICards({ viewData }: { viewData: ViewData }) {
  const { totalCurrentSales, totalPrevSales, growthRate, transactionCount, activeCustomers, selectedMonth, prevMonth, isLatestMonth, mtdInfo } = viewData;

  const salesLabel = isLatestMonth && mtdInfo
    ? `${selectedMonth.slice(5)}월 ${mtdInfo.todayDay}일 기준 (MTD)`
    : '이번 달 매출';

  const salesSub = isLatestMonth && mtdInfo
    ? `예상 월매출 ${formatCurrency(mtdInfo.projectedSales)}원`
    : `전월 ${formatCurrency(totalPrevSales)}원`;

  const growthLabel = isLatestMonth && mtdInfo
    ? '전월 동기(MTD) 대비'
    : '전월 대비 증감률';

  const growthSub = isLatestMonth && mtdInfo
    ? `이달 ${mtdInfo.todayDay}일 ${formatCurrency(totalCurrentSales)}원 vs 전월 동기 ${formatCurrency(mtdInfo.prevMtdSales)}원`
    : `${prevMonth} → ${selectedMonth}`;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
      <KPICard
        label={salesLabel} rawValue={totalCurrentSales}
        displayFn={v => `${formatCurrency(Math.round(v))}원`}
        sub={salesSub}
        growth={growthRate}
        icon={BarChart2} accentColor="#005957"
      />
      <KPICard
        label={growthLabel} rawValue={Math.abs(growthRate)}
        displayFn={v => `${growthRate >= 0 ? '+' : '-'}${v.toFixed(1)}%`}
        sub={growthSub}
        growth={growthRate}
        icon={Activity} accentColor={growthRate >= 0 ? '#00B386' : '#F04452'}
      />
      <KPICard
        label="거래 건수" rawValue={transactionCount}
        displayFn={v => `${Math.round(v).toLocaleString()}건`}
        sub="이번 달 전체 거래"
        icon={ShoppingCart} accentColor="#6366F1"
      />
      <KPICard
        label="활성 고객사" rawValue={activeCustomers}
        displayFn={v => `${Math.round(v)}개사`}
        sub="이번 달 거래 고객사"
        icon={Users} accentColor="#F59E0B"
      />
    </div>
  );
}

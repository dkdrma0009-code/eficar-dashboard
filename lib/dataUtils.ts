import type {
  SalesRecord, CustomerStats, CustomerGrade,
  MonthlyData, ProductData, CustomerMonthlyData,
  AtRiskCustomer, ViewData, DashboardData,
} from './types';

export const CHART_COLORS = [
  '#005957', '#00B386', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#DC2626',
];

export const PIE_COLORS = [
  '#005957', '#00B386', '#34D399', '#3B82F6', '#60A5FA',
  '#F59E0B', '#FBBF24', '#8B5CF6', '#EC4899', '#F97316',
];

export const GRADE_CONFIG: Record<CustomerGrade, { label: string; bg: string; color: string }> = {
  vip:     { label: '🏆 VIP',  bg: '#E6F2F2', color: '#005957' },
  normal:  { label: '✅ 일반',  bg: '#E6FAF5', color: '#00B386' },
  warning: { label: '⚠️ 주의', bg: '#FFF8F0', color: '#FF9500' },
  danger:  { label: '🚨 위험', bg: '#FFF0F1', color: '#F04452' },
  new:     { label: '🆕 신규', bg: '#F0EFFF', color: '#6B7CFF' },
};

export const RISK_THRESHOLD_PCT = 30;

function getPrevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

export function categorizeProduct(itemName: string): string {
  const n = itemName;
  if (n.includes('헤드램프') || n.includes('헤드라이트') || n.includes('전조등')) return '헤드램프';
  if (n.includes('테일램프') || n.includes('후미등') || n.includes('리어램프')) return '테일램프';
  if (n.includes('범퍼')) return '범퍼';
  if (n.includes('휠') || n.includes('알로이') || n.includes('타이어')) return '휠/타이어';
  if (n.includes('사이드미러') || n.includes('도어미러') || n.includes('미러')) return '사이드미러';
  if (n.includes('후드') || n.includes('본넷')) return '후드';
  if (n.includes('도어') && !n.includes('미러')) return '도어';
  if (n.includes('유리') || n.includes('윈드실드') || n.includes('글라스') || n.includes('윈도우')) return '유리';
  if (n.includes('라디에이터') || n.includes('그릴') || n.includes('쿨러')) return '라디에이터/그릴';
  if (n.includes('펜더') || n.includes('휀더')) return '펜더';
  if (n.includes('엔진') || n.includes('모터')) return '엔진/모터';
  if (n.includes('서스펜션') || n.includes('쇼크') || n.includes('스프링')) return '서스펜션';
  if (n.includes('브레이크') || n.includes('캘리퍼') || n.includes('디스크')) return '브레이크';
  return itemName.length > 12 ? itemName.substring(0, 12) : itemName;
}

export function getCustomerGrade(
  currentSales: number,
  prevSales: number,
  growthRate: number,
): CustomerGrade {
  if (prevSales === 0 && currentSales > 0) return 'new';
  if (currentSales === 0 || growthRate <= -60) return 'danger';
  if (currentSales >= 50_000_000 || growthRate >= 20) return 'vip';
  if (growthRate <= -30) return 'warning';
  return 'normal';
}

export function buildDashboardData(records: SalesRecord[]): DashboardData {
  const allMonths = [...new Set(records.map(r => r.date))].sort();
  const latestMonth = allMonths[allMonths.length - 1] ?? '';
  const currentMonth = allMonths.length >= 2 ? allMonths[allMonths.length - 2] : latestMonth;
  const customers = [...new Set(records.map(r => r.service))].sort();

  // 거래건수 버그 검증용 로그
  if (process.env.NODE_ENV === 'development') {
    const monthCounts: Record<string, number> = {};
    allMonths.forEach(m => { monthCounts[m] = records.filter(r => r.date === m).length; });
    console.log('[eficar] 월별 행수:', monthCounts);
  }

  const monthlyData: MonthlyData[] = allMonths.map(month => {
    const mRecs = records.filter(r => r.date === month);
    const entry: MonthlyData = { month, total: mRecs.reduce((s, r) => s + r.amount, 0) };
    customers.forEach(c => {
      entry[c] = mRecs.filter(r => r.service === c).reduce((s, r) => s + r.amount, 0);
    });
    return entry;
  });

  return { records, customers, allMonths, currentMonth, latestMonth, monthlyData };
}

export function computeViewData(
  records: SalesRecord[],
  selectedMonth: string,
  customers: string[],
  latestMonth: string,
): ViewData {
  const isLatestMonth = selectedMonth === latestMonth;
  const prevMonth = getPrevMonth(selectedMonth);

  const curRecs = records.filter(r => r.date === selectedMonth);
  const prevRecs = records.filter(r => r.date === prevMonth);

  const totalCurrentSales = curRecs.reduce((s, r) => s + r.amount, 0);
  const totalPrevSales = prevRecs.reduce((s, r) => s + r.amount, 0);
  const growthRate =
    totalPrevSales === 0 ? 0 : ((totalCurrentSales - totalPrevSales) / totalPrevSales) * 100;

  const activeCustomers = new Set(curRecs.map(r => r.service)).size;
  const transactionCount = curRecs.length;

  const customerStats: CustomerStats[] = customers.map(name => {
    const cur = curRecs.filter(r => r.service === name);
    const prev = prevRecs.filter(r => r.service === name);
    const cs = cur.reduce((s, r) => s + r.amount, 0);
    const ps = prev.reduce((s, r) => s + r.amount, 0);
    const growth = ps === 0 ? (cs > 0 ? 100 : 0) : ((cs - ps) / ps) * 100;
    return {
      name,
      grade: getCustomerGrade(cs, ps, growth),
      currentMonthSales: cs,
      prevMonthSales: ps,
      growthRate: growth,
      totalSales: records.filter(r => r.service === name).reduce((s, r) => s + r.amount, 0),
      transactionCount: cur.length,
    };
  }).sort((a, b) => b.currentMonthSales - a.currentMonthSales);

  // 품목 분류
  const productMap = new Map<string, number>();
  curRecs.forEach(r => {
    const cat = categorizeProduct(r.itemName);
    productMap.set(cat, (productMap.get(cat) ?? 0) + r.amount);
  });
  const sorted = [...productMap.entries()].sort((a, b) => b[1] - a[1]);
  const productData: ProductData[] =
    sorted.length > 8
      ? [...sorted.slice(0, 7).map(([name, value]) => ({ name, value })),
         { name: '기타', value: sorted.slice(7).reduce((s, e) => s + e[1], 0) }]
      : sorted.map(([name, value]) => ({ name, value }));

  const atRiskCustomers: AtRiskCustomer[] = isLatestMonth
    ? []
    : customerStats
        .filter(c => c.prevMonthSales > 0 && c.growthRate <= -RISK_THRESHOLD_PCT)
        .map(c => ({
          name: c.name, growthRate: c.growthRate,
          currentSales: c.currentMonthSales, prevSales: c.prevMonthSales,
        }));

  // MVP: 가장 높은 성장률 (전월 매출 > 0)
  const mvpCustomer = [...customerStats]
    .filter(c => c.prevMonthSales > 0 && c.currentMonthSales > 0)
    .sort((a, b) => b.growthRate - a.growthRate)[0] ?? null;

  // Action: 가장 낮은 성장률 (매출 하락 또는 0)
  const actionCustomer = [...customerStats]
    .filter(c => c.growthRate < 0 || c.currentMonthSales === 0)
    .sort((a, b) => a.growthRate - b.growthRate)[0] ?? null;

  // Opportunity: 활성 고객 중 품목 다양성이 가장 낮은 고객 (크로스셀 기회)
  const allCategories = [...new Set(curRecs.map(r => categorizeProduct(r.itemName)))];
  const opportunityCustomer = allCategories.length > 1
    ? customerStats
        .filter(c => c.currentMonthSales > 0)
        .map(c => {
          const customerCats = new Set(
            curRecs.filter(r => r.service === c.name).map(r => categorizeProduct(r.itemName))
          );
          return { name: c.name, missingCategoryCount: allCategories.filter(cat => !customerCats.has(cat)).length };
        })
        .sort((a, b) => b.missingCategoryCount - a.missingCategoryCount)[0] ?? null
    : null;

  const insights: string[] = [];
  if (isLatestMonth) {
    insights.push('이 달은 아직 진행 중입니다. 데이터가 완성되지 않아 증감률이 부정확할 수 있습니다');
  } else {
    if (mvpCustomer?.growthRate) {
      insights.push(`${mvpCustomer.name}이(가) 전월 대비 ${formatPercent(mvpCustomer.growthRate)} 성장했습니다`);
    }
    if (productData.length > 0) {
      const total = productData.reduce((s, p) => s + p.value, 0);
      if (total > 0) insights.push(`${productData[0].name}이(가) 이번 달 전체 매출의 ${((productData[0].value / total) * 100).toFixed(0)}%를 차지합니다`);
    }
  }

  return {
    selectedMonth, prevMonth,
    totalCurrentSales, totalPrevSales, growthRate,
    transactionCount, activeCustomers,
    customerStats, productData, atRiskCustomers, insights, isLatestMonth,
    mvpCustomer, actionCustomer, opportunityCustomer,
  };
}

export function getCustomerTopItems(
  records: SalesRecord[], customer: string, month: string, n = 5,
): Array<{ name: string; value: number; percent: string }> {
  const recs = records.filter(r => r.service === customer && r.date === month);
  const map = new Map<string, number>();
  recs.forEach(r => {
    const key = r.itemName.trim().replace(/\s+/g, ' ') || '미분류';
    map.set(key, (map.get(key) ?? 0) + r.amount);
  });
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([name, value]) => ({ name, value, percent: total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%' }));
}

export function getCustomerPartTypeData(
  records: SalesRecord[], customer: string, month: string,
): ProductData[] {
  const recs = records.filter(r => r.service === customer && r.date === month);
  const map = new Map<string, number>();
  recs.forEach(r => { if (r.partType) map.set(r.partType, (map.get(r.partType) ?? 0) + r.amount); });
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

export function getCustomerMonthlyData(
  records: SalesRecord[], customer: string, months: string[],
): CustomerMonthlyData[] {
  return months.map(month => {
    const recs = records.filter(r => r.service === customer && r.date === month);
    return { month, sales: recs.reduce((s, r) => s + r.amount, 0), count: recs.length };
  });
}

export async function downloadReport(records: SalesRecord[], viewData: ViewData): Promise<void> {
  const XLSX = await import('xlsx');
  const { selectedMonth, prevMonth, customerStats } = viewData;
  const summaryHeaders = ['고객사명', `${selectedMonth} 매출`, `${prevMonth} 매출`, '증감률', '누적 매출', '거래건수'];
  const summaryRows = customerStats.map(c => [
    c.name, c.currentMonthSales, c.prevMonthSales,
    `${c.growthRate >= 0 ? '+' : ''}${c.growthRate.toFixed(1)}%`,
    c.totalSales, c.transactionCount,
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  ws1['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 }];
  const rawHeaders = ['판매일자', '서비스유형', '차량구분', '부품유형', '품목명', '판매금액'];
  const rawRows = records.filter(r => r.date === selectedMonth)
    .map(r => [r.date, r.service, r.carType, r.partType, r.itemName, r.amount]);
  const ws2 = XLSX.utils.aoa_to_sheet([rawHeaders, ...rawRows]);
  ws2['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 30 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, '고객사 요약');
  XLSX.utils.book_append_sheet(wb, ws2, '상세 데이터');
  XLSX.writeFile(wb, `eficar-report-${selectedMonth}.xlsx`);
}

export function formatCurrency(amount: number): string {
  const n = Math.round(amount);
  if (n >= 100_000_000) {
    const ok = n / 100_000_000;
    return ok >= 1 ? `${ok.toFixed(1)}억` : `${Math.round(n / 10_000).toLocaleString()}만`;
  }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return n.toLocaleString();
}
export function formatCurrencyFull(amount: number): string { return `${Math.round(amount).toLocaleString()}원`; }
export function formatPercent(value: number): string { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`; }
export function formatMonth(m: string): string {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${y}년 ${parseInt(mo)}월`;
}
export function formatAxisMonth(m: string): string {
  if (!m) return '';
  const p = m.split('-');
  return `${p[0].slice(2)}/${p[1]}`;
}

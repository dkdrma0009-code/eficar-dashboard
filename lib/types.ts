export interface SalesRecord {
  date: string;
  service: string;
  carType: string;
  partType: string;
  itemName: string;
  amount: number;
}

export type CustomerGrade = 'vip' | 'normal' | 'warning' | 'danger' | 'new';

export interface CustomerStats {
  name: string;
  grade: CustomerGrade;
  currentMonthSales: number;
  prevMonthSales: number;
  prevMtdSales?: number;  // 진행 중인 달에만 설정: 전월 동일 기간 환산
  growthRate: number;
  totalSales: number;
  transactionCount: number;
}

export interface MonthlyData {
  month: string;
  total: number;
  [key: string]: number | string;
}

export interface ProductData {
  name: string;
  value: number;
}

export interface CustomerMonthlyData {
  month: string;
  sales: number;
  count: number;
}

export interface AtRiskCustomer {
  name: string;
  growthRate: number;
  currentSales: number;
  prevSales: number;
}

export interface MtdInfo {
  todayDay: number;       // 오늘 일자 (진행 중인 달)
  daysInMonth: number;    // 해당 월 총 일수
  dailyRate: number;      // 이달 일평균 매출
  projectedSales: number; // 일평균 기준 예상 월매출
  prevDailyRate: number;  // 전월 일평균 매출
  prevMtdSales: number;   // 전월 동일 기간 환산 매출 (prevDailyRate × todayDay)
}

export interface ViewData {
  selectedMonth: string;
  prevMonth: string;
  totalCurrentSales: number;
  totalPrevSales: number;
  growthRate: number;
  transactionCount: number;
  activeCustomers: number;
  customerStats: CustomerStats[];
  productData: ProductData[];
  atRiskCustomers: AtRiskCustomer[];
  insights: string[];
  isLatestMonth: boolean;
  totalPrevMtdSales?: number; // 진행 중인 달에만 설정: 전체 전월 동일 기간 환산
  mvpCustomer: CustomerStats | null;
  actionCustomer: CustomerStats | null;
  opportunityCustomer: { name: string; missingCategoryCount: number } | null;
  mtdInfo?: MtdInfo; // 진행 중인 달에만 설정
  trendMap: Record<string, TrendAnalysis>;
}

// ── Trend Intelligence ────────────────────────────────────────────────────────
export type TrendState =
  | 'rapid_growth'      // 급성장 (3개월+ 20%+)
  | 'stable_growth'     // 안정 성장
  | 'recovering'        // 회복 중 (하락 후 반등)
  | 'temporary_drop'    // 일시 감소 (장기 추세 이상 없음)
  | 'long_decline'      // 장기 하락 (3개월+ 연속)
  | 'high_volatility'   // 변동성 높음
  | 'seasonal_pattern'  // 계절성 패턴
  | 'churn_risk'        // 이탈 위험
  | 'stable'            // 안정 유지
  | 'new_customer'      // 신규 (데이터 부족)
  | 'dormant';          // 거래 중단

export interface TrendAnalysis {
  state: TrendState;
  consecutiveGrowths: number;
  consecutiveDeclines: number;
  movingAvg3: number;
  movingAvg6: number;
  volatilityScore: number;    // 0–100
  seasonalityDetected: boolean;
  recoveryDetected: boolean;
  riskScore: number;          // 0–100 복합 위험도
  trendDirection: 'up' | 'down' | 'flat';
  description: string;
  monthlyHistory: { month: string; sales: number; growth: number | null }[];
}

export interface DashboardData {
  records: SalesRecord[];
  customers: string[];
  allMonths: string[];
  currentMonth: string;
  latestMonth: string;
  monthlyData: MonthlyData[];
}

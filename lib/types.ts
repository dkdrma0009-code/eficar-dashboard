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
  mvpCustomer: CustomerStats | null;
  actionCustomer: CustomerStats | null;
  opportunityCustomer: { name: string; missingCategoryCount: number } | null;
  mtdInfo?: MtdInfo; // 진행 중인 달에만 설정
}

export interface DashboardData {
  records: SalesRecord[];
  customers: string[];
  allMonths: string[];
  currentMonth: string;
  latestMonth: string;
  monthlyData: MonthlyData[];
}

export interface SalesRecord {
  date: string;
  service: string;
  carType: string;
  partType: string;
  itemName: string;
  amount: number;
}

export interface CustomerStats {
  name: string;
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
  /** 선택된 월이 데이터상 가장 최근(미완성) 월인지 여부 */
  isLatestMonth: boolean;
}

/** 파일 업로드 후 한 번만 계산되는 정적 데이터 */
export interface DashboardData {
  records: SalesRecord[];
  customers: string[];
  allMonths: string[];
  /** 마지막으로 완성된 월 (기본 선택 월) */
  currentMonth: string;
  /** 데이터상 가장 최근 월 (진행중일 수 있음) */
  latestMonth: string;
  monthlyData: MonthlyData[];
}

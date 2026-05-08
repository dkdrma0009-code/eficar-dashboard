'use client';

import { useState, useMemo, useCallback } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import type { DashboardData } from '@/lib/types';
import {
  computeViewData, downloadReport, formatMonth, formatAxisMonth,
} from '@/lib/dataUtils';
import KPICards from './KPICards';
import MonthlyChart from './MonthlyChart';
import CustomerTable from './CustomerTable';
import ProductPieChart from './ProductPieChart';
import CustomerModal from './CustomerModal';
import CustomerReportModal from './CustomerReportModal';
import WarningBanner from './WarningBanner';

interface Props {
  data: DashboardData;
}

export default function Dashboard({ data }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(data.currentMonth);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const viewData = useMemo(
    () => computeViewData(data.records, selectedMonth, data.customers, data.latestMonth),
    [data, selectedMonth],
  );

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadReport(data.records, viewData);
    } finally {
      setDownloading(false);
    }
  }, [data.records, viewData]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

      {/* 월 선택 + 다운로드 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">기준 월</span>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 cursor-pointer hover:border-green-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#1D9E75' } as React.CSSProperties}
            >
              {[...data.allMonths].reverse().map(m => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                  {m === data.latestMonth ? ' (진행중)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          {selectedMonth !== data.currentMonth && (
            <button
              onClick={() => setSelectedMonth(data.currentMonth)}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              기본으로
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white transition-colors hover:border-green-400 hover:text-green-700"
          >
            <Download className="w-4 h-4" />
            고객사 리포트
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1D9E75' }}
          >
            <Download className="w-4 h-4" />
            {downloading ? '생성 중...' : '엑셀 다운로드'}
          </button>
        </div>
      </div>

      {/* 이탈 위험 배너 */}
      <WarningBanner viewData={viewData} onSelectCustomer={setSelectedCustomer} />

      {/* KPI 카드 */}
      <KPICards viewData={viewData} />

      {/* 인사이트 텍스트 */}
      {viewData.insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 flex-wrap">
            {viewData.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
                <span className="text-base leading-none flex-shrink-0 mt-0.5">
                  {i === 0 ? '📈' : i === 1 ? '🔧' : '🏆'}
                </span>
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 월별 매출 추이 */}
      <MonthlyChart data={data} selectedMonth={selectedMonth} />

      {/* 고객사 테이블 + 파이차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <CustomerTable viewData={viewData} onSelectCustomer={setSelectedCustomer} />
        </div>
        <div>
          <ProductPieChart viewData={viewData} />
        </div>
      </div>

      {/* 고객사 상세 모달 */}
      {selectedCustomer && (
        <CustomerModal
          customerName={selectedCustomer}
          data={data}
          selectedMonth={selectedMonth}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* 고객사 리포트 PDF 모달 */}
      {showReportModal && (
        <CustomerReportModal
          data={data}
          defaultCustomer={data.customers[0]}
          defaultMonth={selectedMonth}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

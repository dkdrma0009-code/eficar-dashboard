'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { getGoals } from '@/lib/goalsStorage';
import type { DashboardData } from '@/lib/types';
import { computeViewData, downloadReport, formatMonth } from '@/lib/dataUtils';
import KPICards from './KPICards';
import MonthlyChart from './MonthlyChart';
import CustomerTable from './CustomerTable';
import ProductPieChart from './ProductPieChart';
import CustomerModal from './CustomerModal';
import CustomerReportModal from './CustomerReportModal';
import WarningBanner from './WarningBanner';
import InsightCards from './InsightCards';
import AIInsightsPanel from './AIInsightsPanel';

interface Props { data: DashboardData; }

export default function Dashboard({ data }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(data.currentMonth);

  // Reset selected month when a new file is uploaded
  useEffect(() => { setSelectedMonth(data.currentMonth); }, [data]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const viewData = useMemo(
    () => computeViewData(data.records, selectedMonth, data.customers, data.latestMonth),
    [data, selectedMonth],
  );

  const [goals, setGoals] = useState<Record<string, number>>({});
  useEffect(() => { setGoals(getGoals()); }, [data]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try { await downloadReport(data.records, viewData); }
    finally { setDownloading(false); }
  }, [data.records, viewData]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1' }}>기준 월</span>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{
                appearance: 'none', paddingLeft: 12, paddingRight: 32, paddingTop: 8, paddingBottom: 8,
                background: 'white', border: '1px solid #F2F4F6', borderRadius: 8,
                fontSize: 14, fontWeight: 600, color: '#191F28', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {[...data.allMonths].reverse().map(m => (
                <option key={m} value={m}>
                  {formatMonth(m)}{m === data.latestMonth ? ' (진행중)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#8B95A1', pointerEvents: 'none' }} />
          </div>
          {selectedMonth !== data.currentMonth && (
            <button onClick={() => setSelectedMonth(data.currentMonth)}
              style={{ fontSize: 12, color: '#8B95A1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              기본으로
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="btn-outline">
            <Download style={{ width: 14, height: 14 }} />
            고객사 리포트
          </button>
          <button onClick={handleDownload} disabled={downloading} className="btn-primary"
            style={{ height: 36, opacity: downloading ? 0.5 : 1 }}>
            <Download style={{ width: 14, height: 14 }} />
            {downloading ? '생성 중...' : '엑셀 다운로드'}
          </button>
        </div>
      </div>

      {/* 이탈 위험 배너 */}
      <WarningBanner customers={viewData.atRiskCustomers} onSelectCustomer={setSelectedCustomer} />

      {/* AI 인사이트 */}
      <AIInsightsPanel data={data} />

      {/* KPI 카드 */}
      <KPICards viewData={viewData} />

      {/* 목표 달성률 */}
      {Object.keys(goals).length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 14 }}>🎯 이달 목표 달성률</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {Object.entries(goals).map(([customer, target]) => {
              const actual = data.records
                .filter(r => r.date === selectedMonth && r.service === customer)
                .reduce((s, r) => s + r.amount, 0);
              const pct = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
              const exceeded = target > 0 && actual >= target;
              const barColor = exceeded ? '#059669' : pct >= 70 ? '#D97706' : '#DC2626';
              return (
                <div key={customer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4A5568' }}>{customer}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
                      {pct}%{exceeded && ' ✓'}
                    </span>
                  </div>
                  <div style={{ height: 7, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: 7, width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: '#8B95A1' }}>{actual.toLocaleString()}원</span>
                    <span style={{ fontSize: 10, color: '#8B95A1' }}>목표 {target.toLocaleString()}원</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 인사이트 카드 */}
      <InsightCards viewData={viewData} onSelectCustomer={setSelectedCustomer} />

      {/* 월별 매출 추이 */}
      <MonthlyChart monthlyData={data.monthlyData} customers={data.customers} />

      {/* 고객사 테이블 + 파이차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <CustomerTable viewData={viewData} onSelectCustomer={setSelectedCustomer} />
        <ProductPieChart viewData={viewData} />
      </div>

      {/* 모달 */}
      {selectedCustomer && (
        <CustomerModal
          customerName={selectedCustomer}
          data={data}
          selectedMonth={selectedMonth}
          onClose={() => setSelectedCustomer(null)}
          onReport={() => { setSelectedCustomer(null); setShowReportModal(true); }}
        />
      )}
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

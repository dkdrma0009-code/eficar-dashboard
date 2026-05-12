'use client';

import { useRef, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import type { DashboardData } from '@/lib/types';
import {
  getCustomerMonthlyData, getCustomerTopItems, getCustomerPartTypeData,
  formatCurrency, formatCurrencyFull, formatPercent, formatMonth,
} from '@/lib/dataUtils';

interface Props {
  data: DashboardData;
  defaultCustomer?: string;
  defaultMonth?: string;
  onClose: () => void;
}

const BRAND = '#005957';
const BRAND_LIGHT = '#E6F2F2';
const CONTACT_EMAIL = 'info@eficar.co.kr';
const CONTACT_PHONE = '010-2752-1054';
const SAVINGS_RATE = 0.35; // OEM 대비 절감률

function getPrevMonthKey(months: string[], month: string): string {
  const idx = months.indexOf(month);
  return idx > 0 ? months[idx - 1] : '';
}

function ReportLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>∞</span>
      </div>
      <span style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>에픽카</span>
    </div>
  );
}

export default function CustomerReportModal({ data, defaultCustomer, defaultMonth, onClose }: Props) {
  const { records, customers, allMonths } = data;
  const [selectedCustomer, setSelectedCustomer] = useState(defaultCustomer ?? customers[0] ?? '');
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth ?? data.currentMonth);
  const [generating, setGenerating] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const prevMonthKey = getPrevMonthKey(allMonths, selectedMonth);
  const monthlyData = getCustomerMonthlyData(records, selectedCustomer, allMonths);
  const topItems = getCustomerTopItems(records, selectedCustomer, selectedMonth, 5);
  const partTypeData = getCustomerPartTypeData(records, selectedCustomer, selectedMonth);

  const currentData = monthlyData.find(d => d.month === selectedMonth);
  const prevData = monthlyData.find(d => d.month === prevMonthKey);
  const currentSales = currentData?.sales ?? 0;
  const prevSales = prevData?.sales ?? 0;
  const growth = prevSales === 0 ? 0 : ((currentSales - prevSales) / prevSales) * 100;
  const totalSales = monthlyData.reduce((s, d) => s + d.sales, 0);
  const savingsAmount = Math.round(currentSales * SAVINGS_RATE);
  const totalSavings = Math.round(totalSales * SAVINGS_RATE);

  // last 6 months bar chart
  const chartMonths = allMonths.slice(-6);
  const chartData = chartMonths.map(m => {
    const d = monthlyData.find(x => x.month === m);
    return { month: m, sales: d?.sales ?? 0 };
  });
  const maxSales = Math.max(...chartData.map(d => d.sales), 1);

  const ptTotal = partTypeData.reduce((s, p) => s + p.value, 0);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  async function handleGenerate() {
    if (!templateRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      templateRef.current.style.visibility = 'visible';
      templateRef.current.style.position = 'fixed';
      templateRef.current.style.left = '-9999px';
      templateRef.current.style.top = '0';

      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
      });

      templateRef.current.style.visibility = 'hidden';
      templateRef.current.style.position = 'absolute';
      templateRef.current.style.left = '-9999px';

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfH = pdf.internal.pageSize.getHeight();  // 297mm

      // Always render as single A4 page — scale to fit if content slightly exceeds
      const imgData = canvas.toDataURL('image/png');
      const canvasAspect = canvas.height / canvas.width;
      const renderedH = pdfW * canvasAspect;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, Math.min(renderedH, pdfH));

      pdf.save(`eficar-report-${selectedCustomer}-${selectedMonth}.pdf`);
    } catch (err) {
      console.error('PDF 생성 실패:', err);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      {/* ── 선택 모달 ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: BRAND }} />
              <h2 className="text-base font-bold text-gray-900">고객사 리포트 PDF 생성</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">고객사</label>
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
              >
                {customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">기준 월</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
              >
                {[...allMonths].reverse().map(m => (
                  <option key={m} value={m}>
                    {formatMonth(m)}{m === data.latestMonth ? ' (진행중)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 미리보기 KPI */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { label: '공급 금액', value: currentSales > 0 ? `${formatCurrency(currentSales)}원` : '-' },
                { label: '전월 대비', value: prevSales > 0 ? formatPercent(growth) : '-', color: prevSales > 0 ? (growth >= 0 ? BRAND : '#EF4444') : undefined },
                { label: '누적 공급', value: totalSales > 0 ? `${formatCurrency(totalSales)}원` : '-' },
                { label: 'OEM 절감', value: savingsAmount > 0 ? `${formatCurrency(savingsAmount)}원` : '-', color: BRAND },
              ].map((card) => (
                <div key={card.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{card.label}</p>
                  <p className="text-xs font-bold" style={{ color: card.color ?? '#111827' }}>{card.value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedCustomer}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" />PDF 생성 중...</>
                : <><FileText className="w-4 h-4" />PDF 다운로드</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── 숨김 PDF 템플릿 (794×1123 = A4 @96dpi) ──────────────── */}
      <div style={{ visibility: 'hidden', position: 'absolute', left: '-9999px', top: 0 }}>
        <div
          ref={templateRef}
          style={{
            width: '794px',
            height: '1123px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif',
            fontSize: '13px',
            color: '#111827',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── 헤더 ────────────────────────────────────────────── */}
          <div style={{
            backgroundColor: BRAND,
            padding: '16px 36px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            {/* 좌측: 로고 */}
            <div>
              <ReportLogo />
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px', letterSpacing: '0.5px' }}>
                부품비 절감 솔루션
              </div>
            </div>
            {/* 우측: 리포트 정보 */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.3 }}>
                {selectedCustomer} 월간 부품비 절감 리포트
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>
                기준 월: {formatMonth(selectedMonth)}&nbsp;&nbsp;|&nbsp;&nbsp;발행일: {today}
              </div>
            </div>
          </div>

          {/* ── 본문 ────────────────────────────────────────────── */}
          <div style={{ padding: '18px 36px 0', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

            {/* 섹션 1: 이달의 성과 요약 (2×2 grid) */}
            <section>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px', borderLeft: `3px solid ${BRAND}`, paddingLeft: '8px' }}>
                이달의 성과 요약
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                {/* 카드 1: 공급 금액 */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '11px 14px', backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>이번 달 공급 금액</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                    {currentSales > 0 ? `${formatCurrency(currentSales)}원` : '-'}
                  </div>
                  {currentSales > 0 && <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '4px' }}>{formatCurrencyFull(currentSales)}</div>}
                </div>
                {/* 카드 2: 전월 대비 */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '11px 14px', backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>전월 대비</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2, color: prevSales > 0 ? (growth >= 0 ? BRAND : '#EF4444') : '#9CA3AF' }}>
                    {prevSales > 0 ? `${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth).toFixed(1)}%` : '-'}
                  </div>
                  {prevSales > 0 && <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '4px' }}>전월 {formatCurrency(prevSales)}원</div>}
                </div>
                {/* 카드 3: 누적 공급 금액 */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '11px 14px', backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>누적 공급 금액</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                    {totalSales > 0 ? `${formatCurrency(totalSales)}원` : '-'}
                  </div>
                  {totalSales > 0 && <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '4px' }}>{formatCurrencyFull(totalSales)}</div>}
                </div>
                {/* 카드 4: OEM 대비 절감액 (강조) */}
                <div style={{ border: `1.5px solid ${BRAND}`, borderRadius: '10px', padding: '11px 14px', backgroundColor: BRAND_LIGHT }}>
                  <div style={{ fontSize: '10px', color: BRAND, fontWeight: 600, marginBottom: '5px' }}>OEM 대비 절감액 ✦</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: BRAND, lineHeight: 1.2 }}>
                    {savingsAmount > 0 ? `${formatCurrency(savingsAmount)}원` : '-'}
                  </div>
                  {savingsAmount > 0 && <div style={{ fontSize: '9px', color: BRAND, marginTop: '4px' }}>공급금액의 약 35% 절감</div>}
                </div>
              </div>
            </section>

            {/* 섹션 2: 월별 공급 추이 */}
            <section>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px', borderLeft: `3px solid ${BRAND}`, paddingLeft: '8px' }}>
                월별 공급 추이
                <span style={{ fontSize: '10px', fontWeight: 400, color: '#9CA3AF', marginLeft: '6px' }}>최근 6개월</span>
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px 16px 10px', backgroundColor: '#F9FAFB' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '88px' }}>
                  {chartData.map(d => {
                    const h = maxSales > 0 ? Math.max((d.sales / maxSales) * 100, d.sales > 0 ? 5 : 0) : 0;
                    const isSel = d.month === selectedMonth;
                    return (
                      <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '3px' }}>
                        <div style={{ fontSize: '8px', color: isSel ? BRAND : '#9CA3AF', fontWeight: isSel ? 700 : 400, textAlign: 'center', lineHeight: 1.2, minHeight: '12px' }}>
                          {d.sales > 0 ? (d.sales >= 10_000 ? `${Math.round(d.sales / 10000)}만` : d.sales.toLocaleString()) : ''}
                        </div>
                        <div style={{ width: '100%', height: `${h}%`, backgroundColor: isSel ? BRAND : BRAND_LIGHT, borderRadius: '3px 3px 0 0', minHeight: d.sales > 0 ? '4px' : '0' }} />
                        <div style={{ fontSize: '8px', color: isSel ? BRAND : '#9CA3AF', fontWeight: isSel ? 700 : 400 }}>
                          {d.month.slice(2).replace('-', '/')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 섹션 3+4: 하단 2열 레이아웃 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '14px', flex: 1 }}>

              {/* 섹션 3: 주요 공급 품목 Top 5 */}
              <section>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px', borderLeft: `3px solid ${BRAND}`, paddingLeft: '8px' }}>
                  이번 달 주요 공급 품목 Top 5
                  <span style={{ fontSize: '10px', fontWeight: 400, color: '#9CA3AF', marginLeft: '6px' }}>{formatMonth(selectedMonth)} 기준</span>
                </div>
                {topItems.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>해당 월 데이터 없음</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3F4F6' }}>
                        <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#6B7280', width: '32px', borderRadius: '4px 0 0 4px' }}>순위</th>
                        <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>품목명</th>
                        <th style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#6B7280' }}>공급 금액</th>
                        <th style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#6B7280', width: '52px', borderRadius: '0 4px 4px 0' }}>비중</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, i) => (
                        <tr key={item.name} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: i === 0 ? BRAND : '#E5E7EB', color: i === 0 ? '#fff' : '#6B7280', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              {i + 1}
                            </div>
                          </td>
                          <td style={{ padding: '8px 8px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.name}</td>
                          <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrencyFull(item.value)}</td>
                          <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                            <span style={{ backgroundColor: i === 0 ? BRAND_LIGHT : '#F3F4F6', color: i === 0 ? BRAND : '#6B7280', padding: '2px 5px', borderRadius: '9999px', fontSize: '10px', fontWeight: 600 }}>
                              {item.percent}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {/* 섹션 4: 부품 유형별 공급 비중 */}
              <section>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px', borderLeft: `3px solid ${BRAND}`, paddingLeft: '8px' }}>
                  부품 유형별 공급 비중
                  <span style={{ fontSize: '10px', fontWeight: 400, color: '#9CA3AF', marginLeft: '6px' }}>{formatMonth(selectedMonth)} 기준</span>
                </div>
                {partTypeData.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>해당 월 데이터 없음</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {partTypeData.slice(0, 5).map((pt, idx) => {
                      const pct = ptTotal > 0 ? (pt.value / ptTotal) * 100 : 0;
                      const barColor = idx === 0 ? BRAND : idx === 1 ? '#34D399' : idx === 2 ? '#6EE7B7' : '#A7F3D0';
                      return (
                        <div key={pt.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: barColor, flexShrink: 0 }} />
                              <span style={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>{pt.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', color: '#111827', fontWeight: 700 }}>{formatCurrencyFull(pt.value)}</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: barColor, width: '36px', textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div style={{ height: '7px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '7px', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: '9999px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

          </div>

          {/* ── 인사이트 문구 ──────────────────────────────────────── */}
          <div style={{ margin: '12px 36px 0', padding: '12px 16px', backgroundColor: BRAND_LIGHT, borderRadius: '10px', border: `1px solid ${BRAND}22` }}>
            <div style={{ fontSize: '11px', color: BRAND, fontWeight: 600, lineHeight: 1.6 }}>
              에픽카와 함께&nbsp;
              <strong style={{ fontWeight: 800 }}>{selectedCustomer}</strong>의 누적 절감액이&nbsp;
              <strong style={{ fontWeight: 800 }}>{formatCurrencyFull(totalSavings)}</strong>에 달합니다.&nbsp;&nbsp;다음 달도 함께하겠습니다. 🤝
            </div>
          </div>

          {/* ── 푸터 ────────────────────────────────────────────── */}
          <div style={{ margin: '10px 0 0', borderTop: '1px solid #E5E7EB', padding: '10px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
              본 리포트는 에픽카 마케팅 대시보드에서 자동 생성되었습니다
            </div>
            <div style={{ fontSize: '9px', color: '#9CA3AF', textAlign: 'right' }}>
              {CONTACT_EMAIL}&nbsp;·&nbsp;{CONTACT_PHONE}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Target, BookOpen, Phone, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, ResponsiveContainer,
} from 'recharts';
import { useDashboardData } from '@/lib/DataContext';
import {
  getCustomerMonthlyData, getCustomerTopItems, getCustomerPartTypeData,
  formatCurrency, formatCurrencyFull, formatPercent, formatMonth, formatAxisMonth,
  GRADE_CONFIG, getCustomerGrade, PIE_COLORS,
} from '@/lib/dataUtils';
import { getGoal, setGoal } from '@/lib/goalsStorage';
import { getCRMNote, setCRMNote, type CRMNote } from '@/lib/crmStorage';
import CustomerReportModal from '@/components/CustomerReportModal';

const SAVINGS_RATE = 0.30;

export default function CustomerDetailPage() {
  const { name: encodedName } = useParams<{ name: string }>();
  const name = decodeURIComponent(encodedName);
  const router = useRouter();
  const { data } = useDashboardData();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goal, setGoalState] = useState(0);
  const [crm, setCrm] = useState<CRMNote>({ lastContact: '', nextMeeting: '', memo: '' });
  const [crmSaved, setCrmSaved] = useState(false);

  useEffect(() => {
    if (data && !selectedMonth) setSelectedMonth(data.currentMonth);
  }, [data, selectedMonth]);

  useEffect(() => {
    const g = getGoal(name);
    setGoalState(g);
    setGoalInput(g > 0 ? g.toLocaleString() : '');
    setCrm(getCRMNote(name));
  }, [name]);

  if (!data) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📂</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>데이터를 먼저 업로드하세요</h2>
          <a href="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20, textDecoration: 'none' }}>대시보드로 이동</a>
        </div>
      </main>
    );
  }

  if (!data.customers.includes(name)) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>고객사를 찾을 수 없습니다</h2>
          <button onClick={() => router.back()} className="btn-primary" style={{ marginTop: 20 }}>뒤로 가기</button>
        </div>
      </main>
    );
  }

  const activeMonth = selectedMonth || data.currentMonth;
  const monthlyData = getCustomerMonthlyData(data.records, name, data.allMonths);
  const topItems = getCustomerTopItems(data.records, name, activeMonth, 10);
  const partTypeData = getCustomerPartTypeData(data.records, name, activeMonth);

  const currentData = monthlyData.find(d => d.month === activeMonth);
  const prevMonthKey = (() => {
    const idx = data.allMonths.indexOf(activeMonth);
    return idx > 0 ? data.allMonths[idx - 1] : '';
  })();
  const prevData = monthlyData.find(d => d.month === prevMonthKey);
  const currentSales = currentData?.sales ?? 0;
  const prevSales = prevData?.sales ?? 0;
  const growth = prevSales === 0 ? 0 : ((currentSales - prevSales) / prevSales) * 100;
  const totalSales = monthlyData.reduce((s, d) => s + d.sales, 0);
  const savings = Math.round(totalSales * SAVINGS_RATE);
  const grade = getCustomerGrade(currentSales, prevSales, growth);
  const gradeConfig = GRADE_CONFIG[grade];

  const achievementRate = goal > 0 ? (currentSales / goal) * 100 : 0;
  const ptTotal = partTypeData.reduce((s, p) => s + p.value, 0);

  function saveGoal() {
    const val = parseInt(goalInput.replace(/,/g, ''), 10) || 0;
    setGoal(name, val);
    setGoalState(val);
  }

  function saveCRM() {
    setCRMNote(name, crm);
    setCrmSaved(true);
    setTimeout(() => setCrmSaved(false), 2000);
  }

  const achColor = achievementRate >= 100 ? '#005957' : achievementRate >= 70 ? '#F59E0B' : '#F04452';

  return (
    <>
      <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => router.back()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <ArrowLeft style={{ width: 14, height: 14 }} />
                뒤로
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191F28' }}>{name}</h1>
                  <span className="badge" style={{ background: gradeConfig.bg, color: gradeConfig.color, fontSize: 12 }}>
                    {gradeConfig.label}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#8B95A1', marginTop: 2 }}>고객사 상세 분석</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={activeMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', fontSize: 13, color: '#191F28', fontFamily: 'inherit', cursor: 'pointer' }}>
                {[...data.allMonths].reverse().map(m => (
                  <option key={m} value={m}>{formatMonth(m)}{m === data.latestMonth ? ' (진행중)' : ''}</option>
                ))}
              </select>
              <button onClick={() => setShowReport(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#005957', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <FileText style={{ width: 14, height: 14 }} />
                PDF 리포트
              </button>
            </div>
          </div>

          {/* KPI 카드 4개 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: '이번 달 공급액', value: currentSales > 0 ? `${formatCurrency(currentSales)}원` : '-', sub: currentSales > 0 ? formatCurrencyFull(currentSales) : '', accent: false },
              { label: '전월 대비', value: prevSales > 0 ? formatPercent(growth) : '-', sub: prevSales > 0 ? `전월 ${formatCurrency(prevSales)}원` : '전월 데이터 없음', accent: false, growth: prevSales > 0 ? growth : null },
              { label: '누적 공급액', value: totalSales > 0 ? `${formatCurrency(totalSales)}원` : '-', sub: totalSales > 0 ? formatCurrencyFull(totalSales) : '', accent: false },
              { label: 'OEM 대비 절감액', value: savings > 0 ? `${formatCurrency(savings)}원` : '-', sub: savings > 0 ? '누적 기준 약 30% 절감' : '', accent: true },
            ].map((card, i) => (
              <div key={i} className="card" style={{ padding: '16px 20px', borderLeft: card.accent ? '3px solid #005957' : undefined }}>
                <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 6 }}>{card.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, color: card.accent ? '#005957' : 'growth' in card && card.growth !== null ? (card.growth! >= 0 ? '#005957' : '#F04452') : '#191F28' }}>
                  {card.value}
                </p>
                {card.sub && <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 4 }}>{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* 월별 차트 + 목표 설정 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>

            {/* 월별 추이 바차트 */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>월별 공급 추이</h3>
                  <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>막대 클릭 시 해당 월로 이동</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  onClick={e => { if (e?.activeLabel) setSelectedMonth(e.activeLabel as string); }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
                  <XAxis
                    dataKey="month" tickFormatter={formatAxisMonth}
                    tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false}
                    interval={Math.max(0, Math.ceil(monthlyData.length / 12) - 1)}
                  />
                  <YAxis
                    tickFormatter={v => formatCurrency(v as number)}
                    tick={{ fontSize: 11, fill: '#8B95A1' }} axisLine={false} tickLine={false} width={52}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrencyFull(v), '공급액']}
                    labelFormatter={(l: string) => formatMonth(l)}
                    contentStyle={{ borderRadius: 8, border: '1px solid #F2F4F6', fontSize: 12 }}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]} cursor="pointer">
                    {monthlyData.map(d => (
                      <Cell key={d.month} fill={d.month === activeMonth ? '#005957' : '#E6F2F2'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 목표 설정 (Ch8) */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target style={{ width: 14, height: 14, color: '#005957' }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>월 목표 설정</h3>
              </div>

              <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 8 }}>이번 달 목표 금액 (원)</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={goalInput}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setGoalInput(raw ? parseInt(raw).toLocaleString() : '');
                  }}
                  placeholder="예: 50,000,000"
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={saveGoal}
                  style={{ padding: '9px 14px', background: '#005957', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  저장
                </button>
              </div>

              {goal > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#8B95A1' }}>목표 달성률</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: achColor }}>{Math.min(achievementRate, 999).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 12, background: '#F2F4F6', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ height: 12, borderRadius: 6, transition: 'width 0.5s ease', width: `${Math.min(achievementRate, 100)}%`, background: achColor }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: '목표', value: `${formatCurrency(goal)}원` },
                      { label: '달성', value: currentSales > 0 ? `${formatCurrency(currentSales)}원` : '-' },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#F8F9FA', borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ fontSize: 10, color: '#8B95A1' }}>{item.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {achievementRate >= 100 && (
                    <div style={{ padding: '10px 12px', background: '#E6F2F2', borderRadius: 8, fontSize: 12, color: '#005957', fontWeight: 600, textAlign: 'center' }}>
                      🎉 목표 달성!
                    </div>
                  )}
                  {achievementRate > 0 && achievementRate < 70 && (
                    <div style={{ padding: '10px 12px', background: '#FFF8F0', borderRadius: 8, fontSize: 12, color: '#FF9500', fontWeight: 600 }}>
                      목표까지 {formatCurrency(goal - currentSales)}원 남음
                    </div>
                  )}
                  {currentSales === 0 && goal > 0 && (
                    <div style={{ padding: '10px 12px', background: '#FFF0F1', borderRadius: 8, fontSize: 12, color: '#F04452', fontWeight: 600 }}>
                      이번 달 공급 실적 없음
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '24px', background: '#F8F9FA', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#8B95A1' }}>목표를 설정하면 달성률을 추적할 수 있습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* CRM 노트 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen style={{ width: 14, height: 14, color: '#005957' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>고객사 관리 노트</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Phone style={{ width: 12, height: 12, color: '#8B95A1' }} />
                  <p style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600 }}>마지막 연락일</p>
                </div>
                <input type="date" value={crm.lastContact}
                  onChange={e => setCrm(prev => ({ ...prev, lastContact: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Calendar style={{ width: 12, height: 12, color: '#8B95A1' }} />
                  <p style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600 }}>다음 미팅 예정일</p>
                </div>
                <input type="date" value={crm.nextMeeting}
                  onChange={e => setCrm(prev => ({ ...prev, nextMeeting: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600, marginBottom: 6 }}>메모</p>
                <textarea value={crm.memo} rows={3}
                  onChange={e => setCrm(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="미팅 내용, 특이사항, 다음 할 일 등"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={saveCRM}
                style={{ padding: '8px 20px', background: crmSaved ? '#005957' : '#191F28', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                {crmSaved ? '✓ 저장됨' : '저장'}
              </button>
            </div>
          </div>

          {/* 하단 2열: 주요 품목 + 부품 유형 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* 주요 품목 Top 10 */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>주요 공급 품목 Top 10</h3>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>{formatMonth(activeMonth)} 기준</span>
              </div>
              {topItems.length === 0 ? (
                <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'center', padding: '40px 0' }}>해당 월 데이터 없음</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topItems.map((item, i) => {
                    const pct = parseFloat(item.percent);
                    return (
                      <div key={item.name}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: i === 0 ? '#005957' : '#F2F4F6', color: i === 0 ? 'white' : '#8B95A1', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {i + 1}
                            </div>
                            <span style={{ fontSize: 13, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                            <span style={{ fontSize: 12, color: '#191F28', fontWeight: 600 }}>{formatCurrencyFull(item.value)}</span>
                            <span style={{ fontSize: 11, color: '#8B95A1', width: 40, textAlign: 'right' }}>{item.percent}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: '#F2F4F6', borderRadius: 9999 }}>
                          <div style={{ height: 5, width: `${Math.min(pct, 100)}%`, background: i === 0 ? '#005957' : i < 3 ? '#00B386' : '#E6F2F2', borderRadius: 9999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 부품 유형별 비중 */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>부품 유형별 비중</h3>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>{formatMonth(activeMonth)} 기준</span>
              </div>
              {partTypeData.length === 0 ? (
                <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'center', padding: '40px 0' }}>해당 월 데이터 없음</p>
              ) : (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={partTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72}>
                          {partTypeData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [formatCurrencyFull(v), '공급액']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {partTypeData.slice(0, 7).map((pt, idx) => {
                      const pct = ptTotal > 0 ? (pt.value / ptTotal * 100) : 0;
                      return (
                        <div key={pt.name}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{pt.name}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{pct.toFixed(1)}%</span>
                          </div>
                          <div style={{ height: 4, background: '#F2F4F6', borderRadius: 9999 }}>
                            <div style={{ height: 4, width: `${Math.min(pct, 100)}%`, background: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: 9999 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showReport && (
        <CustomerReportModal
          data={data}
          defaultCustomer={name}
          defaultMonth={activeMonth}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

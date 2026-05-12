'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sparkles, BarChart2, Send, BookOpen, Calendar, RefreshCw, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import { useDashboardData } from '@/lib/DataContext';
import { getLibrary } from '@/lib/libraryStorage';
import { getCampaigns } from '@/lib/campaignStorage';
import { getCalendarEvents } from '@/lib/calendarStorage';
import { formatCurrencyFull, formatPercent, formatMonth } from '@/lib/dataUtils';

interface AIReport {
  executiveSummary: string;
  salesAnalysis: string;
  contentActivity: string;
  campaignResult: string;
  issues: string;
  nextPlan: string;
}

const SECTIONS = [
  { key: 'executiveSummary' as const, label: '📋 임원 요약',        color: '#005957' },
  { key: 'salesAnalysis'    as const, label: '📈 매출 분석',        color: '#059669' },
  { key: 'contentActivity'  as const, label: '✍️ 콘텐츠 활동',      color: '#0A66C2' },
  { key: 'campaignResult'   as const, label: '📤 캠페인 성과',      color: '#6366F1' },
  { key: 'issues'           as const, label: '🔍 문제점 및 인사이트', color: '#D97706' },
  { key: 'nextPlan'         as const, label: '🚀 다음 달 실행 계획', color: '#DC2626' },
];

export default function ReportPage() {
  const { data } = useDashboardData();
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [copied, setCopied] = useState(false);
  const [notionSaving, setNotionSaving] = useState(false);
  const [notionUrl, setNotionUrl] = useState('');
  const [notionError, setNotionError] = useState('');

  useEffect(() => {
    if (data && !selectedMonth) setSelectedMonth(data.latestMonth);
  }, [data, selectedMonth]);

  const library = useMemo(() => getLibrary(), []);
  const campaigns = useMemo(() => getCampaigns(), []);
  const calEvents = useMemo(() => getCalendarEvents(), []);

  const stats = useMemo(() => {
    if (!data || !selectedMonth) return null;
    const ym = selectedMonth;
    const ymStr = `${ym.slice(0, 4)}-${ym.slice(5, 7)}`;
    const prevMonthIdx = data.allMonths.indexOf(ym) - 1;
    const prevMonth = prevMonthIdx >= 0 ? data.allMonths[prevMonthIdx] : '';

    const curRecs = data.records.filter(r => r.date === ym);
    const prevRecs = prevMonth ? data.records.filter(r => r.date === prevMonth) : [];
    const totalSales = curRecs.reduce((s, r) => s + r.amount, 0);
    const prevSales = prevRecs.reduce((s, r) => s + r.amount, 0);
    const growth = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;

    const monthLibrary = library.filter(i => i.createdAt.startsWith(ymStr));
    const monthCampaigns = campaigns.filter(c => c.date.startsWith(ymStr));
    const monthEvents = calEvents.filter(e => e.date.startsWith(ymStr));

    const contentStats = {
      linkedin: monthLibrary.filter(i => i.type === 'linkedin').length,
      kakao: monthLibrary.filter(i => i.type === 'kakao').length,
      email: monthLibrary.filter(i => i.type === 'email').length,
      cardnews: monthLibrary.filter(i => i.type === 'cardnews').length,
      total: monthLibrary.length,
    };

    function parseCampaignNote(note: string) {
      return {
        total: Number(note.match(/발송\s*(\d+)건/)?.[1] ?? 0),
        success: Number(note.match(/성공\s*(\d+)건/)?.[1] ?? 0),
        fail: Number(note.match(/실패\s*(\d+)건/)?.[1] ?? 0),
      };
    }
    const totalSent = monthCampaigns.reduce((s, c) => { const n = parseCampaignNote(c.note); return s + (n.total > 0 ? n.total : 1); }, 0);
    const totalSuccess = monthCampaigns.reduce((s, c) => s + parseCampaignNote(c.note).success, 0);
    const totalFail = monthCampaigns.reduce((s, c) => s + parseCampaignNote(c.note).fail, 0);
    const campaignStats = {
      total: totalSent,
      records: monthCampaigns.length,
      success: totalSuccess,
      fail: totalFail,
      successRate: totalSent > 0 ? Math.round((totalSuccess / totalSent) * 100) : 0,
      responded: monthCampaigns.filter(c => c.outcome === 'responded').length,
      meeting: monthCampaigns.filter(c => c.outcome === 'meeting').length,
      proposal: monthCampaigns.filter(c => c.outcome === 'proposal').length,
      closed: monthCampaigns.filter(c => c.outcome === 'closed').length,
      conversionRate: monthCampaigns.length > 0
        ? Math.round((monthCampaigns.filter(c => ['meeting', 'proposal', 'closed'].includes(c.outcome)).length / monthCampaigns.length) * 100)
        : 0,
    };

    const calStats = {
      done: monthEvents.filter(e => e.status === 'done').length,
      total: monthEvents.length,
    };

    return { totalSales, prevSales, growth, contentStats, campaignStats, calStats };
  }, [data, selectedMonth, library, campaigns, calEvents]);

  async function generateReport() {
    if (!stats || !data) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/marketing-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: formatMonth(selectedMonth),
          salesStats: {
            total: formatCurrencyFull(stats.totalSales),
            growth: stats.prevSales > 0 ? formatPercent(stats.growth) : '비교 불가',
          },
          contentStats: stats.contentStats,
          campaignStats: stats.campaignStats,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(`${json.error} | RAW: "${String(json.raw ?? '').slice(0, 400)}"`);
      setAiReport(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 보고서 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  function buildNotionText(): string {
    if (!aiReport || !stats || !data) return '';
    const m = formatMonth(selectedMonth);
    const lines: string[] = [
      `# ${m} 에픽카 마케팅 월간 보고서`,
      `작성일: ${new Date().toLocaleDateString('ko-KR')}`,
      '',
      '---',
      '',
      '## 📋 임원 요약',
      aiReport.executiveSummary,
      '',
      '---',
      '',
      '## 📊 핵심 지표',
      `| 항목 | 수치 |`,
      `|---|---|`,
      `| 이달 공급 매출 | ${formatCurrencyFull(stats.totalSales)} |`,
      `| 전월 대비 | ${stats.prevSales > 0 ? formatPercent(stats.growth) : '-'} |`,
      `| 콘텐츠 제작 총계 | ${stats.contentStats.total}건 |`,
      `| 캠페인 발송 | ${stats.campaignStats.total.toLocaleString()}건 (성공률 ${stats.campaignStats.successRate}%) |`,
      `| 미팅 이상 전환율 | ${stats.campaignStats.conversionRate}% |`,
      `| 캘린더 완료 | ${stats.calStats.done}/${stats.calStats.total}건 |`,
      '',
      '---',
      '',
      '## 📈 매출 분석',
      aiReport.salesAnalysis,
      '',
      '## ✍️ 콘텐츠 활동',
      aiReport.contentActivity,
      '',
      '## 📤 캠페인 성과',
      aiReport.campaignResult,
      '',
      '## 🔍 문제점 및 인사이트',
      aiReport.issues,
      '',
      '## 🚀 다음 달 실행 계획',
      aiReport.nextPlan,
    ];
    return lines.join('\n');
  }

  async function saveToNotion() {
    if (!aiReport || !stats) return;
    setNotionSaving(true);
    setNotionError('');
    setNotionUrl('');
    try {
      const kpis = [
        { label: '이달 공급 매출', value: formatCurrencyFull(stats.totalSales) || '-' },
        { label: '전월 대비', value: stats.prevSales > 0 ? formatPercent(stats.growth) : '-' },
        { label: '콘텐츠 제작', value: `${stats.contentStats.total}건 (LinkedIn ${stats.contentStats.linkedin} / 카카오 ${stats.contentStats.kakao} / 이메일 ${stats.contentStats.email} / 카드뉴스 ${stats.contentStats.cardnews})` },
        { label: '캠페인 발송', value: `${stats.campaignStats.total.toLocaleString()}건 (성공 ${stats.campaignStats.success.toLocaleString()} · 성공률 ${stats.campaignStats.successRate}%)` },
        { label: '미팅 이상 전환율', value: `${stats.campaignStats.conversionRate}%` },
      ];
      const res = await fetch('/api/notion-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${formatMonth(selectedMonth)} 에픽카 마케팅 보고서`,
          month: formatMonth(selectedMonth),
          kpis,
          report: aiReport,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setNotionUrl(json.url);
    } catch (e: unknown) {
      setNotionError(e instanceof Error ? e.message : 'Notion 저장 실패');
    } finally {
      setNotionSaving(false);
    }
  }

  function copyForNotion() {
    navigator.clipboard.writeText(buildNotionText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!data) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📂</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>먼저 데이터를 업로드하세요</h2>
          <a href="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20, textDecoration: 'none' }}>대시보드로 이동</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>마케팅 월간 보고서</h1>
            <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>AI가 작성하는 Notion용 정식 보고서</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setAiReport(null); }}
              style={{ padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
              {[...data.allMonths].reverse().map(m => (
                <option key={m} value={m}>{formatMonth(m)}{m === data.latestMonth ? ' (진행중)' : ''}</option>
              ))}
            </select>
            {aiReport && (
              <>
                <button onClick={saveToNotion} disabled={notionSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                    background: notionUrl ? '#191F28' : 'linear-gradient(135deg,#191F28,#374151)',
                    color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: notionSaving ? 'default' : 'pointer',
                    opacity: notionSaving ? 0.7 : 1, transition: 'all 0.2s' }}>
                  {notionSaving
                    ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 4 }} />저장 중...</>
                    : notionUrl
                      ? <><Check style={{ width: 13, height: 13 }} />Notion 저장됨</>
                      : <>𝙽  Notion에 저장</>}
                </button>
                <button onClick={copyForNotion}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                    border: `1px solid ${copied ? '#005957' : '#F2F4F6'}`,
                    background: copied ? '#E6F2F2' : 'white',
                    color: copied ? '#005957' : '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                  {copied ? 'Notion 복사됨!' : 'Notion 복사'}
                </button>
                <button onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Printer style={{ width: 14, height: 14 }} /> 인쇄
                </button>
              </>
            )}
          </div>
        </div>

        {stats && (
          <>
            {/* 핵심 지표 요약 바 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { icon: BarChart2, label: '이달 매출',     value: stats.totalSales > 0 ? formatCurrencyFull(stats.totalSales) : '-',        sub: stats.prevSales > 0 ? formatPercent(stats.growth) : '-' },
                { icon: BookOpen,  label: '콘텐츠 제작',   value: `${stats.contentStats.total}건`,                                            sub: `LinkedIn·카카오·이메일·카드` },
                { icon: Send,      label: '캠페인 발송',   value: `${stats.campaignStats.total.toLocaleString()}건`,                         sub: `성공률 ${stats.campaignStats.successRate}% · 전환율 ${stats.campaignStats.conversionRate}%` },
                { icon: BarChart2, label: '미팅 확정',     value: `${stats.campaignStats.meeting}건`,                                         sub: `제안 ${stats.campaignStats.proposal} / 완료 ${stats.campaignStats.closed}` },
                { icon: Calendar,  label: '캘린더 완료',   value: `${stats.calStats.done}/${stats.calStats.total}`,                           sub: '일정 완료율' },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="card" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon style={{ width: 13, height: 13, color: '#8B95A1' }} />
                      <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600 }}>{card.label}</p>
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>{card.value}</p>
                    <p style={{ fontSize: 10, color: '#8B95A1', marginTop: 2 }}>{card.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* AI 보고서 생성 버튼 */}
            {!aiReport && (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#005957,#007A77)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Sparkles style={{ width: 22, height: 22, color: 'white' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#191F28', marginBottom: 8 }}>AI 월간 보고서 생성</h3>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 24, lineHeight: 1.7 }}>
                  Gemini AI가 이달 매출·콘텐츠·캠페인 데이터를 분석해<br />
                  Notion에 바로 붙여넣을 수 있는 정식 보고서를 작성합니다
                </p>
                {notionUrl && (
                  <a href={notionUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#E6F2F2', color: '#005957', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    <ExternalLink style={{ width: 12, height: 12 }} /> Notion에서 열기
                  </a>
                )}
                {notionError && (
                  <div style={{ padding: '6px 12px', background: '#FEF2F2', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>{notionError}</div>
                )}
                {error && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 12, color: '#DC2626', textAlign: 'left', wordBreak: 'break-all' }}>{error}</div>
                )}
                <button onClick={generateReport} disabled={loading} className="btn-primary"
                  style={{ fontSize: 15, height: 48, padding: '0 32px', opacity: loading ? 0.7 : 1 }}>
                  {loading
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: 8 }} />작성 중...</>
                    : <><Sparkles style={{ width: 16, height: 16 }} />보고서 생성하기</>}
                </button>
              </div>
            )}

            {/* 생성된 보고서 — Notion 문서 스타일 */}
            {aiReport && (
              <div className="card" style={{ padding: '40px 48px', lineHeight: 1.9 }}>

                {/* 문서 타이틀 */}
                <div style={{ borderBottom: '2px solid #191F28', paddingBottom: 20, marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Monthly Marketing Report</p>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: '#191F28', marginBottom: 6 }}>
                    {formatMonth(selectedMonth)} 에픽카 마케팅 보고서
                  </h2>
                  <p style={{ fontSize: 13, color: '#8B95A1' }}>
                    작성일 {new Date().toLocaleDateString('ko-KR')} &nbsp;·&nbsp; 에픽카 마케팅팀
                  </p>
                </div>

                {/* 핵심 지표 테이블 */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#8B95A1', letterSpacing: 0.5, marginBottom: 12 }}>📊 핵심 지표</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {[
                        ['이달 공급 매출', formatCurrencyFull(stats.totalSales) || '-'],
                        ['전월 대비', stats.prevSales > 0 ? formatPercent(stats.growth) : '-'],
                        ['콘텐츠 제작', `${stats.contentStats.total}건 (LinkedIn ${stats.contentStats.linkedin} / 카카오 ${stats.contentStats.kakao} / 이메일 ${stats.contentStats.email} / 카드뉴스 ${stats.contentStats.cardnews})`],
                        ['캠페인 발송', `${stats.campaignStats.total.toLocaleString()}건 (성공 ${stats.campaignStats.success.toLocaleString()} · 성공률 ${stats.campaignStats.successRate}%)`],
                        ['미팅 이상 전환율', `${stats.campaignStats.conversionRate}%`],
                      ].map(([label, value]) => (
                        <tr key={label} style={{ borderBottom: '1px solid #F2F4F6' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#8B95A1', width: 160, background: '#F8F9FA' }}>{label}</td>
                          <td style={{ padding: '8px 12px', color: '#191F28', fontWeight: 500 }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 섹션별 내용 */}
                {SECTIONS.map((section, i) => (
                  <div key={section.key} style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: section.color, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${section.color}22` }}>
                      {section.label}
                    </h3>
                    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                      {aiReport[section.key]}
                    </div>
                  </div>
                ))}

                {/* 하단 서명 */}
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #F2F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, color: '#8B95A1' }}>에픽카 마케팅팀 · info@eficar.co.kr · 010-2752-1054</p>
                  <button onClick={generateReport} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw style={{ width: 12, height: 12 }} /> 재생성
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

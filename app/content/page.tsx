'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, RefreshCw, Sparkles, Zap, ExternalLink, Send, Mail, BookOpen } from 'lucide-react';
import { addLibraryItem } from '@/lib/libraryStorage';
import { addCalendarEvent } from '@/lib/calendarStorage';
import { addCampaign, getCampaigns } from '@/lib/campaignStorage';
import { useDashboardData } from '@/lib/DataContext';
import {
  computeViewData, getCustomerTopItems, categorizeProduct,
  formatCurrency, formatCurrencyFull, formatPercent, formatMonth,
} from '@/lib/dataUtils';
import type { DashboardData } from '@/lib/types';

const SAVINGS_RATE = 0.30;

type ContentType = 'linkedin' | 'kakao' | 'email' | 'card';

const CONTENT_TYPES: { key: ContentType; label: string; emoji: string }[] = [
  { key: 'linkedin', label: 'LinkedIn 포스트',     emoji: '💼' },
  { key: 'kakao',    label: '카카오톡 영업 메시지', emoji: '💬' },
  { key: 'email',    label: '이메일 제안서',         emoji: '📧' },
  { key: 'card',     label: '성과 카드 문구',        emoji: '📊' },
];

const EMPHASIS: { key: string; label: string }[] = [
  { key: 'growth',    label: '매출 성장' },
  { key: 'savings',   label: '절감액' },
  { key: 'expand',    label: '품목 확대' },
  { key: 'newpropo',  label: '신규 제안' },
  { key: 'total',     label: '누적 성과' },
];

function getPrevMonthKey(allMonths: string[], month: string) {
  const idx = allMonths.indexOf(month);
  return idx > 0 ? allMonths[idx - 1] : '';
}

function computeContent(data: DashboardData, customer: string, month: string, isOngoing = false) {
  const isAll = customer === '__all__';
  const curRecs = data.records.filter(r => r.date === month && (isAll || r.service === customer));
  const prevMonthKey = getPrevMonthKey(data.allMonths, month);
  const prevRecs = data.records.filter(r => r.date === prevMonthKey && (isAll || r.service === customer));

  const currentSales = curRecs.reduce((s, r) => s + r.amount, 0);
  const prevSales = prevRecs.reduce((s, r) => s + r.amount, 0);
  const growthRate = prevSales === 0 ? 0 : ((currentSales - prevSales) / prevSales) * 100;
  const totalSales = data.records.filter(r => isAll || r.service === customer).reduce((s, r) => s + r.amount, 0);
  const monthsActive = isAll
    ? data.allMonths.length
    : data.allMonths.filter(m => data.records.some(r => r.service === customer && r.date === m && r.amount > 0)).length;

  const topItemResult = getCustomerTopItems(data.records, isAll ? '' : customer, month, 1);
  const topItem = topItemResult[0]?.name ?? '[주요 품목]';

  const allCats = [...new Set(data.records.filter(r => r.date === month).map(r => categorizeProduct(r.itemName)))];
  const custCats = new Set(curRecs.map(r => categorizeProduct(r.itemName)));
  const missing = allCats.filter(c => !custCats.has(c)).slice(0, 3);

  const savings = Math.round(totalSales * SAVINGS_RATE);

  const todayLabel = (() => {
    if (!isOngoing) return formatMonth(month);
    const today = new Date();
    return `${today.getMonth() + 1}월 ${today.getDate()}일 기준`;
  })();

  return {
    customer: isAll ? '전체 고객사' : customer,
    month: formatMonth(month),
    monthShort: month.split('-')[1] ?? '',
    todayLabel,
    currentSales: currentSales > 0 ? formatCurrencyFull(currentSales) : '[입력 필요]',
    growthStr: (!isOngoing && prevSales > 0) ? formatPercent(growthRate) : null,
    totalSales: totalSales > 0 ? formatCurrencyFull(totalSales) : '[입력 필요]',
    savingsStr: savings > 0 ? formatCurrencyFull(savings) : '[입력 필요]',
    monthsActive,
    topItem,
    missing,
    isOngoing,
  };
}

// 강조 포인트별 핵심 문구 블록
type ContentData = ReturnType<typeof computeContent>;

function emphasisBlocks(d: ContentData, emphasis: string[]): string[] {
  const all = emphasis.length === 0;
  const blocks: string[] = [];

  if ((all || emphasis.includes('growth')) && d.growthStr)
    blocks.push(`📈 전월 대비 성장: ${d.growthStr}`);
  if (all || emphasis.includes('savings'))
    blocks.push(`💰 OEM 대비 절감액: ${d.savingsStr} (누적)`);
  if (all || emphasis.includes('expand'))
    blocks.push(d.missing.length > 0
      ? `🔧 확대 가능 품목: ${d.missing.slice(0, 2).join(', ')} 등 ${d.missing.length}개`
      : `🔧 주요 공급 품목: ${d.topItem}`);
  if (all || emphasis.includes('newpropo'))
    blocks.push(d.missing.length > 0
      ? `🆕 신규 제안 품목: ${d.missing.join(', ')}`
      : `🆕 현재 ${d.topItem} 위주로 공급 중`);
  if (all || emphasis.includes('total'))
    blocks.push(`📊 누적 공급액: ${d.totalSales} (${d.monthsActive}개월 거래)`);

  return blocks;
}

function emphasisOpener(emphasis: string[], d: ReturnType<typeof computeContent>): string {
  const primary = emphasis[0];
  if (primary === 'growth')   return d.growthStr ? `${d.customer}의 매출이 전월 대비 ${d.growthStr} 성장했습니다.` : `${d.customer}의 ${d.todayLabel} 에픽카 공급 현황을 공유드립니다.`;
  if (primary === 'savings')  return `${d.customer}와 함께 OEM 대비 ${d.savingsStr}를 절감했습니다.`;
  if (primary === 'expand')   return `${d.customer}에 추가 도입 가능한 품목이 ${d.missing.length}개 있습니다.`;
  if (primary === 'newpropo') return `${d.customer}에 새로운 품목 도입을 제안드립니다.`;
  if (primary === 'total')    return `${d.customer}와 ${d.monthsActive}개월간 누적 ${d.totalSales}의 성과를 함께했습니다.`;
  return `${d.customer}와 함께한 ${d.monthsActive}개월 성과를 공유드립니다.`;
}

function generateText(type: ContentType, d: ContentData, emphasis: string[], version: number): string {
  const blocks = emphasisBlocks(d, emphasis);
  const opener = emphasisOpener(emphasis, d);
  const blockText = blocks.map(b => `${b}`).join('\n');

  if (type === 'linkedin') {
    const v0 =
`${opener}

${blockText}

에픽카 에픽커넥트 솔루션으로
렌터카사의 사고 처리 원가를 데이터 기반으로 낮춥니다.
${d.missing.length > 0 ? `\n미도입 품목(${d.missing.slice(0,2).join(', ')})까지 확대하면 추가 절감이 가능합니다.\n` : ''}
#에픽카 #부품비절감 #렌터카 #B2B솔루션`;

    const v1 =
`[${d.todayLabel} ${d.customer} 성과 리포트] 📋

${blockText}

에픽카와 함께라면 렌터카 정비원가 절감이 현실이 됩니다.
다음 달도 더 나은 성과로 찾아오겠습니다.

#에픽카 #대체부품 #렌터카비용절감 #B2B`;

    return [v0, v1][version % 2];
  }

  if (type === 'kakao') {
    const v0 =
`안녕하세요 😊 에픽카 마케팅팀입니다.

${d.customer} ${d.todayLabel} 실적을 공유드립니다.

${blockText}

${d.missing.length > 0 && (emphasis.includes('newpropo') || emphasis.includes('expand') || emphasis.length === 0)
  ? `📌 추가 제안: ${d.missing.slice(0,2).join(', ')} 도입 시 더 큰 절감 기대됩니다.\n` : ''}감사합니다 🙏`;

    const v1 =
`안녕하세요, 에픽카입니다 🚗

${opener}

${blockText}

궁금하신 점은 편하게 연락 주세요 😊`;

    return [v0, v1][version % 2];
  }

  if (type === 'email') {
    const v0 =
`제목: ${d.customer} ${d.todayLabel} 에픽카 공급 성과 보고

${d.customer} 담당자님, 안녕하세요.
에픽카 마케팅팀입니다.

${opener}

■ ${d.todayLabel} 주요 성과
${blocks.map(b => `- ${b.replace(/^[^ ]+ /, '')}`).join('\n')}
${d.missing.length > 0 && (emphasis.includes('newpropo') || emphasis.includes('expand') || emphasis.length === 0)
  ? `\n■ 다음 달 확대 제안\n${d.missing.map(c => `- ${c} 도입 검토 요청`).join('\n')}\n` : ''}
언제든지 연락 주시면 상세히 안내드리겠습니다.
info@eficar.co.kr / 010-2752-1054`;

    const v0b =
`제목: [${d.customer}] ${d.todayLabel} 에픽카 공급 리포트

${d.customer} 담당자님, 안녕하세요.
파트너십 ${d.monthsActive}개월을 맞아 성과를 정리했습니다.

${blockText}
${d.missing.length > 0 && (emphasis.includes('newpropo') || emphasis.includes('expand') || emphasis.length === 0)
  ? `\n미도입 품목 ${d.missing.join(', ')}에 대한 도입 제안서도 별도 발송 가능합니다.\n` : ''}
감사합니다.
info@eficar.co.kr / 010-2752-1054`;

    return [v0, v0b][version % 2];
  }

  // card
  const v0 =
`[${d.todayLabel} ${d.customer} 성과 카드]

${blockText}`;

  const v1 =
`${d.customer} × 에픽카
${d.monthsActive}개월 파트너십 성과

${blockText}`;

  return [v0, v1][version % 2];
}

export default function ContentPage() {
  const { data } = useDashboardData();
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>('kakao');
  const [customer, setCustomer] = useState('__all__');
  const [month, setMonth] = useState('');
  const [emphasis, setEmphasis] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendFeedback, setSendFeedback] = useState('');
  const [savedToLib, setSavedToLib] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const availableMonths = data ? [...data.allMonths].reverse() : [];
  const selectedMonth = month || availableMonths[0] || '';

  const isTerminated = /sk.*상품화|상품화.*sk/i.test(customer);
  const isB2C = /b2c/i.test(customer);

  const contentData = useMemo(() => {
    if (!data || !selectedMonth) return null;
    return computeContent(data, customer, selectedMonth, selectedMonth === data.latestMonth);
  }, [data, customer, selectedMonth]);

  const generated = useMemo(() => {
    if (!contentData) return '';
    return generateText(contentType, contentData, emphasis, version);
  }, [contentData, contentType, emphasis, version]);

  const toggleEmphasis = (key: string) => {
    setEmphasis(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const activeText = aiMode && aiText ? aiText : generated;

  const logToCalendar = (channel: 'linkedin' | 'kakao' | 'email') => {
    const today = new Date().toISOString().slice(0, 10);
    const label = CONTENT_TYPES.find(c => c.key === contentType)?.label ?? '';
    addCalendarEvent({
      date: today,
      channel,
      title: `${label} — ${contentData?.customer ?? '전체'}`,
      customer: contentData?.customer ?? '',
      status: 'done',
      note: '',
    });
  };

  const logToCampaign = (channel: 'linkedin' | 'kakao' | 'email') => {
    const today = new Date().toISOString().slice(0, 10);
    const label = CONTENT_TYPES.find(c => c.key === contentType)?.label ?? '';
    addCampaign({
      date: today,
      customer: contentData?.customer ?? '',
      channel,
      contentSummary: `${label} — ${contentData?.todayLabel ?? ''}`.trim(),
      outcome: 'sent',
      note: '',
    });
  };

  const saveToLibrary = () => {
    const label = CONTENT_TYPES.find(c => c.key === contentType)?.label ?? '';
    addLibraryItem({
      type: contentType,
      title: `${label} — ${contentData?.customer ?? ''} ${contentData?.todayLabel ?? ''}`.trim(),
      content: activeText,
      customer: contentData?.customer ?? '',
      tags: [],
    });
    setSavedToLib(true);
    setTimeout(() => setSavedToLib(false), 2000);
  };

  const copy = () => {
    navigator.clipboard.writeText(activeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showFeedback = (msg: string) => {
    setSendFeedback(msg);
    setTimeout(() => setSendFeedback(''), 3500);
  };

  const parseEmailSubject = (text: string) => {
    const m = text.match(/^제목:\s*(.+)/m);
    return m ? m[1].trim() : `[에픽카] ${contentData?.customer ?? ''} 파트너십 안내`;
  };
  const parseEmailBody = (text: string) => text.replace(/^제목:.*\n\n?/, '').trim();

  const sendLinkedIn = () => {
    const encoded = encodeURIComponent(activeText.slice(0, 700));
    window.open(`https://www.linkedin.com/shareArticle?mini=true&text=${encoded}`, '_blank');
    logToCalendar('linkedin');
    logToCampaign('linkedin');
    showFeedback('💼 LinkedIn 게시 창이 열렸습니다. 캘린더 · 캠페인에 자동 기록됐습니다.');
  };

  const sendGmail = () => {
    const subject = contentType === 'email' ? parseEmailSubject(activeText) : `[에픽카] ${contentData?.customer ?? ''} 파트너십 안내`;
    const body    = contentType === 'email' ? parseEmailBody(activeText) : activeText;
    const to      = recipientEmail ? `&to=${encodeURIComponent(recipientEmail)}` : '';
    window.open(`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${to}`, '_blank');
    logToCalendar('email');
    logToCampaign('email');
    showFeedback('📧 Gmail 작성 창이 열렸습니다. 캘린더 · 캠페인에 자동 기록됐습니다.');
  };

  const sendMailto = () => {
    const subject = contentType === 'email' ? parseEmailSubject(activeText) : `[에픽카] ${contentData?.customer ?? ''} 파트너십 안내`;
    const body    = contentType === 'email' ? parseEmailBody(activeText) : activeText;
    window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    logToCalendar('email');
    logToCampaign('email');
    showFeedback('📧 메일 앱이 열렸습니다. 캘린더 · 캠페인에 자동 기록됐습니다.');
  };

  const sendKakao = () => {
    navigator.clipboard.writeText(activeText).then(() => {
      logToCalendar('kakao');
      logToCampaign('kakao');
      showFeedback('💬 복사됐습니다. 카카오톡 앱에서 Ctrl+V로 붙여넣기하세요. 캘린더 · 캠페인에 자동 기록됐습니다.');
    });
  };

  const generateAI = useCallback(async () => {
    if (!contentData) return;
    setAiLoading(true);
    setAiError('');
    setAiText('');
    try {
      const allCampaigns = getCampaigns();
      const campaignHistory = allCampaigns
        .filter(c => c.customer === contentData.customer)
        .slice(0, 5)
        .map(c => ({ date: c.date, contentSummary: c.contentSummary, outcome: c.outcome, channel: c.channel }));

      const res = await fetch('/api/content-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contentType,
          customer: contentData.customer,
          month: contentData.todayLabel,
          currentSales: contentData.currentSales,
          prevGrowth: contentData.growthStr,
          isOngoing: contentData.isOngoing,
          isB2C,
          totalSales: contentData.totalSales,
          savingsStr: contentData.savingsStr,
          topItem: contentData.topItem,
          monthsActive: contentData.monthsActive,
          missing: contentData.missing,
          campaignHistory,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAiText(json.text ?? '');
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'AI 생성 실패');
    } finally {
      setAiLoading(false);
    }
  }, [contentData, contentType]);

  if (!data) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📂</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>먼저 대시보드에서 데이터를 업로드하세요</h2>
          <p style={{ color: '#8B95A1', fontSize: 14 }}>업로드 후 이 페이지에서 실제 수치가 자동으로 채워집니다</p>
          <a href="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20, textDecoration: 'none' }}>
            대시보드로 이동
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>영업 콘텐츠 자동 생성기</h1>
          <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>
            대시보드 데이터 기반으로 LinkedIn · 카카오톡 · 이메일 문구를 1클릭으로 생성합니다
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
          {/* 좌측 설정 패널 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 1. 콘텐츠 유형 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 12 }}>콘텐츠 유형</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.key} onClick={() => { setContentType(ct.key); setVersion(0); }}
                    style={{
                      padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, textAlign: 'left',
                      background: contentType === ct.key ? '#005957' : '#F8F9FA',
                      color: contentType === ct.key ? 'white' : '#191F28',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}>
                    <span>{ct.emoji}</span> {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 기준 고객사 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>기준 고객사</p>
              <select value={customer} onChange={e => { setCustomer(e.target.value); setVersion(0); setAiText(''); }} style={{
                width: '100%', padding: '9px 12px', border: `1px solid ${isTerminated ? '#F04452' : isB2C ? '#F59E0B' : '#F2F4F6'}`, borderRadius: 8,
                fontSize: 14, color: '#191F28', background: 'white', fontFamily: 'inherit', cursor: 'pointer',
              }}>
                <option value="__all__">전체 종합</option>
                {data.customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {isTerminated && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFF0F1', borderRadius: 8, fontSize: 12, color: '#F04452', fontWeight: 600 }}>
                  ⚠️ 거래 종료 고객사입니다. 문구 발송에 주의하세요.
                </div>
              )}
              {isB2C && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#B45309', fontWeight: 600 }}>
                  👤 개인 고객(B2C) — 개인 대상 톤으로 생성됩니다.
                </div>
              )}
            </div>

            {/* 3. 기준 월 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>기준 월</p>
              <select value={selectedMonth} onChange={e => setMonth(e.target.value)} style={{
                width: '100%', padding: '9px 12px', border: '1px solid #F2F4F6', borderRadius: 8,
                fontSize: 14, color: '#191F28', background: 'white', fontFamily: 'inherit', cursor: 'pointer',
              }}>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {formatMonth(m)}{m === data.latestMonth ? ' (진행중)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. 강조 포인트 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>강조 포인트 (복수 선택)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMPHASIS.map(e => (
                  <button key={e.key} onClick={() => toggleEmphasis(e.key)}
                    style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: emphasis.includes(e.key) ? '#005957' : 'white',
                      color: emphasis.includes(e.key) ? 'white' : '#8B95A1',
                      border: emphasis.includes(e.key) ? 'none' : '1px solid #F2F4F6',
                      transition: 'all 0.15s',
                    }}>
                    {e.label}
                  </button>
                ))}
              </div>
              {emphasis.length === 0 && <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 8 }}>선택 없으면 전체 항목 포함</p>}
            </div>

            {/* AI / 템플릿 토글 */}
            <div style={{ display: 'flex', background: '#F2F4F6', borderRadius: 12, padding: 4, gap: 4 }}>
              <button onClick={() => { setAiMode(false); setAiText(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  background: !aiMode ? 'white' : 'transparent',
                  color: !aiMode ? '#005957' : '#8B95A1',
                  boxShadow: !aiMode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                <Zap style={{ width: 13, height: 13, display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                템플릿 생성
              </button>
              <button onClick={() => setAiMode(true)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  background: aiMode ? 'white' : 'transparent',
                  color: aiMode ? '#005957' : '#8B95A1',
                  boxShadow: aiMode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                <Sparkles style={{ width: 13, height: 13, display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                AI 생성
              </button>
            </div>

            {/* 생성 버튼 */}
            {aiMode ? (
              <button onClick={generateAI} disabled={aiLoading || !contentData}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, height: 48, opacity: aiLoading ? 0.7 : 1 }}>
                {aiLoading
                  ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />AI 생성 중...</>
                  : <><Sparkles style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'middle' }} />AI로 생성하기</>}
              </button>
            ) : (
              <button onClick={() => { setVersion(0); router.push('/cardnews'); }} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, height: 48 }}>
                ✨ 콘텐츠 생성하기
              </button>
            )}
          </div>

          {/* 우측 결과 패널 */}
          <div>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>
                      {CONTENT_TYPES.find(c => c.key === contentType)?.emoji} {CONTENT_TYPES.find(c => c.key === contentType)?.label}
                    </p>
                    {aiMode && aiText && (
                      <span style={{ padding: '2px 8px', background: 'linear-gradient(135deg,#005957,#007A77)', color: 'white', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>AI</span>
                    )}
                  </div>
                  {contentData && (
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 3 }}>
                      {contentData.customer} · {contentData.todayLabel}
                      {contentData.isOngoing && <span style={{ marginLeft: 6, padding: '1px 6px', background: '#FFFBEB', color: '#B45309', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>진행중</span>}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveToLibrary} disabled={!activeText} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    borderRadius: 8, border: `1px solid ${savedToLib ? '#005957' : '#F2F4F6'}`,
                    background: savedToLib ? '#E6F2F2' : 'white',
                    color: savedToLib ? '#005957' : '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', opacity: !activeText ? 0.4 : 1,
                  }}>
                    {savedToLib ? <Check style={{ width: 14, height: 14 }} /> : <BookOpen style={{ width: 14, height: 14 }} />}
                    {savedToLib ? '저장됨' : '저장'}
                  </button>
                  <button onClick={copy} disabled={!activeText} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    borderRadius: 8, border: `1px solid ${copied ? '#005957' : '#F2F4F6'}`,
                    background: copied ? '#E6F2F2' : 'white',
                    color: copied ? '#005957' : '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', opacity: !activeText ? 0.4 : 1,
                  }}>
                    {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
              </div>

              {aiMode && aiError && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', fontSize: 12, color: '#DC2626', marginBottom: 8 }}>
                  {aiError}
                </div>
              )}

              <div style={{
                flex: 1, background: '#F8F9FA', borderRadius: 12, padding: '20px',
                fontSize: 14, lineHeight: 1.9, color: '#191F28',
                whiteSpace: 'pre-wrap', minHeight: 360,
                border: `1px solid ${aiMode && aiText ? '#005957' : '#F2F4F6'}`,
              }}>
                {aiMode && aiLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#8B95A1' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid #E6F2F2', borderTopColor: '#005957', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 13 }}>AI가 문구를 작성하고 있습니다...</span>
                  </div>
                ) : activeText ? activeText : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                    <p style={{ fontSize: 32 }}>✍️</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>{aiMode ? 'AI로 생성하기를 눌러주세요' : '좌측 설정 후 생성하기를 눌러주세요'}</p>
                  </div>
                )}
              </div>

              {/* 하단 바: 글자수 + 버튼 */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>
                  {activeText ? `${activeText.length.toLocaleString()}자` : ''}
                </span>
                {aiMode ? (
                  <button onClick={generateAI} disabled={aiLoading || !contentData}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#005957', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: aiLoading ? 0.5 : 1 }}>
                    <Sparkles style={{ width: 14, height: 14 }} />
                    다시 생성
                  </button>
                ) : (
                  <button onClick={() => setVersion(v => v + 1)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#005957', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    다른 버전
                  </button>
                )}
              </div>

              {/* 전송 / 게시 액션 */}
              {activeText && (
                <div style={{ marginTop: 12, padding: '14px 16px', background: '#F8F9FA', borderRadius: 10, border: '1px solid #F2F4F6' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 12 }}>📤 전송 · 게시</p>

                  {/* 이메일/카카오 수신자 입력 */}
                  {(contentType === 'email') && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 5, fontWeight: 600 }}>수신자 이메일 (선택)</p>
                      <input
                        type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                        placeholder="example@company.com"
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #F2F4F6', borderRadius: 7, fontSize: 13, color: '#191F28', fontFamily: 'inherit', background: 'white' }}
                      />
                    </div>
                  )}

                  {/* 채널별 전송 버튼 */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {contentType === 'linkedin' && (
                      <button onClick={sendLinkedIn} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: '#0A66C2', color: 'white', transition: 'all 0.15s',
                      }}>
                        <ExternalLink style={{ width: 14, height: 14 }} /> LinkedIn에 게시
                      </button>
                    )}
                    {contentType === 'kakao' && (
                      <button onClick={sendKakao} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: '#FEE500', color: '#191F28', transition: 'all 0.15s',
                      }}>
                        <Send style={{ width: 14, height: 14 }} /> 카카오톡 복사
                      </button>
                    )}
                    {contentType === 'email' && (
                      <>
                        <button onClick={sendGmail} style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                          borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          background: '#EA4335', color: 'white', transition: 'all 0.15s',
                        }}>
                          <Mail style={{ width: 14, height: 14 }} /> Gmail로 작성
                        </button>
                        <button onClick={sendMailto} style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                          borderRadius: 8, border: '1px solid #F2F4F6', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          background: 'white', color: '#191F28', transition: 'all 0.15s',
                        }}>
                          <Mail style={{ width: 14, height: 14 }} /> 메일 앱으로
                        </button>
                      </>
                    )}
                    {contentType === 'card' && (
                      <button onClick={copy} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: copied ? '#005957' : '#191F28', color: 'white', transition: 'all 0.2s',
                      }}>
                        {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                        {copied ? '복사됨!' : '문구 복사'}
                      </button>
                    )}
                  </div>

                  {/* 피드백 메시지 */}
                  {sendFeedback && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#E6F2F2', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#005957' }}>
                      {sendFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* 실제 데이터 요약 */}
              {contentData && activeText && (
                <div style={{ marginTop: 12, padding: '14px 16px', background: '#F8FFFE', borderRadius: 10, border: '1px solid #E6F2F2' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#005957', marginBottom: 8 }}>사용된 실제 데이터</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: '이번 달 매출', value: contentData.currentSales },
                      { label: '전월 대비',    value: contentData.growthStr ?? '집계 중' },
                      { label: '누적 공급액',  value: contentData.totalSales },
                      { label: '절감액 추정',  value: contentData.savingsStr },
                      { label: '주요 품목',    value: contentData.topItem },
                      { label: '도입 기간',    value: `${contentData.monthsActive}개월` },
                    ].map(item => (
                      <div key={item.label}>
                        <p style={{ fontSize: 10, color: '#8B95A1' }}>{item.label}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#191F28', marginTop: 1 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

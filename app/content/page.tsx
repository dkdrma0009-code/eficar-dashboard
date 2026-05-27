'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Copy, Check, RefreshCw, Sparkles, Zap, ExternalLink, Send, Mail, BookOpen } from 'lucide-react';
import { addLibraryItem } from '@/lib/libraryStorage';
import { getCRMNote } from '@/lib/crmStorage';
import { addCalendarEvent } from '@/lib/calendarStorage';
import { addCampaign, getCampaigns } from '@/lib/campaignStorage';
import { addSendLog, generateLogId, buildTrackingPixelUrl, buildClickTrackUrl } from '@/lib/sendLogStorage';
import { useDashboardData } from '@/lib/DataContext';
import {
  computeViewData, getCustomerTopItems, categorizeProduct,
  formatCurrency, formatCurrencyFull, formatPercent, formatMonth,
} from '@/lib/dataUtils';
import type { DashboardData } from '@/lib/types';
import CardCanvas from '@/app/cardnews/components/CardCanvas';
import type { CardItem } from '@/app/cardnews/types';

const SAVINGS_RATE = 0.30;

type ContentType = 'linkedin' | 'kakao' | 'email' | 'card' | 'sms' | 'lms' | 'mms';

const CONTENT_TYPES: { key: ContentType; label: string; emoji: string; desc?: string }[] = [
  { key: 'linkedin', label: 'LinkedIn 포스트',      emoji: '💼' },
  { key: 'kakao',    label: '카카오톡 영업 메시지',  emoji: '💬' },
  { key: 'email',    label: '이메일 제안서',          emoji: '📧' },
  { key: 'sms',      label: 'SMS (단문)',            emoji: '📱', desc: '90바이트 이하 · 이미지 없음' },
  { key: 'lms',      label: 'LMS (장문)',            emoji: '📄', desc: '2,000자 이하 · 제목 있음' },
  { key: 'mms',      label: 'MMS (이미지)',          emoji: '🖼️', desc: '이미지 필수 · 제목 있음' },
  { key: 'card',     label: '성과 카드 문구',         emoji: '📊' },
];

function getByteLen(text: string) {
  return text.split('').reduce((n, c) => n + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c) ? 2 : 1), 0);
}

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
  // 사용 가능한 전체 블록 목록
  const pool: { key: string; text: string }[] = [];
  if (d.growthStr)
    pool.push({ key: 'growth',   text: `📈 전월 대비 성장: ${d.growthStr}` });
  pool.push({ key: 'savings',  text: `💰 OEM 대비 절감액: ${d.savingsStr} (누적)` });
  pool.push({ key: 'expand',   text: d.missing.length > 0
    ? `🔧 확대 가능 품목: ${d.missing.slice(0, 2).join(', ')} 등 ${d.missing.length}개`
    : `🔧 주요 공급 품목: ${d.topItem}` });
  pool.push({ key: 'newpropo', text: d.missing.length > 0
    ? `🆕 신규 제안 품목: ${d.missing.join(', ')}`
    : `🆕 현재 ${d.topItem} 위주로 공급 중` });
  pool.push({ key: 'total',    text: `📊 누적 공급액: ${d.totalSales} (${d.monthsActive}개월 거래)` });

  if (emphasis.length === 0) return pool.map(b => b.text);

  // 선택된 항목을 앞에, 나머지 중 2개를 뒤에 추가 (내용이 비지 않도록)
  const selected = pool.filter(b => emphasis.includes(b.key));
  const rest     = pool.filter(b => !emphasis.includes(b.key)).slice(0, 2);
  return [...selected, ...rest].map(b => b.text);
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

  if (type === 'sms') {
    // 90바이트 이하 단문 — 한글 최대 약 22~30자 수준으로 극도로 압축
    const v0 =
`[에픽카] ${d.customer} ${d.todayLabel}
${d.growthStr ? `성장 ${d.growthStr}` : `공급액 ${d.currentSales}`}
문의 010-2752-1054`;

    const v1 =
`[에픽카] ${d.customer} 실적공유
${d.topItem} 주력공급
절감액 ${d.savingsStr}
☎010-2752-1054`;

    return [v0, v1][version % 2];
  }

  if (type === 'lms') {
    const v0 =
`제목: [에픽카] ${d.customer} ${d.todayLabel} 성과 공유

안녕하세요, 에픽카 마케팅팀입니다.

${d.customer} ${d.todayLabel} 공급 실적을 공유드립니다.

${blocks.join('\n')}
${d.missing.length > 0 ? `\n📌 추가 제안 품목: ${d.missing.slice(0, 2).join(', ')}` : ''}

궁금하신 점은 편하게 연락 주세요.
에픽카 마케팅팀 | 010-2752-1054 | info@eficar.co.kr`;

    const v1 =
`제목: ${d.customer} × 에픽카 ${d.monthsActive}개월 파트너십 성과

${d.customer} 담당자님, 안녕하세요.
에픽카입니다.

${opener}

${blocks.join('\n')}

감사합니다.
에픽카 | 010-2752-1054`;

    return [v0, v1][version % 2];
  }

  if (type === 'mms') {
    const v0 =
`제목: [에픽카] ${d.customer} ${d.todayLabel} 성과 리포트

안녕하세요, 에픽카 마케팅팀입니다.

${d.customer}와 함께한 ${d.todayLabel} 성과를 이미지로 정리했습니다.

${blocks.slice(0, 3).join('\n')}

자세한 내용은 아래 이미지를 확인해 주시고,
궁금하신 점은 편하게 연락 주세요.

에픽카 | 010-2752-1054 | info@eficar.co.kr`;

    const v1 =
`제목: ${d.customer} 파트너십 ${d.monthsActive}개월 성과

${d.customer} 담당자님,

${opener}

${blocks.slice(0, 3).join('\n')}
${d.missing.length > 0 ? `\n확대 가능 품목: ${d.missing.slice(0, 2).join(', ')}` : ''}

에픽카 마케팅팀 드림
010-2752-1054`;

    return [v0, v1][version % 2];
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

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
    .replace(/\*\s{0,3}([^\n*])/g, '• $1') // *   item → • item
    .replace(/__(.+?)__/g, '$1')        // __bold__ → bold
    .replace(/^#+\s+/gm, '')           // ### heading → heading
    .replace(/_(.+?)_/g, '$1');         // _italic_ → italic
}

export default function ContentPage() {
  const { data } = useDashboardData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contentType, setContentType] = useState<ContentType>('kakao');
  const [customer, setCustomer] = useState('__all__');

  const [linkedProposal, setLinkedProposal] = useState<{ title: string; items: string; nextStep: string } | null>(null);

  useEffect(() => {
    const c = searchParams.get('customer');
    if (c) setCustomer(c);
    // 제안서에서 넘어온 경우 sessionStorage에서 제안 내용 로드
    try {
      const raw = sessionStorage.getItem('eficar-proposal-context');
      if (raw) { setLinkedProposal(JSON.parse(raw)); setAiMode(true); }
    } catch {}
  }, [searchParams]);
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

  // 콘텐츠 편집 상태
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');

  // 팝빌 SMS / 카카오 발송 상태
  const [smsPhone, setSmsPhone] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState('');
  const [kakaoSending, setKakaoSending] = useState(false);
  const [kakaoFeedback, setKakaoFeedback] = useState('');

  // MMS 이미지
  const [mmsMode, setMmsMode] = useState(false);
  const [mmsImage, setMmsImage] = useState<{ base64: string; mime: string } | null>(null);
  const [mmsCardForExport, setMmsCardForExport] = useState<CardItem | null>(null);
  const [mmsImageGenerating, setMmsImageGenerating] = useState(false);

  // LMS/MMS 제목
  const [msgSubject, setMsgSubject] = useState('');

  // 일괄 발송
  const [bulkNumbers, setBulkNumbers] = useState<{ phone: string; name: string }[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, success: 0, fail: 0 });
  const [bulkDone, setBulkDone] = useState(false);

  // 이메일 추적 픽셀
  const [emailTrackId, setEmailTrackId] = useState<string>(() => generateLogId());
  const [emailTrackEnabled, setEmailTrackEnabled] = useState(false);

  // LinkedIn 직접 게시 상태
  const [liToken, setLiToken] = useState<string>('');
  const [liPersonId, setLiPersonId] = useState<string>('');
  const [liName, setLiName] = useState<string>('');
  const [liImage, setLiImage] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const [liPosting, setLiPosting] = useState(false);
  const [liPostFeedback, setLiPostFeedback] = useState('');
  const [liCardForExport, setLiCardForExport] = useState<CardItem | null>(null);
  const [liImageGenerating, setLiImageGenerating] = useState(false);

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
    setAiText('');
    setEmphasis(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const rawActiveText = aiMode && aiText ? aiText : generated;

  // 편집 모드로 진입하면 현재 텍스트를 편집창으로 복사
  const handleEditToggle = () => {
    if (!editMode) setEditText(stripMarkdown(rawActiveText));
    setEditMode(v => !v);
  };

  const activeText = editMode ? editText : rawActiveText;

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

  const logToCampaign = (channel: 'linkedin' | 'kakao' | 'email' | 'etc') => {
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

  // LinkedIn 카드 이미지 자동 생성
  const generateLinkedInImage = useCallback(async () => {
    if (!contentData) return;
    setLiImageGenerating(true);

    let card: CardItem;
    const customerLabel = contentData.customer === '전체 고객사' ? '에픽카 파트너' : contentData.customer;

    if (contentData.growthStr) {
      card = {
        layout: 'big-number',
        data: {
          tag: customerLabel,
          number: contentData.growthStr,
          unit: '매출 성장',
          desc: `${contentData.todayLabel} 에픽카 공급 성과`,
        },
      };
    } else {
      card = {
        layout: 'cover',
        data: {
          badge: `에픽카 × ${customerLabel}`,
          headline: `${contentData.monthsActive}개월 파트너십 성과`,
          subheadline: contentData.totalSales,
          highlight: contentData.topItem,
        },
      };
    }

    setLiCardForExport(card);
    await new Promise(r => setTimeout(r, 400));

    const el = document.getElementById('li-card-export');
    if (!el) { setLiImageGenerating(false); setLiCardForExport(null); return; }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      setLiImage({ base64, mime: 'image/png', name: `linkedin-${customerLabel}.png` });
    } catch (e) {
      console.error('이미지 생성 실패:', e);
    } finally {
      setLiCardForExport(null);
      setLiImageGenerating(false);
    }
  }, [contentData]);

  // CRM에서 첫 번째 담당자 번호 자동 로드
  useEffect(() => {
    if (customer && customer !== '__all__') {
      const crm = getCRMNote(customer);
      if (crm.contacts?.[0]?.phone) setSmsPhone(crm.contacts[0].phone);
    }
  }, [customer]);

  // MMS 카드 이미지 자동 생성
  const generateMmsImage = useCallback(async () => {
    if (!contentData) return;
    setMmsImageGenerating(true);

    let card: CardItem;
    const customerLabel = contentData.customer === '전체 고객사' ? '에픽카 파트너' : contentData.customer;

    if (contentData.growthStr) {
      card = {
        layout: 'big-number',
        data: {
          tag: customerLabel,
          number: contentData.growthStr,
          unit: '매출 성장',
          desc: `${contentData.todayLabel} 에픽카 공급 성과`,
        },
      };
    } else {
      card = {
        layout: 'cover',
        data: {
          badge: `에픽카 × ${customerLabel}`,
          headline: `${contentData.monthsActive}개월 파트너십 성과`,
          subheadline: contentData.totalSales,
          highlight: contentData.topItem,
        },
      };
    }

    setMmsCardForExport(card);
    await new Promise(r => setTimeout(r, 400));

    const el = document.getElementById('mms-card-export');
    if (!el) { setMmsImageGenerating(false); setMmsCardForExport(null); return; }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      setMmsImage({ base64, mime: 'image/png' });
    } catch (e) {
      console.error('MMS 이미지 생성 실패:', e);
    } finally {
      setMmsCardForExport(null);
      setMmsImageGenerating(false);
    }
  }, [contentData]);

  // 발송 body 빌더 (단건/일괄 공용)
  const buildSmsBody = (receiver: string, receiverName: string) => {
    const body: Record<string, unknown> = { receiver: receiver.replace(/-/g, ''), receiverName, content: activeText };
    const effectiveSubject = msgSubject || (contentData?.customer ? `에픽카 × ${contentData.customer}` : '에픽카 소식');
    if (contentType === 'mms' && mmsImage) {
      body.imageBase64 = mmsImage.base64;
      body.imageMimeType = mmsImage.mime;
      body.subject = effectiveSubject;
    } else if (contentType === 'lms') {
      body.subject = effectiveSubject;
    }
    return body;
  };

  // SMS 단건 발송
  const sendSMS = async () => {
    if (!smsPhone || !activeText) return;
    setSmsSending(true);
    setSmsFeedback('');
    try {
      const res = await fetch('/api/popbill/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSmsBody(smsPhone, contentData?.customer ?? '')),
      });
      const data = await res.json();
      if (!res.ok) {
        setSmsFeedback(`❌ ${data.error}`);
      } else {
        setSmsFeedback(`✅ ${data.msgType} 발송 완료`);
        logToCampaign('etc');
        addSendLog({
          channel: (data.msgType as string).toLowerCase() as 'sms' | 'lms' | 'mms',
          customer: contentData?.customer ?? '',
          receiver_masked: smsPhone.slice(-4).padStart(smsPhone.length, '*'),
          content_preview: activeText.slice(0, 40),
          receipt_num: data.receiptNum,
        });
      }
    } catch (e) {
      setSmsFeedback(`❌ ${String(e)}`);
    } finally {
      setSmsSending(false);
    }
  };

  // 일괄 발송
  const sendBulk = async () => {
    if (!bulkNumbers.length || !activeText) return;
    setBulkSending(true);
    setBulkDone(false);
    setBulkProgress({ done: 0, total: bulkNumbers.length, success: 0, fail: 0 });
    for (const { phone, name } of bulkNumbers) {
      try {
        const res = await fetch('/api/popbill/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildSmsBody(phone, name || (contentData?.customer ?? ''))),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        addSendLog({
          channel: (data.msgType as string).toLowerCase() as 'sms' | 'lms' | 'mms',
          customer: contentData?.customer ?? '',
          receiver_masked: phone.slice(-4).padStart(phone.length, '*'),
          content_preview: activeText.slice(0, 40),
          receipt_num: data.receiptNum,
        });
        setBulkProgress(p => ({ ...p, done: p.done + 1, success: p.success + 1 }));
      } catch {
        setBulkProgress(p => ({ ...p, done: p.done + 1, fail: p.fail + 1 }));
      }
      await new Promise(r => setTimeout(r, 300)); // 팝빌 rate limit 방지
    }
    logToCampaign('etc');
    setBulkSending(false);
    setBulkDone(true);
  };

  // 수신번호 파일 파싱 (CSV / Excel)
  const parseBulkFile = async (file: File) => {
    const isCsv = /\.(csv|txt)$/i.test(file.name);
    if (isCsv) {
      const text = await file.text();
      const rows = text.split('\n').map(l => l.trim()).filter(l => /\d{9,11}/.test(l));
      setBulkNumbers(rows.map(l => {
        const parts = l.split(',');
        return { phone: parts[0].replace(/[^0-9]/g, ''), name: parts[1]?.trim() ?? '' };
      }).filter(r => r.phone.length >= 9));
    } else {
      const XLSX = (await import('xlsx'));
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
        setBulkNumbers(rows.slice(1).map(r => ({
          phone: String(r[0] ?? '').replace(/[^0-9]/g, ''),
          name: String(r[1] ?? ''),
        })).filter(r => r.phone.length >= 9));
      };
      reader.readAsArrayBuffer(file);
    }
    setBulkDone(false);
  };

  // 카카오 친구톡 발송
  const sendKakaoFriendTalk = async () => {
    if (!smsPhone || !activeText) return;
    setKakaoSending(true);
    setKakaoFeedback('');
    try {
      const res = await fetch('/api/popbill/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: smsPhone.replace(/-/g, ''),
          receiverName: contentData?.customer ?? '',
          content: activeText,
          altContent: activeText, // 친구톡 실패 시 SMS 대체
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKakaoFeedback(`❌ ${data.error}`);
      } else {
        setKakaoFeedback('✅ 친구톡 발송 완료');
        logToCalendar('kakao');
        logToCampaign('kakao');
        addSendLog({
          channel: 'kakao',
          customer: contentData?.customer ?? '',
          receiver_masked: smsPhone.slice(-4).padStart(smsPhone.length, '*'),
          content_preview: activeText.slice(0, 40),
          receipt_num: data.receiptNum,
        });
      }
    } catch (e) {
      setKakaoFeedback(`❌ ${String(e)}`);
    } finally {
      setKakaoSending(false);
    }
  };

  // LinkedIn OAuth 팝업 로그인
  const linkedInLogin = () => {
    const popup = window.open('/api/linkedin/auth', 'linkedin-auth', 'width=600,height=700,scrollbars=yes');
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        setLiToken(e.data.accessToken);
        setLiPersonId(e.data.personId);
        setLiName(e.data.name);
        window.removeEventListener('message', handler);
        popup?.close();
      } else if (e.data?.type === 'LINKEDIN_AUTH_ERROR') {
        showFeedback('❌ LinkedIn 로그인 실패. 다시 시도해주세요.');
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);
  };

  // LinkedIn 직접 게시
  const postToLinkedIn = async () => {
    if (!liToken || !liPersonId) { linkedInLogin(); return; }
    setLiPosting(true);
    setLiPostFeedback('');
    const text = activeText;
    try {
      const res = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: liToken,
          personId: liPersonId,
          text,
          imageBase64: liImage?.base64,
          imageMimeType: liImage?.mime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLiPostFeedback(`❌ ${data.error ?? '게시 실패'}`);
      } else {
        setLiPostFeedback('✅ LinkedIn에 게시됐습니다!');
        logToCalendar('linkedin');
        logToCampaign('linkedin');
      }
    } catch (e) {
      setLiPostFeedback(`❌ ${String(e)}`);
    } finally {
      setLiPosting(false);
    }
  };

  // LinkedIn 이미지 파일 선택
  const handleLiImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setLiImage({ base64, mime: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

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
          proposalContext: linkedProposal ?? undefined,
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
  }, [contentData, contentType, linkedProposal]);

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

  // ─ SMS 공용 발송 패널 (SMS/LMS/MMS 세 탭 모두에서 사용) ─
  const isMmsReady = contentType !== 'mms' || !!mmsImage;
  const SmsSendPanel = (
    <div>
      {/* 단건 발송 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="수신번호 01012345678"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
        <button onClick={sendSMS} disabled={smsSending || !smsPhone || !isMmsReady}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: (!smsPhone || !isMmsReady || smsSending) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, background: (!smsPhone || !isMmsReady || smsSending) ? '#E2E8F0' : '#191F28', color: (!smsPhone || !isMmsReady || smsSending) ? '#8B95A1' : 'white', whiteSpace: 'nowrap' }}>
          {smsSending ? '발송 중...' : contentType === 'sms' ? '📱 SMS 발송' : contentType === 'lms' ? '📄 LMS 발송' : '🖼️ MMS 발송'}
        </button>
      </div>
      {smsFeedback && <p style={{ fontSize: 12, fontWeight: 600, color: smsFeedback.startsWith('✅') ? '#00B386' : '#EF4444', marginBottom: 8 }}>{smsFeedback}</p>}

      {/* 일괄 발송 */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1' }}>📋 일괄 발송</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px dashed #8B95A1', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#8B95A1', background: 'white' }}>
            파일 등록 (CSV/Excel)
            <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) parseBulkFile(f); e.target.value = ''; }} style={{ display: 'none' }} />
          </label>
          {bulkNumbers.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: '#005957', fontWeight: 700 }}>{bulkNumbers.length}건 등록됨</span>
              <button onClick={() => { setBulkNumbers([]); setBulkDone(false); }} style={{ fontSize: 11, color: '#8B95A1', background: 'none', border: 'none', cursor: 'pointer' }}>지우기</button>
            </>
          )}
        </div>

        {/* 수신번호 목록 미리보기 */}
        {bulkNumbers.length > 0 && (
          <div style={{ maxHeight: 120, overflowY: 'auto', background: 'white', border: '1px solid #E2E8F0', borderRadius: 7, padding: '6px 10px', marginBottom: 8, fontSize: 12, color: '#374151' }}>
            {bulkNumbers.slice(0, 50).map((r, i) => (
              <div key={i} style={{ padding: '2px 0', borderBottom: i < bulkNumbers.length - 1 ? '1px solid #F2F4F6' : 'none', display: 'flex', gap: 12 }}>
                <span style={{ color: '#8B95A1', minWidth: 20 }}>{i + 1}</span>
                <span>{r.phone}</span>
                {r.name && <span style={{ color: '#8B95A1' }}>{r.name}</span>}
              </div>
            ))}
            {bulkNumbers.length > 50 && <p style={{ color: '#8B95A1', marginTop: 4 }}>... 외 {bulkNumbers.length - 50}건</p>}
          </div>
        )}

        {/* 일괄 발송 진행 */}
        {bulkSending && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8B95A1', marginBottom: 4 }}>
              <span>발송 중 {bulkProgress.done} / {bulkProgress.total}</span>
              <span style={{ color: '#005957' }}>성공 {bulkProgress.success} · 실패 {bulkProgress.fail}</span>
            </div>
            <div style={{ height: 4, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#005957', borderRadius: 4, width: `${(bulkProgress.done / bulkProgress.total) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
        {bulkDone && (
          <p style={{ fontSize: 12, fontWeight: 600, color: '#00B386' }}>
            ✅ 일괄 발송 완료 — 성공 {bulkProgress.success}건 / 실패 {bulkProgress.fail}건
          </p>
        )}

        {bulkNumbers.length > 0 && !bulkSending && !bulkDone && (
          <button onClick={sendBulk} disabled={!isMmsReady}
            style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', cursor: isMmsReady ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, background: isMmsReady ? '#005957' : '#E2E8F0', color: isMmsReady ? 'white' : '#8B95A1' }}>
            {contentType === 'mms' && !mmsImage ? '이미지를 먼저 첨부하세요' : `🚀 ${bulkNumbers.length}건 일괄 발송 시작`}
          </button>
        )}
      </div>
    </div>
  );

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

            {/* 제안서 연동 배지 */}
            {linkedProposal && (
              <div style={{ padding: '8px 12px', background: '#E6F2F2', border: '1px solid #A7F3D0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#005957', fontWeight: 600 }}>📋 제안서 연동됨: {linkedProposal.title}</span>
                <button onClick={() => { setLinkedProposal(null); sessionStorage.removeItem('eficar-proposal-context'); }}
                  style={{ fontSize: 11, color: '#8B95A1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕ 해제</button>
              </div>
            )}

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

              {/* 편집 토글 버튼 */}
              {rawActiveText && !aiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <button
                    onClick={handleEditToggle}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                      border: `1px solid ${editMode ? '#005957' : '#E5E7EB'}`,
                      background: editMode ? '#E6F2F2' : 'white',
                      color: editMode ? '#005957' : '#6B7280', cursor: 'pointer',
                    }}
                  >
                    {editMode ? '✅ 편집 완료' : '✏️ 직접 편집'}
                  </button>
                </div>
              )}

              <div style={{
                flex: 1, background: '#F8F9FA', borderRadius: 12,
                padding: editMode ? 0 : '20px',
                fontSize: 14, lineHeight: 1.9, color: '#191F28',
                minHeight: 360,
                border: `1px solid ${editMode ? '#005957' : (aiMode && aiText ? '#005957' : '#F2F4F6')}`,
                overflow: 'hidden',
              }}>
                {aiMode && aiLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#8B95A1', padding: '20px' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid #E6F2F2', borderTopColor: '#005957', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 13 }}>AI가 문구를 작성하고 있습니다...</span>
                  </div>
                ) : editMode ? (
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    style={{
                      width: '100%', height: '100%', minHeight: 360,
                      border: 'none', outline: 'none', resize: 'vertical',
                      background: 'transparent', padding: '20px',
                      fontSize: 14, lineHeight: 1.9, color: '#191F28',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                ) : rawActiveText ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {stripMarkdown(rawActiveText).split('\n').map((line, i) => {
                      const emphEmojis: Record<string, string> = { growth: '📈', savings: '💰', expand: '🔧', newpropo: '🆕', total: '📊' };
                      const isHighlighted = emphasis.length > 0 && emphasis.some(key => line.startsWith(emphEmojis[key] ?? ' '));
                      return (
                        <span key={i} style={{
                          display: 'block',
                          background: isHighlighted ? '#FFFDE7' : 'transparent',
                          fontWeight: isHighlighted ? 700 : 400,
                          borderLeft: isHighlighted ? '3px solid #F59E0B' : '3px solid transparent',
                          paddingLeft: isHighlighted ? 8 : 0,
                          borderRadius: 4,
                          transition: 'all 0.15s',
                        }}>
                          {line || ' '}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                    <p style={{ fontSize: 32 }}>✍️</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>
                      {aiMode
                        ? linkedProposal ? '제안서 내용을 반영해 AI 생성합니다' : 'AI로 생성하기를 눌러주세요'
                        : '좌측 설정 후 생성하기를 눌러주세요'}
                    </p>
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
                      {/* 열람 추적 픽셀 */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" checked={emailTrackEnabled} onChange={e => {
                          setEmailTrackEnabled(e.target.checked);
                          if (e.target.checked) setEmailTrackId(generateLogId());
                        }} style={{ accentColor: '#005957', width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: emailTrackEnabled ? '#005957' : '#8B95A1' }}>열람 추적 픽셀 포함</span>
                      </label>
                      {emailTrackEnabled && (
                        <div style={{ marginTop: 6, padding: '8px 10px', background: '#F0FDF9', borderRadius: 7, border: '1px solid #A7F3D0' }}>
                          <p style={{ fontSize: 11, color: '#005957', fontWeight: 600, marginBottom: 4 }}>이메일 본문 하단에 추가할 HTML</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code style={{ fontSize: 10, color: '#374151', background: 'white', padding: '4px 6px', borderRadius: 4, border: '1px solid #E5E7EB', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {`<img src="${buildTrackingPixelUrl(emailTrackId)}" width="1" height="1" />`}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`<img src="${buildTrackingPixelUrl(emailTrackId)}" width="1" height="1" style="display:none" />`);
                                addSendLog({ id: emailTrackId, channel: 'email', customer: contentData?.customer ?? '', receiver_masked: recipientEmail || '미입력', content_preview: activeText.slice(0, 40) });
                              }}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #005957', background: 'white', color: '#005957', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              복사
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LinkedIn 이미지 첨부 + 직접 게시 */}
                  {contentType === 'linkedin' && activeText && (
                    <div style={{ marginBottom: 12 }}>
                      {liName && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#00B386', fontWeight: 600 }}>✓ {liName} 연결됨</span>
                        </div>
                      )}

                      {/* 이미지 첨부 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={generateLinkedInImage}
                          disabled={liImageGenerating || !contentData}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 7, border: '1px solid #005957', cursor: liImageGenerating ? 'not-allowed' : 'pointer',
                            fontSize: 12, fontWeight: 600, color: '#005957', background: '#E6F2F2',
                            opacity: liImageGenerating ? 0.6 : 1,
                          }}
                        >
                          {liImageGenerating ? '⏳ 생성 중...' : '🎨 카드 이미지 자동 생성'}
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: '1px dashed #8B95A1', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8B95A1', background: 'white' }}>
                          🖼️ 직접 첨부
                          <input type="file" accept="image/*" onChange={handleLiImage} style={{ display: 'none' }} />
                        </label>
                        {liImage && (
                          <span style={{ fontSize: 12, color: '#005957', fontWeight: 600 }}>
                            {liImage.name}
                            <button onClick={() => setLiImage(null)} style={{ marginLeft: 6, color: '#8B95A1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
                          </span>
                        )}
                      </div>

                      {/* 게시 버튼 */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={postToLinkedIn}
                          disabled={liPosting}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: liPosting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, background: '#0A66C2', color: 'white', opacity: liPosting ? 0.7 : 1 }}
                        >
                          {liPosting ? '게시 중...' : liToken ? '💼 LinkedIn에 바로 게시' : '💼 LinkedIn 로그인 후 게시'}
                        </button>
                      </div>
                      {liPostFeedback && (
                        <p style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: liPostFeedback.startsWith('✅') ? '#00B386' : '#EF4444' }}>{liPostFeedback}</p>
                      )}
                    </div>
                  )}

                  {/* SMS 발송 패널 */}
                  {contentType === 'sms' && activeText && (() => {
                    const bytes = getByteLen(activeText);
                    const over = bytes > 90;
                    return (
                      <div style={{ marginBottom: 12, padding: '14px 16px', background: '#F8F9FA', borderRadius: 10, border: `1px solid ${over ? '#FCA5A5' : '#E2E8F0'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>📱 SMS 발송</p>
                          <span style={{ fontSize: 11, fontWeight: 700, color: over ? '#DC2626' : '#005957', background: over ? '#FEF2F2' : '#E6F2F2', padding: '3px 10px', borderRadius: 12 }}>
                            {bytes}바이트 / 90 {over ? '⚠️ 초과 — LMS 탭 사용 권장' : ''}
                          </span>
                        </div>
                        {SmsSendPanel}
                      </div>
                    );
                  })()}

                  {/* LMS 발송 패널 */}
                  {contentType === 'lms' && activeText && (() => {
                    const len = activeText.replace(/^제목:.*\n\n?/, '').length;
                    const over = len > 2000;
                    return (
                      <div style={{ marginBottom: 12, padding: '14px 16px', background: '#F8F9FA', borderRadius: 10, border: `1px solid ${over ? '#FCA5A5' : '#E2E8F0'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>📄 LMS 발송</p>
                          <span style={{ fontSize: 11, fontWeight: 700, color: over ? '#DC2626' : '#0A66C2', background: over ? '#FEF2F2' : '#EFF6FF', padding: '3px 10px', borderRadius: 12 }}>
                            본문 {len}자 / 2,000
                          </span>
                        </div>
                        <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)}
                          placeholder={`제목 (예: [에픽카] ${contentData?.customer ?? ''} 성과 공유)`}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }} />
                        {SmsSendPanel}
                      </div>
                    );
                  })()}

                  {/* MMS 발송 패널 */}
                  {contentType === 'mms' && activeText && (
                    <div style={{ marginBottom: 12, padding: '14px 16px', background: '#F8F9FA', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>🖼️ MMS 발송</p>
                        {mmsImage
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '3px 10px', borderRadius: 12 }}>이미지 준비됨 ✅</span>
                          : <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', background: '#FFFBEB', padding: '3px 10px', borderRadius: 12 }}>이미지 필수</span>}
                      </div>

                      {/* 제목 */}
                      <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)}
                        placeholder={`제목 (예: [에픽카] ${contentData?.customer ?? ''} 성과 리포트)`}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }} />

                      {/* 이미지 섹션 */}
                      <div style={{ marginBottom: 10, padding: '10px 12px', background: '#F0FDF9', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: mmsImage ? 10 : 0 }}>
                          <button onClick={generateMmsImage} disabled={mmsImageGenerating || !contentData}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: '1px solid #005957', cursor: mmsImageGenerating ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, color: '#005957', background: 'white', opacity: mmsImageGenerating ? 0.6 : 1 }}>
                            {mmsImageGenerating ? '⏳ 생성 중...' : '🎨 성과 카드 자동 생성'}
                          </button>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px dashed #8B95A1', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8B95A1', background: 'white' }}>
                            📁 파일 첨부
                            <input type="file" accept="image/*" onChange={e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => { const r = reader.result as string; setMmsImage({ base64: r.split(',')[1], mime: file.type }); };
                              reader.readAsDataURL(file);
                            }} style={{ display: 'none' }} />
                          </label>
                          {mmsImage && (
                            <button onClick={() => setMmsImage(null)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: 'white', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>삭제</button>
                          )}
                        </div>
                        {/* ★ 이미지 미리보기 */}
                        {mmsImage && (
                          <img
                            src={`data:${mmsImage.mime};base64,${mmsImage.base64}`}
                            alt="MMS 이미지 미리보기"
                            style={{ width: '100%', maxWidth: 340, borderRadius: 8, display: 'block', border: '1px solid #E2E8F0' }}
                          />
                        )}
                      </div>

                      {SmsSendPanel}
                    </div>
                  )}

                  {/* 팝빌 직접 발송 (카카오 친구톡 + SMS 보조) */}
                  {(contentType === 'kakao' || contentType === 'email') && activeText && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>📱 직접 발송</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <input
                          value={smsPhone}
                          onChange={e => setSmsPhone(e.target.value)}
                          placeholder="01012345678"
                          style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, width: 150, fontFamily: 'inherit' }}
                        />
                        {contentType === 'kakao' && (
                          <button
                            onClick={sendKakaoFriendTalk}
                            disabled={kakaoSending || !smsPhone}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', cursor: kakaoSending || !smsPhone ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, background: '#FEE500', color: '#191F28', opacity: kakaoSending || !smsPhone ? 0.5 : 1 }}
                          >
                            {kakaoSending ? '발송 중...' : '💬 친구톡 발송'}
                          </button>
                        )}
                        <button
                          onClick={sendSMS}
                          disabled={smsSending || !smsPhone}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: '1px solid #E2E8F0', cursor: (smsSending || !smsPhone) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, background: 'white', color: '#191F28', opacity: (smsSending || !smsPhone) ? 0.5 : 1 }}
                        >
                          {smsSending ? '발송 중...' : '📨 문자 발송'}
                        </button>
                      </div>
                      {kakaoFeedback && <p style={{ fontSize: 12, fontWeight: 600, color: kakaoFeedback.startsWith('✅') ? '#00B386' : '#EF4444', marginBottom: 4 }}>{kakaoFeedback}</p>}
                      {smsFeedback && <p style={{ fontSize: 12, fontWeight: 600, color: smsFeedback.startsWith('✅') ? '#00B386' : '#EF4444' }}>{smsFeedback}</p>}
                    </div>
                  )}

                  {/* 채널별 전송 버튼 */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {contentType === 'linkedin' && (
                      <button onClick={sendLinkedIn} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: 'white', color: '#8B95A1', transition: 'all 0.15s',
                      }}>
                        <ExternalLink style={{ width: 13, height: 13 }} /> 공유 창으로 열기
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
      {/* LinkedIn 카드 이미지 생성용 숨김 캔버스 */}
      {liCardForExport && (
        <div
          id="li-card-export"
          style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none' }}
        >
          <CardCanvas card={liCardForExport} ratio="4:5" forExport />
        </div>
      )}
      {/* MMS 카드 이미지 생성용 숨김 캔버스 */}
      {mmsCardForExport && (
        <div
          id="mms-card-export"
          style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none' }}
        >
          <CardCanvas card={mmsCardForExport} ratio="16:9" forExport />
        </div>
      )}
    </main>
  );
}

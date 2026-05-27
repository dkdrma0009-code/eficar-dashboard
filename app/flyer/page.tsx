'use client';

import { useState, useRef, useCallback } from 'react';
import { Download, Send, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { addSendLog } from '@/lib/sendLogStorage';

/* ─────────────────────────── 타입 ─────────────────────────── */
type TemplateKey = 'gs25_event' | 'wheel_buyback' | 'epichub_recruit' | 'custom_promo';

interface Gs25EventData {
  partName: string;          // 시트 / 휠 / 헤드램프
  couponAmount: string;      // 5000 / 3000
  targetCompany: string;     // SK렌터카 / 롯데렌탈
  period: string;
  contactNum: string;
  partnerLogo: 'sk' | 'lotte' | 'none';
}
interface WheelBuybackData {
  minSize: number;
  maxSize: number;
  priceStep: number;
  basePrice: number;
  pickupMin: number;
  contactNum: string;
}
interface EpichubData {
  benefit1: string;
  benefit2: string;
  benefit3: string;
  targetArea: string;
  contactNum: string;
}
interface CustomPromoData {
  title: string;
  subtitle: string;
  desc: string;
  ctaText: string;
  contactNum: string;
  bgColor: string;
}

/* ─────────────────────── html2canvas 동적 로드 ─────────────────────── */
async function captureElement(el: HTMLElement): Promise<string> {
  const h2c = (await import('html2canvas')).default;
  const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  return canvas.toDataURL('image/jpeg', 0.95);
}

/* ══════════════════════════ 템플릿 컴포넌트들 ══════════════════════════ */

function Gs25EventFlyer({ d }: { d: Gs25EventData }) {
  return (
    <div style={{ width: 480, fontFamily: "'Noto Sans KR', sans-serif", background: '#fff', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #005BAC 0%, #0077CC 100%)', padding: '28px 24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#FFD700', borderRadius: 8, padding: '4px 16px', marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#005BAC', letterSpacing: -1 }}>GS25</span>
        </div>
        <div style={{ color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>에픽카 에서</div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 900, lineHeight: 1.3 }}>
          [{d.partName}] 교체 주문 시<br />
          <span style={{ color: '#FFD700' }}>GS25 상품권 드려요!</span>
        </div>
      </div>

      {/* 프로세스 */}
      <div style={{ background: '#F0F7FF', padding: '20px 24px' }}>
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#005BAC', marginBottom: 14 }}>
          주문 시 에픽카에 연락주세요
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, alignItems: 'center' }}>
          {[
            { num: '1', icon: '🔍', label: '손상 확인', sub: d.targetCompany + ' 차량' },
            { num: '→', icon: '', label: '', sub: '' },
            { num: '2', icon: '📞', label: '에픽카 연락', sub: '전화 또는 카카오' },
            { num: '→', icon: '', label: '', sub: '' },
            { num: '3', icon: '🎁', label: '상품권 수령', sub: '주문 익일 발송' },
          ].map((s, i) =>
            s.icon === '' ? (
              <div key={i} style={{ color: '#005BAC', fontSize: 18, fontWeight: 700, padding: '0 6px' }}>→</div>
            ) : (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#005BAC', color: 'white', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>{s.num}</div>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>{s.sub}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* 연락처 */}
      <div style={{ background: '#005957', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>📞</span>
        <div>
          <div style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>에픽카 대표 번호</div>
          <div style={{ color: '#7EDCD9', fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>{d.contactNum}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>전화 또는 카카오톡 채널로 문의</div>
        </div>
      </div>

      {/* 이벤트 박스 */}
      <div style={{ padding: '20px 24px', background: '#fff' }}>
        <div style={{ textAlign: 'center', background: '#FFD700', borderRadius: 8, padding: '6px 0', fontSize: 16, fontWeight: 900, color: '#1A1A1A', marginBottom: 16 }}>✨ Event</div>
        <div style={{ fontSize: 15, textAlign: 'center', color: '#191F28', marginBottom: 14, lineHeight: 1.6 }}>
          {d.partName} 주문 한 건당,<br />
          <strong style={{ color: '#005957' }}>에픽카가 GS25 {d.couponAmount}원 상품권 쏩니다!</strong>
        </div>
        {[
          { label: '대상 차량', value: d.targetCompany + ' 차량' },
          { label: '대상 부품', value: d.partName },
          { label: '전송일', value: '사용건 확인 후 익일' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ background: '#005957', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>{r.label}</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{r.value}</div>
          </div>
        ))}
        <div style={{ textAlign: 'center', color: '#EF4444', fontSize: 12, fontWeight: 600, marginTop: 10 }}>* 무한대로 수령 가능!</div>
      </div>

      {/* 기간 + 하단 */}
      <div style={{ background: '#F8F9FA', padding: '12px 24px', fontSize: 12, color: '#6B7280' }}>
        <div>📅 기간: {d.period}</div>
      </div>
      <div style={{ background: '#1A1A2E', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {d.partnerLogo === 'sk' && <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>SK 렌터카</div>}
        {d.partnerLogo === 'lotte' && <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>롯데렌탈</div>}
        <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: 20, width: 'auto' }} />
        <div style={{ color: '#6B7280', fontSize: 11 }}>프로모션 사전 공지 없이 조기 종료될 수 있습니다.</div>
      </div>
    </div>
  );
}

function WheelBuybackFlyer({ d }: { d: WheelBuybackData }) {
  const rows: { size: string; price: string }[] = [];
  for (let s = d.minSize; s <= d.maxSize; s++) {
    const price = d.basePrice + (s - d.minSize) * d.priceStep;
    rows.push({ size: `${s}인치`, price: price.toLocaleString() });
  }
  return (
    <div style={{ width: 480, fontFamily: "'Noto Sans KR', sans-serif", background: '#fff', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ background: '#F8F9FA', padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <img src="/eficar_logo.png" alt="에픽카" style={{ height: 22, width: 'auto' }} />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
            더 자세한 내용이 궁금하신가요?<br />
            <strong style={{ color: '#191F28' }}>{d.contactNum}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#191F28', lineHeight: 1.2 }}>
              휠 1개부터<br />고가 매입합니다
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{d.pickupMin}개 이상이면 직접 방문해서 수거해드립니다</div>
          </div>
          <div style={{ fontSize: 48 }}>🚗</div>
        </div>
        <div style={{ marginTop: 12, background: '#005957', color: 'white', fontSize: 11, padding: '5px 12px', borderRadius: 4, display: 'inline-block' }}>버리는 부품들은 에픽카로!</div>
      </div>

      {/* 가격표 */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#191F28', marginBottom: 12 }}>휠 매입 가격표</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ background: '#1A1A2E', color: 'white', padding: '10px', fontWeight: 700, borderRadius: '6px 0 0 0' }}>SIZE</th>
              <th style={{ background: '#EF4444', color: 'white', padding: '10px', fontWeight: 700, borderRadius: '0 6px 0 0' }}>매입 가격 (원)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.size} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid #F2F4F6' }}>{r.size}</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#EF4444', fontWeight: 700, borderBottom: '1px solid #F2F4F6' }}>{r.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: '#EF4444', marginTop: 8 }}>ⓘ 순정 휠·알루미늄 휠 기준 / 재제조 불가시 매입 가격에서 만원 차감</div>
      </div>

      {/* 절차 */}
      <div style={{ background: '#E6F2F2', padding: '16px 24px', margin: '0 24px 16px', borderRadius: 10 }}>
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#005957', marginBottom: 12 }}>신속 매입 절차</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { n: '1', label: '전화 문의', sub: d.contactNum },
            { n: '2', label: '발송/수거', sub: '택배 or 방문' },
            { n: '3', label: '신속 입금', sub: '검수 후 처리' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#005957', color: 'white', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>{s.n}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 */}
      <div style={{ background: '#005957', padding: '16px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: 18, width: 'auto' }} />
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>에 전화하세요!</span>
        </div>
        <div style={{ color: '#7EDCD9', fontSize: 24, fontWeight: 900, letterSpacing: 2, marginTop: 4 }}>{d.contactNum}</div>
      </div>
    </div>
  );
}

function EpichubFlyer({ d }: { d: EpichubData }) {
  return (
    <div style={{ width: 480, fontFamily: "'Noto Sans KR', sans-serif", background: '#fff', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #005957 0%, #007A78 100%)', padding: '32px 24px', textAlign: 'center', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.9, marginBottom: 8 }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: 18, width: 'auto' }} />
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>공식 파트너 네트워크</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.3 }}>에픽허브 정비소<br />파트너 모집 중!</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 10 }}>{d.targetArea} 지역 우선 모집</div>
      </div>

      <div style={{ padding: '24px 24px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#191F28', marginBottom: 14 }}>파트너 가입 혜택</div>
        {[d.benefit1, d.benefit2, d.benefit3].filter(Boolean).map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#005957', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: '0 24px 20px', background: '#E6F2F2', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#005957', marginBottom: 10 }}>가입 방법</div>
        {[
          { s: '1', t: '전화 or 카카오 채널 문의' },
          { s: '2', t: '계약서 작성 및 시스템 등록' },
          { s: '3', t: '부품 발주 즉시 시작!' },
        ].map(s => (
          <div key={s.s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#005957', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.s}</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{s.t}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#005957', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>📞</span>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>문의 전화</div>
          <div style={{ color: '#7EDCD9', fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>{d.contactNum}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>전화 또는 카카오톡 채널</div>
        </div>
      </div>
    </div>
  );
}

function CustomPromoFlyer({ d }: { d: CustomPromoData }) {
  return (
    <div style={{ width: 480, fontFamily: "'Noto Sans KR', sans-serif", background: '#fff', overflow: 'hidden' }}>
      <div style={{ background: d.bgColor || '#005957', padding: '36px 24px', textAlign: 'center', color: 'white' }}>
        <div style={{ opacity: 0.9, marginBottom: 8 }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: 18, width: 'auto' }} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.3 }}>{d.title || '제목을 입력하세요'}</div>
        {d.subtitle && <div style={{ fontSize: 16, fontWeight: 600, opacity: 0.9, marginTop: 8 }}>{d.subtitle}</div>}
      </div>
      <div style={{ padding: '28px 24px' }}>
        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{d.desc || '내용을 입력하세요.'}</div>
      </div>
      {d.ctaText && (
        <div style={{ margin: '0 24px 20px' }}>
          <div style={{ background: d.bgColor || '#005957', color: 'white', textAlign: 'center', padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 800 }}>{d.ctaText}</div>
        </div>
      )}
      <div style={{ background: '#005957', padding: '16px 24px', textAlign: 'center' }}>
        <div style={{ color: '#7EDCD9', fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>{d.contactNum || '010-2752-1054'}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>전화 또는 카카오톡 채널로 문의</div>
      </div>
    </div>
  );
}

/* ══════════════════════════ 메인 페이지 ══════════════════════════ */
const TEMPLATES: { key: TemplateKey; label: string; emoji: string; desc: string }[] = [
  { key: 'gs25_event', label: 'GS25 상품권 이벤트', emoji: '🎁', desc: '부품 교체 시 GS25 쿠폰 지급 안내' },
  { key: 'wheel_buyback', label: '휠 매입 가격표', emoji: '🔩', desc: '인치별 매입 가격 안내문' },
  { key: 'epichub_recruit', label: '에픽허브 파트너 모집', emoji: '🏪', desc: '정비소 파트너 가입 안내' },
  { key: 'custom_promo', label: '자유 형식 프로모션', emoji: '✏️', desc: '제목·내용 직접 입력' },
];

export default function FlyerPage() {
  const [selected, setSelected] = useState<TemplateKey>('gs25_event');
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // MMS 발송 상태
  const [mmsSubject, setMmsSubject] = useState('');
  const [mmsPhone, setMmsPhone] = useState('');
  const [mmsSending, setMmsSending] = useState(false);
  const [mmsFeedback, setMmsFeedback] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState<{ phone: string; name: string }[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, success: 0, fail: 0 });
  const [bulkDone, setBulkDone] = useState(false);

  // 각 템플릿 상태
  const [gs25, setGs25] = useState<Gs25EventData>({
    partName: '시트', couponAmount: '5000', targetCompany: 'SK렌터카',
    period: '26.05.01 ~ 26.05.31', contactNum: '010-2752-1054', partnerLogo: 'sk',
  });
  const [wheel, setWheel] = useState<WheelBuybackData>({
    minSize: 16, maxSize: 22, priceStep: 5000, basePrice: 35000,
    pickupMin: 10, contactNum: '010-2752-1054',
  });
  const [hub, setHub] = useState<EpichubData>({
    benefit1: '재제조 부품 30~50% 할인 공급 (헤드램프·휠·에픽렌즈)',
    benefit2: '에픽카 공식 파트너 인증 스티커 제공',
    benefit3: '긴급 재고 당일 출고 · 전담 영업 배정',
    targetArea: '수도권·경기',
    contactNum: '010-2752-1054',
  });
  const [custom, setCustom] = useState<CustomPromoData>({
    title: '', subtitle: '', desc: '', ctaText: '', contactNum: '010-2752-1054', bgColor: '#005957',
  });

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await captureElement(previewRef.current);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `eficar_flyer_${selected}_${Date.now()}.jpg`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }, [selected]);

  // 이미지 캡처 후 단건 MMS 발송
  const sendMms = useCallback(async (phone: string, name: string) => {
    if (!previewRef.current || !phone) return false;
    const dataUrl = await captureElement(previewRef.current);
    const base64 = dataUrl.split(',')[1];
    const subject = mmsSubject || '에픽카 안내문';
    const content = `[에픽카] ${subject}\n자세한 내용은 이미지를 확인해 주세요.\n문의: 010-2752-1054`;
    const res = await fetch('/api/popbill/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver: phone.replace(/-/g, ''),
        receiverName: name || '수신자',
        subject,
        content,
        imageBase64: base64,
        imageMimeType: 'image/jpeg',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '발송 실패');
    addSendLog({
      channel: 'mms',
      customer: name || '수신자',
      receiver_masked: phone.slice(-4).padStart(phone.length, '*'),
      content_preview: `[안내문] ${subject}`,
      receipt_num: data.receiptNum,
    });
    return true;
  }, [mmsSubject]);

  // 단건 발송 핸들러
  const handleSendSingle = async () => {
    if (!mmsPhone) return;
    setMmsSending(true);
    setMmsFeedback('');
    try {
      await sendMms(mmsPhone, '');
      setMmsFeedback('✅ MMS 발송 완료');
    } catch (e) {
      setMmsFeedback(`❌ ${e instanceof Error ? e.message : '발송 실패'}`);
    } finally {
      setMmsSending(false);
    }
  };

  // 대량 발송
  const handleSendBulk = async () => {
    if (!bulkNumbers.length) return;
    setBulkSending(true);
    setBulkDone(false);
    setBulkProgress({ done: 0, total: bulkNumbers.length, success: 0, fail: 0 });
    for (const { phone, name } of bulkNumbers) {
      try {
        await sendMms(phone, name);
        setBulkProgress(p => ({ ...p, done: p.done + 1, success: p.success + 1 }));
      } catch {
        setBulkProgress(p => ({ ...p, done: p.done + 1, fail: p.fail + 1 }));
      }
      await new Promise(r => setTimeout(r, 400));
    }
    setBulkSending(false);
    setBulkDone(true);
  };

  // 수신번호 파일 파싱
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
      const XLSX = await import('xlsx');
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 6,
    fontSize: 13, color: '#191F28', fontFamily: 'inherit', outline: 'none', background: 'white',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, display: 'block' };

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191F28' }}>안내문 / 플라이어 생성기</h1>
          <p style={{ fontSize: 13, color: '#8B95A1', marginTop: 4 }}>템플릿 선택 → 내용 입력 → 이미지 다운로드 후 MMS 발송</p>
        </div>

        {/* 템플릿 선택 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {TEMPLATES.map(t => (
            <button key={t.key} onClick={() => setSelected(t.key)} style={{
              padding: '12px 14px', borderRadius: 10, border: `2px solid ${selected === t.key ? '#005957' : '#E5E7EB'}`,
              background: selected === t.key ? '#E6F2F2' : 'white', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: selected === t.key ? '#005957' : '#191F28' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* 편집 패널 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, cursor: 'pointer' }}
              onClick={() => setExpanded(e => !e)}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>✏️ 내용 편집</span>
              {expanded ? <ChevronUp style={{ width: 16, height: 16, color: '#8B95A1' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#8B95A1' }} />}
            </div>

            {expanded && selected === 'gs25_event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>부품명</label>
                  <select value={gs25.partName} onChange={e => setGs25(p => ({ ...p, partName: e.target.value }))} style={inputStyle}>
                    {['시트', '휠', '헤드램프', '에픽렌즈', '에어백'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>상품권 금액 (원)</label>
                  <select value={gs25.couponAmount} onChange={e => setGs25(p => ({ ...p, couponAmount: e.target.value }))} style={inputStyle}>
                    {['3000', '5000', '7000', '10000'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>대상 고객사</label>
                  <select value={gs25.targetCompany} onChange={e => setGs25(p => ({ ...p, targetCompany: e.target.value, partnerLogo: e.target.value.includes('SK') ? 'sk' : e.target.value.includes('롯데') ? 'lotte' : 'none' }))} style={inputStyle}>
                    {['SK렌터카', '롯데렌탈', '삼성화재', '그린카', '전체 고객사'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>기간</label>
                  <input value={gs25.period} onChange={e => setGs25(p => ({ ...p, period: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>연락처</label>
                  <input value={gs25.contactNum} onChange={e => setGs25(p => ({ ...p, contactNum: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            )}

            {expanded && selected === 'wheel_buyback' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: '최소 인치', key: 'minSize', type: 'number' },
                  { label: '최대 인치', key: 'maxSize', type: 'number' },
                  { label: '기본 금액 (최소 인치)', key: 'basePrice', type: 'number' },
                  { label: '인치당 추가 금액', key: 'priceStep', type: 'number' },
                  { label: '직접수거 최소 수량', key: 'pickupMin', type: 'number' },
                  { label: '연락처', key: 'contactNum', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} value={(wheel as unknown as Record<string, unknown>)[f.key] as string}
                      onChange={e => setWheel(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      style={inputStyle} />
                  </div>
                ))}
              </div>
            )}

            {expanded && selected === 'epichub_recruit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: '혜택 1', key: 'benefit1' },
                  { label: '혜택 2', key: 'benefit2' },
                  { label: '혜택 3', key: 'benefit3' },
                  { label: '모집 지역', key: 'targetArea' },
                  { label: '연락처', key: 'contactNum' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input value={(hub as unknown as Record<string, unknown>)[f.key] as string}
                      onChange={e => setHub(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
              </div>
            )}

            {expanded && selected === 'custom_promo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>제목</label>
                  <input value={custom.title} onChange={e => setCustom(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="메인 타이틀" />
                </div>
                <div>
                  <label style={labelStyle}>부제목</label>
                  <input value={custom.subtitle} onChange={e => setCustom(p => ({ ...p, subtitle: e.target.value }))} style={inputStyle} placeholder="선택 사항" />
                </div>
                <div>
                  <label style={labelStyle}>본문 내용</label>
                  <textarea value={custom.desc} onChange={e => setCustom(p => ({ ...p, desc: e.target.value }))}
                    style={{ ...inputStyle, height: 100, resize: 'vertical' }} placeholder="이벤트 내용, 조건 등..." />
                </div>
                <div>
                  <label style={labelStyle}>하단 버튼 문구</label>
                  <input value={custom.ctaText} onChange={e => setCustom(p => ({ ...p, ctaText: e.target.value }))} style={inputStyle} placeholder="예: 지금 바로 문의하세요!" />
                </div>
                <div>
                  <label style={labelStyle}>배경색</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['#005957', '#005BAC', '#7C3AED', '#DC2626', '#B45309', '#1A1A2E'].map(c => (
                      <div key={c} onClick={() => setCustom(p => ({ ...p, bgColor: c }))}
                        style={{ width: 30, height: 30, borderRadius: 6, background: c, cursor: 'pointer', border: custom.bgColor === c ? '3px solid #191F28' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>연락처</label>
                  <input value={custom.contactNum} onChange={e => setCustom(p => ({ ...p, contactNum: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            )}

            {/* 다운로드 버튼 */}
            <button onClick={handleDownload} disabled={downloading}
              style={{ marginTop: 20, width: '100%', padding: '11px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: downloading ? 0.7 : 1 }}>
              <Download style={{ width: 15, height: 15 }} />
              {downloading ? '저장 중...' : 'JPG 다운로드'}
            </button>

            {/* ─── MMS 바로 발송 ─── */}
            <div style={{ marginTop: 16, padding: '14px 16px', background: '#F0FDF9', borderRadius: 10, border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Smartphone style={{ width: 15, height: 15, color: '#005957' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#005957' }}>MMS 바로 발송</span>
                <span style={{ fontSize: 10, color: '#6B7280', background: '#E6F2F2', padding: '2px 7px', borderRadius: 10 }}>현재 안내문 이미지로 발송</span>
              </div>

              {/* 발신번호 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 10px', background: 'white', borderRadius: 7, border: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600 }}>발신번호</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>010-7519-1054</span>
              </div>

              {/* 제목 */}
              <input value={mmsSubject} onChange={e => setMmsSubject(e.target.value)}
                placeholder="MMS 제목 (예: GS25 시트 교환 이벤트 안내)"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', marginBottom: 8, background: 'white', outline: 'none', boxSizing: 'border-box' }} />

              {/* 단건 발송 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input value={mmsPhone} onChange={e => setMmsPhone(e.target.value)}
                  placeholder="수신번호 (01012345678)"
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' }} />
                <button onClick={handleSendSingle} disabled={mmsSending || !mmsPhone}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', cursor: (mmsSending || !mmsPhone) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, background: (mmsSending || !mmsPhone) ? '#E5E7EB' : '#191F28', color: (mmsSending || !mmsPhone) ? '#9CA3AF' : 'white', whiteSpace: 'nowrap' }}>
                  {mmsSending ? '발송 중...' : '발송'}
                </button>
              </div>
              {mmsFeedback && (
                <p style={{ fontSize: 12, fontWeight: 700, color: mmsFeedback.startsWith('✅') ? '#00B386' : '#EF4444', marginBottom: 8 }}>{mmsFeedback}</p>
              )}

              {/* 대량 발송 */}
              <div style={{ padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bulkNumbers.length > 0 ? 8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>수신번호 대량 등록</span>
                    {bulkNumbers.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#005957', background: '#E6F2F2', padding: '2px 8px', borderRadius: 10 }}>{bulkNumbers.length}건</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #005957', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#005957', background: 'white' }}>
                      📂 파일 등록
                      <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) parseBulkFile(f); e.target.value = ''; }} style={{ display: 'none' }} />
                    </label>
                    {bulkNumbers.length > 0 && (
                      <button onClick={() => { setBulkNumbers([]); setBulkDone(false); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#9CA3AF', fontSize: 11, cursor: 'pointer' }}>초기화</button>
                    )}
                  </div>
                </div>

                {bulkNumbers.length > 0 && (
                  <div style={{ maxHeight: 100, overflowY: 'auto', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, marginBottom: 8 }}>
                    <div style={{ padding: '4px 8px', background: '#F3F4F6', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 16, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                      <span style={{ minWidth: 24 }}>No</span><span style={{ minWidth: 100 }}>전화번호</span><span>이름</span>
                    </div>
                    {bulkNumbers.slice(0, 30).map((r, i) => (
                      <div key={i} style={{ padding: '3px 8px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 16 }}>
                        <span style={{ color: '#9CA3AF', minWidth: 24 }}>{i + 1}</span>
                        <span style={{ minWidth: 100 }}>{r.phone}</span>
                        <span style={{ color: '#9CA3AF' }}>{r.name || '—'}</span>
                      </div>
                    ))}
                    {bulkNumbers.length > 30 && <p style={{ padding: '3px 8px', color: '#9CA3AF', fontSize: 11 }}>... 외 {bulkNumbers.length - 30}건</p>}
                  </div>
                )}

                {bulkSending && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: '#6B7280' }}>발송 중 {bulkProgress.done}/{bulkProgress.total}</span>
                      <span style={{ color: '#005957', fontWeight: 700 }}>성공 {bulkProgress.success} · <span style={{ color: '#EF4444' }}>실패 {bulkProgress.fail}</span></span>
                    </div>
                    <div style={{ height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#005957', borderRadius: 3, width: `${(bulkProgress.done / bulkProgress.total) * 100}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
                {bulkDone && <p style={{ fontSize: 12, fontWeight: 700, color: '#00B386', marginBottom: 6 }}>✅ 완료 — 성공 {bulkProgress.success}건 · 실패 {bulkProgress.fail}건</p>}

                {bulkNumbers.length > 0 && !bulkSending && !bulkDone && (
                  <button onClick={handleSendBulk}
                    style={{ width: '100%', padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: '#005957', color: 'white' }}>
                    🚀 {bulkNumbers.length}건 일괄 발송
                  </button>
                )}
                {bulkNumbers.length === 0 && (
                  <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: '2px 0' }}>
                    CSV/Excel: A열=전화번호, B열=이름(선택)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 10 }}>미리보기</div>
            <div style={{ display: 'inline-block', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div ref={previewRef}>
                {selected === 'gs25_event' && <Gs25EventFlyer d={gs25} />}
                {selected === 'wheel_buyback' && <WheelBuybackFlyer d={wheel} />}
                {selected === 'epichub_recruit' && <EpichubFlyer d={hub} />}
                {selected === 'custom_promo' && <CustomPromoFlyer d={custom} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

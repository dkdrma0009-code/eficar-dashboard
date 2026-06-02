'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Send, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import * as QRCode from 'qrcode';
import { addSendLog } from '@/lib/sendLogStorage';

/* ─────────────────────────── 타입 ─────────────────────────── */
type TemplateKey = 'gs25_event' | 'wheel_buyback' | 'epichub_recruit' | 'custom_promo' | 'brand_promo_a' | 'brand_promo_b';

interface Gs25EventData {
  partName: string;
  damageDesc: string;
  couponAmount: string;
  targetCompany: string;
  period: string;
  contactNum: string;
  partnerLogo: 'sk' | 'lotte' | 'none';
  qrUrl: string;
  showCoss: boolean;         // COSS 공지사항 포함 여부
  cossAuthor: string;
  cossDate: string;
  cossDept: string;
  cossTitle: string;
  cossBodyBefore: string;
  cossHighlight: string;
  cossBodyAfter: string;
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
interface BrandPromoAData {
  partnerName: string;
  partnerLogo: 'sk' | 'lotte' | 'none';
  headline1: string;
  headline2: string;
  subDesc: string;
  tagline: string;
  products: { name: string; label: string; icon: '램프' | '휠' | '시트' | '유리' }[];
  steps: { num: string; title: string; desc: string }[];
  highlights: { label: string; desc: string }[];
  contactNum: string;
  qrUrl: string;
}
interface BrandPromoBData {
  partnerName: string;
  partnerLogo: 'sk' | 'lotte' | 'none';
  heroImageBase64: string;
  accentColor: string;
  productsLine: string;
  headline: string;
  bullets: string[];
  contactNum: string;
  qrUrl: string;
}

/* ─────────────────────── html-to-image 캡처 ─────────────────────── */
async function captureElement(el: HTMLElement): Promise<string> {
  const { toJpeg } = await import('html-to-image');
  await document.fonts.ready;
  const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(imgs.map(img =>
    img.complete ? Promise.resolve() : new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); })
  ));
  // cross-origin stylesheet에서 cssRules 접근 시 SecurityError 방지
  const desc = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
  Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
    get() { try { return desc?.get?.call(this) ?? []; } catch { return []; } },
    configurable: true,
  });
  try {
    const MAX_BYTES = 300 * 1024;
    let dataUrl = '';
    for (let q = 0.90; q >= 0.55; q -= 0.05) {
      dataUrl = await toJpeg(el, { quality: q, pixelRatio: 2, backgroundColor: '#ffffff' });
      const bytes = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
      if (bytes <= MAX_BYTES) break;
    }
    return dataUrl;
  } finally {
    if (desc) Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', desc);
  }
}

/* ══════════════════════════ 템플릿 컴포넌트들 ══════════════════════════ */

function Gs25EventFlyer({ d }: { d: Gs25EventData }) {
  const [qrBlobUrl, setQrBlobUrl] = useState('');
  useEffect(() => {
    if (!d.qrUrl) { setQrBlobUrl(''); return; }
    let objectUrl = '';
    const tmp = document.createElement('canvas');
    QRCode.toCanvas(tmp, d.qrUrl, { width: 112, margin: 1, color: { dark: '#1A1A2E', light: '#ffffff' } })
      .then(() => new Promise<string>((res, rej) => tmp.toBlob(b => b ? res(URL.createObjectURL(b)) : rej(), 'image/png')))
      .then(url => { objectUrl = url; setQrBlobUrl(url); })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [d.qrUrl]);

  const cossBeforeLines = d.cossBodyBefore.split('\n');
  const cossAfterLines = d.cossBodyAfter.split('\n');
  const amt = Number(d.couponAmount).toLocaleString('ko-KR');
  const Circle = ({ n }: { n: string }) => (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#005BAC', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'white', fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{n}</span>
    </div>
  );
  return (
    <div style={{ width: 480, height: 1000, fontFamily: 'Arial, sans-serif', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{ background: 'linear-gradient(160deg, #005BAC 0%, #1A7DC4 100%)', padding: '10px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFD700', borderRadius: 8, padding: '3px 20px', marginBottom: 7 }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: '#005BAC', letterSpacing: -1, lineHeight: 1 }}>GS25</span>
        </div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 800, marginBottom: 7 }}>에픽카 에서</div>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.13)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '6px 20px', marginBottom: 9 }}>
          <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>[{d.partName} {d.damageDesc}] 수리 시</span>
        </div>
        <div style={{ color: '#FFD700', fontSize: 26, fontWeight: 900, lineHeight: '1.2' }}>
          GS25 {amt}원 상품권 드려요
        </div>
      </div>

      {/* ── COSS 공지사항 ── */}
      {d.showCoss && <div style={{ padding: '5px 14px', background: '#FAFAFA', borderBottom: '2px solid #E5E7EB' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', marginBottom: 3 }}>[{d.targetCompany} COSS 공지사항]</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: 52 }} /><col /><col style={{ width: 54 }} /><col /></colgroup>
          <tbody>
            <tr>
              <td style={{ padding: '3px 7px', background: '#F3F4F6', fontWeight: 700, border: '1px solid #D1D5DB', color: '#374151' }}>작성자</td>
              <td style={{ padding: '3px 7px', border: '1px solid #D1D5DB', color: '#374151' }}>{d.cossAuthor}</td>
              <td style={{ padding: '3px 7px', background: '#F3F4F6', fontWeight: 700, border: '1px solid #D1D5DB', color: '#374151' }}>작성일</td>
              <td style={{ padding: '3px 7px', border: '1px solid #D1D5DB', color: '#374151' }}>{d.cossDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 7px', background: '#F3F4F6', fontWeight: 700, border: '1px solid #D1D5DB', color: '#374151' }}>소속</td>
              <td colSpan={3} style={{ padding: '3px 7px', border: '1px solid #D1D5DB', color: '#374151' }}>{d.cossDept}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 7px', background: '#F3F4F6', fontWeight: 700, border: '1px solid #D1D5DB', color: '#374151' }}>제목</td>
              <td colSpan={3} style={{ padding: '3px 7px', border: '1px solid #D1D5DB', color: '#374151' }}>{d.cossTitle}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 7px', background: '#F3F4F6', fontWeight: 700, border: '1px solid #D1D5DB', color: '#374151', verticalAlign: 'top' }}>내용</td>
              <td colSpan={3} style={{ padding: '4px 7px', border: '1px solid #D1D5DB', color: '#374151', lineHeight: '1.5' }}>
                {cossBeforeLines.map((line, i) => <span key={`b${i}`}>{line}{i < cossBeforeLines.length - 1 && <br />}</span>)}
                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 3, padding: '4px 9px', margin: '3px 0', fontWeight: 800, fontSize: 13, color: '#92400E', wordBreak: 'keep-all' }}>
                  {d.cossHighlight}
                </div>
                {cossAfterLines.map((line, i) => <span key={`a${i}`}>{line}{i < cossAfterLines.length - 1 && <br />}</span>)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>}

      {/* ── 배너 ── */}
      <div style={{ background: '#1A2E3B', padding: '7px 20px', textAlign: 'center' }}>
        <span style={{ color: 'white', fontSize: 15, fontWeight: 800 }}>{d.partName}수리 주문 시 에픽카에 연락주세요</span>
      </div>

      {/* ── 프로세스 스텝 (table 기반 — flex 완전 제거) ── */}
      <div style={{ padding: '9px 20px 8px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center', verticalAlign: 'top', padding: '0 4px' }}>
                <Circle n="1" />
                <div style={{ fontSize: 22, marginBottom: 4 }}>🪑</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>{d.partName} 손상 확인</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>{d.targetCompany} 차량 대상</div>
              </td>
              <td style={{ textAlign: 'center', verticalAlign: 'top', width: 24, paddingTop: 10 }}>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>→</span>
              </td>
              <td style={{ textAlign: 'center', verticalAlign: 'top', padding: '0 4px' }}>
                <Circle n="2" />
                <div style={{ fontSize: 22, marginBottom: 4 }}>📞</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>에픽카 연락</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>전화 또는 카카오 채널</div>
              </td>
              <td style={{ textAlign: 'center', verticalAlign: 'top', width: 24, paddingTop: 10 }}>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>→</span>
              </td>
              <td style={{ textAlign: 'center', verticalAlign: 'top', padding: '0 4px' }}>
                <Circle n="3" />
                <div style={{ fontSize: 22, marginBottom: 4 }}>🎁</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>상품권 수령</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>주문 익일 발송</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 연락처 (table 기반 — flex 완전 제거) ── */}
      <div style={{ background: '#005957', padding: '10px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', width: 38, fontSize: 24 }}>📞</td>
              <td style={{ verticalAlign: 'middle', paddingLeft: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>에픽카 대표 번호</div>
                <div style={{ color: '#FFD700', fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>{d.contactNum}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>전화 또는 카카오톡 채널로 문의</div>
              </td>
              {qrBlobUrl && (
                <td style={{ verticalAlign: 'middle', textAlign: 'right', width: 72 }}>
                  <div style={{ display: 'inline-block', background: 'white', borderRadius: 6, padding: 4 }}>
                    <img src={qrBlobUrl} width={56} height={56} alt="QR" style={{ display: 'block' }} />
                  </div>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 이벤트 박스 ── */}
      <div style={{ padding: '10px 20px', background: '#fff', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A2E', borderRadius: 6, padding: '6px 0', fontSize: 15, fontWeight: 900, color: 'white', marginBottom: 10, letterSpacing: 1 }}>
          <span style={{ lineHeight: 1 }}>Event</span>
        </div>
        <div style={{ fontSize: 14, textAlign: 'center', color: '#191F28', marginBottom: 6, lineHeight: '1.6' }}>
          {d.partName}수리 주문 한 건당,<br />
          <strong style={{ color: '#005957', fontSize: 24 }}>에픽카가 GS25 {amt}원 상품권 쏩니다!</strong>
        </div>
        {[
          { label: '대상 차량', value: d.targetCompany + ' 차량' },
          { label: '대상 부품', value: d.partName },
          { label: '기간', value: d.period },
          { label: '전송일', value: '사용건 확인 후 익일' },
        ].map(r => (
          <div key={r.label} style={{ marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#005957', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, lineHeight: 1 }}>{r.label}</span>
            <span style={{ display: 'inline-block', fontSize: 13, color: '#374151', marginLeft: 8, verticalAlign: 'middle' }}>{r.value}</span>
          </div>
        ))}
        <div style={{ textAlign: 'center', color: '#EF4444', fontSize: 12, fontWeight: 600, marginTop: 2 }}>* 무한대로 수령 가능!</div>
      </div>

      {/* ── 하단 ── */}
      <div style={{ background: '#1A1A2E', padding: '9px 20px', textAlign: 'center' }}>
        {d.partnerLogo === 'sk' && <span style={{ color: 'white', fontSize: 12, fontWeight: 700, marginRight: 10 }}>SK 렌터카</span>}
        {d.partnerLogo === 'lotte' && <span style={{ color: 'white', fontSize: 12, fontWeight: 700, marginRight: 10 }}>롯데렌탈</span>}
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 800, fontStyle: 'italic', marginRight: 10 }}>에픽카</span>
        <span style={{ color: '#6B7280', fontSize: 10 }}>프로모션 사전 공지 없이 조기 종료될 수 있습니다.</span>
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
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#005957', color: 'white', fontSize: 14, fontWeight: 800, lineHeight: '32px', textAlign: 'center', margin: '0 auto 6px' }}>{s.n}</div>
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
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#005957', color: 'white', fontSize: 11, fontWeight: 700, lineHeight: '22px', textAlign: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
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
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#005957', color: 'white', fontSize: 10, fontWeight: 700, lineHeight: '20px', textAlign: 'center', flexShrink: 0 }}>{s.s}</div>
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

/* ── 파트너 로고 SVG ── */
function PartnerLogoSVG({ logo, name }: { logo: 'sk' | 'lotte' | 'none'; name: string }) {
  if (logo === 'sk') {
    return (
      <svg width="60" height="28" viewBox="0 0 60 28" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="28" rx="4" fill="#E8400C" />
        <text x="13" y="17" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="13" fill="white">SK</text>
        <text x="32" y="17" fontFamily="Arial,sans-serif" fontWeight="600" fontSize="9" fill="rgba(255,255,255,0.9)">렌터카</text>
      </svg>
    );
  }
  if (logo === 'lotte') {
    return (
      <svg width="60" height="28" viewBox="0 0 60 28" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="28" rx="4" fill="#E60012" />
        <text x="7" y="17" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="13" fill="white">롯데</text>
        <text x="34" y="17" fontFamily="Arial,sans-serif" fontWeight="600" fontSize="9" fill="rgba(255,255,255,0.9)">렌탈</text>
      </svg>
    );
  }
  return <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{name}</span>;
}

/* ── 제품 아이콘 SVG ── */
function ProductIcon({ type }: { type: '램프' | '휠' | '시트' | '유리' }) {
  if (type === '램프') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        {/* D-shaped headlight body */}
        <path d="M6 10 Q6 6 10 6 L22 6 Q30 6 30 18 Q30 30 22 30 L10 30 Q6 30 6 26 Z" fill="none" stroke="#1A2E3B" strokeWidth="2.2" />
        <ellipse cx="16" cy="18" rx="5" ry="5" fill="none" stroke="#1A2E3B" strokeWidth="1.5" />
        {/* Beam lines */}
        <line x1="30" y1="14" x2="36" y2="11" stroke="#1A2E3B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="18" x2="36" y2="18" stroke="#1A2E3B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="22" x2="36" y2="25" stroke="#1A2E3B" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === '휠') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#1A2E3B" strokeWidth="2.2" />
        <circle cx="18" cy="18" r="4" fill="none" stroke="#1A2E3B" strokeWidth="1.8" />
        {/* 5 spokes */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle - 90) * Math.PI / 180;
          const x1 = 18 + 4.5 * Math.cos(rad);
          const y1 = 18 + 4.5 * Math.sin(rad);
          const x2 = 18 + 13 * Math.cos(rad);
          const y2 = 18 + 13 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1A2E3B" strokeWidth="1.8" strokeLinecap="round" />;
        })}
      </svg>
    );
  }
  if (type === '시트') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        {/* headrest */}
        <rect x="8" y="3" width="12" height="7" rx="3" fill="none" stroke="#1A2E3B" strokeWidth="2" />
        {/* backrest */}
        <rect x="7" y="10" width="14" height="16" rx="3" fill="none" stroke="#1A2E3B" strokeWidth="2" />
        {/* seat cushion */}
        <rect x="5" y="25" width="22" height="8" rx="3" fill="none" stroke="#1A2E3B" strokeWidth="2" />
      </svg>
    );
  }
  // 유리 (windshield trapezoid)
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      {/* Windshield pentagon shape */}
      <path d="M8 30 L4 18 L10 7 L26 7 L32 18 L28 30 Z" fill="none" stroke="#1A2E3B" strokeWidth="2.2" strokeLinejoin="round" />
      {/* wiper line */}
      <line x1="10" y1="24" x2="22" y2="12" stroke="#1A2E3B" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BrandPromoAFlyer({ d }: { d: BrandPromoAData }) {
  const [qrBlobUrl, setQrBlobUrl] = useState('');
  useEffect(() => {
    if (!d.qrUrl) { setQrBlobUrl(''); return; }
    let objectUrl = '';
    const tmp = document.createElement('canvas');
    QRCode.toCanvas(tmp, d.qrUrl, { width: 80, margin: 1 })
      .then(() => new Promise<string>((res, rej) => tmp.toBlob(b => b ? res(URL.createObjectURL(b)) : rej(), 'image/png')))
      .then(url => { objectUrl = url; setQrBlobUrl(url); })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [d.qrUrl]);

  return (
    <div style={{ width: 480, fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#fff' }}>
      {/* ── 헤더: 로고 + 태그라인 ── */}
      <div style={{ padding: '16px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' }}>
        <img src="/eficar_logo.png" alt="에픽카" style={{ height: 24, width: 'auto' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#005957' }}>{d.tagline}</span>
      </div>

      {/* ── 메인 헤드라인 ── */}
      <div style={{ padding: '22px 24px 6px' }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#1A2E3B', lineHeight: 1.2, letterSpacing: -0.5 }}>
          {d.headline1}<br />{d.headline2}
        </div>
        <div style={{ fontSize: 12, color: '#4B5563', marginTop: 10, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{d.subDesc}</div>
      </div>

      {/* ── 얇은 구분선 ── */}
      <div style={{ margin: '14px 24px', height: 1, background: '#E5E7EB' }} />

      {/* ── 제품 아이콘 행 ── */}
      <div style={{ padding: '4px 24px 16px', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {d.products.map((p) => (
            <div key={p.name} style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8EAED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                <ProductIcon type={p.icon} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2E3B' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: 0.5 }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3단계 프로세스 ── */}
      <div style={{ padding: '14px 24px', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 0, justifyContent: 'space-between' }}>
          {d.steps.map((s) => (
            <div key={s.num} style={{ flex: 1, padding: '10px 8px', background: '#F8FAFC', borderRadius: 8, textAlign: 'center', margin: '0 4px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#005957', marginBottom: 3 }}>{s.num}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1A2E3B', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 품목별 핵심 ── */}
      <div style={{ padding: '12px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2E3B', marginBottom: 10 }}>
          {d.products.length}대 품목별 핵심
        </div>
        {d.highlights.map((h) => (
          <div key={h.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            <span style={{ display: 'inline-block', background: '#005957', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', lineHeight: '16px', flexShrink: 0 }}>{h.label}</span>
            <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{h.desc}</span>
          </div>
        ))}
      </div>

      {/* ── 하단 연락처 ── */}
      <div style={{ background: '#1A2E3B', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PartnerLogoSVG logo={d.partnerLogo} name={d.partnerName} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 300 }}>×</span>
            <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: 18, width: 'auto' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#7EDCD9', fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>{d.contactNum}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>전화 상담·카카오톡 문의</div>
          </div>
          {qrBlobUrl && (
            <div style={{ background: 'white', borderRadius: 6, padding: 3, marginLeft: 10 }}>
              <img src={qrBlobUrl} width={52} height={52} alt="QR" style={{ display: 'block' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BrandPromoBFlyer({ d }: { d: BrandPromoBData }) {
  const [qrBlobUrl, setQrBlobUrl] = useState('');
  useEffect(() => {
    if (!d.qrUrl) { setQrBlobUrl(''); return; }
    let objectUrl = '';
    const tmp = document.createElement('canvas');
    QRCode.toCanvas(tmp, d.qrUrl, { width: 80, margin: 1 })
      .then(() => new Promise<string>((res, rej) => tmp.toBlob(b => b ? res(URL.createObjectURL(b)) : rej(), 'image/png')))
      .then(url => { objectUrl = url; setQrBlobUrl(url); })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [d.qrUrl]);

  const accent = d.accentColor || '#005957';

  return (
    <div style={{ width: 480, fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#fff' }}>
      {/* ── 히어로 영역 ── */}
      {d.heroImageBase64 ? (
        <img src={d.heroImageBase64} alt="hero" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: 200, background: `linear-gradient(135deg, ${accent} 0%, #007A78 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 56 }}>🚗</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 }}>차량 이미지를 업로드하세요</div>
        </div>
      )}

      {/* ── 강조 바 ── */}
      <div style={{ background: accent, padding: '12px 24px', textAlign: 'center' }}>
        <span style={{ color: 'white', fontSize: 18, fontWeight: 800 }}>에픽카에게 연락주세요</span>
      </div>

      {/* ── 중앙 내용 ── */}
      <div style={{ padding: '24px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2E3B', marginBottom: 4 }}>{d.productsLine}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#1A2E3B', lineHeight: 1.35, marginBottom: 20, whiteSpace: 'pre-line' }}>{d.headline}</div>

        {/* 불릿 포인트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left' }}>
          {d.bullets.map((b, i) => (
            <div key={i} style={{ background: '#F8FAFC', borderRadius: 6, padding: '10px 14px', borderLeft: `3px solid ${accent}`, fontSize: 13, color: '#374151' }}>
              • {b}
            </div>
          ))}
        </div>

        {/* 전화번호 */}
        <div style={{ fontSize: 32, fontWeight: 900, color: accent, letterSpacing: 1, marginBottom: 4 }}>{d.contactNum}</div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>전화 상담·카카오톡 문의</div>
      </div>

      {/* ── 하단 ── */}
      <div style={{ background: '#1A2E3B', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PartnerLogoSVG logo={d.partnerLogo} name={d.partnerName} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 300 }}>×</span>
            <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: 18, width: 'auto' }} />
          </div>
          {qrBlobUrl && (
            <div style={{ background: 'white', borderRadius: 6, padding: 3 }}>
              <img src={qrBlobUrl} width={52} height={52} alt="QR" style={{ display: 'block' }} />
            </div>
          )}
        </div>
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
  { key: 'brand_promo_a', label: '브랜드 홍보물 A형', emoji: '📋', desc: '아이콘 그리드 + 품목 리스트 (SK/롯데)' },
  { key: 'brand_promo_b', label: '브랜드 홍보물 B형', emoji: '🚗', desc: '차량 사진 hero + 심플 CTA' },
];

export default function FlyerPage() {
  const [selected, setSelected] = useState<TemplateKey>('gs25_event');
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // MMS 발송 상태
  const [mmsSubject, setMmsSubject] = useState('');
  const [mmsText, setMmsText] = useState('');
  const [mmsPhone, setMmsPhone] = useState('');
  const [mmsSending, setMmsSending] = useState(false);
  const [mmsFeedback, setMmsFeedback] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState<{ phone: string; name: string }[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, success: 0, fail: 0 });
  const [bulkDone, setBulkDone] = useState(false);

  // 각 템플릿 상태
  const [gs25, setGs25] = useState<Gs25EventData>({
    partName: '시트', damageDesc: '에어백 터짐', couponAmount: '5000', targetCompany: 'SK렌터카',
    period: '26.05.01 ~ 26.05.31', contactNum: '010-2752-1054', partnerLogo: 'sk',
    qrUrl: 'https://pf.kakao.com/_kXxkPG',
    showCoss: true,
    cossAuthor: '박준희', cossDate: '2026-05-19', cossDept: '경영지원팀',
    cossTitle: '에픽카 에코부품(시트) 사용 안내',
    cossBodyBefore: '안녕하세요, 경영지원팀 박준희입니다.\n항상에서 노고가 많습니다.\n사고정비 업무 관련 공문사항 안내드립니다.',
    cossHighlight: '금일(5월 19일)부터 사고 항목 품목 중 [시트 교체]가 필요한 건은',
    cossBodyAfter: '에픽카를 통해 작업 진행 부탁드립니다.\n\n업무에 참고 부탁드리며, 항상 협조해주셔서 감사합니다.',
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
  const [brandA, setBrandA] = useState<BrandPromoAData>({
    partnerName: 'SK렌터카', partnerLogo: 'sk',
    headline1: '신품처럼', headline2: '더 빠르고 합리적으로.',
    subDesc: '분해·세척 검사 복원의 표준 공정을 거쳐 신품에 준하는 부품으로,\nSK렌터카 대량 운영 차량을 합리적인 비용과 빠른 수급으로 관리합니다.',
    tagline: '자동차 사고수리 에이전트',
    products: [
      { name: '램프', label: 'LAMP', icon: '램프' },
      { name: '휠', label: 'WHEEL', icon: '휠' },
      { name: '시트', label: 'SEAT', icon: '시트' },
      { name: '유리', label: 'GLASS', icon: '유리' },
    ],
    steps: [
      { num: '01', title: '재재조 부품', desc: '정해진 공정과 검사 기준을\n통과한 부품만 공급' },
      { num: '02', title: '믿을 수 있는 품질', desc: '신품에 준하는 성능·내구성으로\n상품성 유지' },
      { num: '03', title: '신속한 공급·시공', desc: '전국 단위 빠른 수급으로\n신속한 공급' },
    ],
    highlights: [
      { label: '램프', desc: '황변 및 파손 헤드램프를 신품 수준으로 복원' },
      { label: '휠', desc: '신품 교체 대비 비용 절감' },
      { label: '유리', desc: '전국 단위 빠른 수급으로 운행 공백 최소화' },
      { label: '시트', desc: '오염·찢김 복원 및 재시공으로 차량 위생·내상 상태 유지' },
    ],
    contactNum: '010-2752-1054', qrUrl: 'https://pf.kakao.com/_kXxkPG',
  });
  const [brandB, setBrandB] = useState<BrandPromoBData>({
    partnerName: 'SK렌터카', partnerLogo: 'sk',
    heroImageBase64: '',
    accentColor: '#005957',
    productsLine: '램프·휠·시트',
    headline: '신속하고 합리적으로\n제공하겠습니다.',
    bullets: [
      '정해진 공정과 검사 기준을 통과한 부품만 공급',
      '신품에 준하는 성능과 내구성으로 상품성 유지',
      '전국 단위 빠른 수급으로 신속한 공급',
    ],
    contactNum: '010-2752-1054', qrUrl: 'https://pf.kakao.com/_kXxkPG',
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
    const content = mmsText.trim() || `[에픽카] ${subject}\n자세한 내용은 이미지를 확인해 주세요.\n문의: 010-2752-1054`;
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
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
                  <label style={labelStyle}>손상 유형 (헤더 괄호 안)</label>
                  <input value={gs25.damageDesc} onChange={e => setGs25(p => ({ ...p, damageDesc: e.target.value }))} style={inputStyle} placeholder="예: 에어백 터짐" />
                </div>
                <div>
                  <label style={labelStyle}>상품권 금액 (원)</label>
                  <input
                    value={gs25.couponAmount}
                    onChange={e => setGs25(p => ({ ...p, couponAmount: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="예: 5000"
                    style={inputStyle}
                  />
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
                <div>
                  <label style={labelStyle}>QR 코드 URL (카카오채널 등)</label>
                  <input value={gs25.qrUrl} onChange={e => setGs25(p => ({ ...p, qrUrl: e.target.value }))} style={inputStyle} placeholder="https://pf.kakao.com/..." />
                </div>

                {/* COSS 공지사항 */}
                <div style={{ paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>COSS 공지사항</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <div onClick={() => setGs25(p => ({ ...p, showCoss: !p.showCoss }))}
                        style={{ width: 36, height: 20, borderRadius: 10, background: gs25.showCoss ? '#005957' : '#D1D5DB', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', top: 2, left: gs25.showCoss ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: gs25.showCoss ? '#005957' : '#9CA3AF', fontWeight: 600 }}>{gs25.showCoss ? '포함' : '미포함'}</span>
                    </label>
                  </div>
                  {gs25.showCoss && <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>작성자</label>
                      <input value={gs25.cossAuthor} onChange={e => setGs25(p => ({ ...p, cossAuthor: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>작성일</label>
                      <input value={gs25.cossDate} onChange={e => setGs25(p => ({ ...p, cossDate: e.target.value }))} style={inputStyle} placeholder="YYYY-MM-DD" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>소속</label>
                    <input value={gs25.cossDept} onChange={e => setGs25(p => ({ ...p, cossDept: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>제목</label>
                    <input value={gs25.cossTitle} onChange={e => setGs25(p => ({ ...p, cossTitle: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>본문 (하이라이트 앞)</label>
                    <textarea value={gs25.cossBodyBefore} onChange={e => setGs25(p => ({ ...p, cossBodyBefore: e.target.value }))}
                      style={{ ...inputStyle, height: 64, resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ ...labelStyle, color: '#92400E' }}>🟡 하이라이트 문구 (강조 표시)</label>
                    <input value={gs25.cossHighlight} onChange={e => setGs25(p => ({ ...p, cossHighlight: e.target.value }))} style={{ ...inputStyle, background: '#FEF9C3' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>본문 (하이라이트 뒤)</label>
                    <textarea value={gs25.cossBodyAfter} onChange={e => setGs25(p => ({ ...p, cossBodyAfter: e.target.value }))}
                      style={{ ...inputStyle, height: 64, resize: 'vertical' }} />
                  </div>
                  </>}
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

            {expanded && selected === 'brand_promo_a' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>파트너 로고</label>
                  <select value={brandA.partnerLogo} onChange={e => setBrandA(p => ({ ...p, partnerLogo: e.target.value as 'sk' | 'lotte' | 'none', partnerName: e.target.value === 'sk' ? 'SK렌터카' : e.target.value === 'lotte' ? '롯데렌탈' : p.partnerName }))} style={inputStyle}>
                    <option value="sk">SK렌터카</option>
                    <option value="lotte">롯데렌탈</option>
                    <option value="none">없음</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>헤드라인 1번째 줄</label>
                  <input value={brandA.headline1} onChange={e => setBrandA(p => ({ ...p, headline1: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>헤드라인 2번째 줄</label>
                  <input value={brandA.headline2} onChange={e => setBrandA(p => ({ ...p, headline2: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>설명 문구 (줄바꿈 가능)</label>
                  <textarea value={brandA.subDesc} onChange={e => setBrandA(p => ({ ...p, subDesc: e.target.value }))}
                    style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
                </div>
                <div style={{ paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 8 }}>3단계 프로세스</div>
                  {brandA.steps.map((s, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <label style={{ ...labelStyle, color: '#005957' }}>Step {s.num}</label>
                      <input value={s.title} onChange={e => setBrandA(p => { const steps = [...p.steps]; steps[i] = { ...steps[i], title: e.target.value }; return { ...p, steps }; })}
                        style={{ ...inputStyle, marginBottom: 4 }} placeholder="제목" />
                      <textarea value={s.desc} onChange={e => setBrandA(p => { const steps = [...p.steps]; steps[i] = { ...steps[i], desc: e.target.value }; return { ...p, steps }; })}
                        style={{ ...inputStyle, height: 48, resize: 'vertical' }} placeholder="설명 (줄바꿈 가능)" />
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#374151' }}>품목별 핵심</div>
                    <button onClick={() => setBrandA(p => ({ ...p, highlights: [...p.highlights, { label: '', desc: '' }] }))}
                      style={{ fontSize: 11, fontWeight: 700, color: '#005957', background: '#E6F2F2', border: '1px solid #A7F3D0', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                      + 추가
                    </button>
                  </div>
                  {brandA.highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                      <input value={h.label} onChange={e => setBrandA(p => { const highlights = [...p.highlights]; highlights[i] = { ...highlights[i], label: e.target.value }; return { ...p, highlights }; })}
                        style={{ ...inputStyle, width: 60, flexShrink: 0 }} placeholder="라벨" />
                      <input value={h.desc} onChange={e => setBrandA(p => { const highlights = [...p.highlights]; highlights[i] = { ...highlights[i], desc: e.target.value }; return { ...p, highlights }; })}
                        style={{ ...inputStyle, flex: 1 }} placeholder="설명" />
                      <button onClick={() => setBrandA(p => ({ ...p, highlights: p.highlights.filter((_, j) => j !== i) }))}
                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>연락처</label>
                  <input value={brandA.contactNum} onChange={e => setBrandA(p => ({ ...p, contactNum: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>QR 코드 URL</label>
                  <input value={brandA.qrUrl} onChange={e => setBrandA(p => ({ ...p, qrUrl: e.target.value }))} style={inputStyle} placeholder="https://pf.kakao.com/..." />
                </div>
              </div>
            )}

            {expanded && selected === 'brand_promo_b' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>파트너 로고</label>
                  <select value={brandB.partnerLogo} onChange={e => setBrandB(p => ({ ...p, partnerLogo: e.target.value as 'sk' | 'lotte' | 'none', partnerName: e.target.value === 'sk' ? 'SK렌터카' : e.target.value === 'lotte' ? '롯데렌탈' : p.partnerName }))} style={inputStyle}>
                    <option value="sk">SK렌터카</option>
                    <option value="lotte">롯데렌탈</option>
                    <option value="none">없음</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>히어로 이미지 업로드</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setBrandB(p => ({ ...p, heroImageBase64: ev.target?.result as string }));
                    reader.readAsDataURL(file);
                  }} style={{ ...inputStyle, padding: '5px 10px' }} />
                  {brandB.heroImageBase64 && (
                    <button onClick={() => setBrandB(p => ({ ...p, heroImageBase64: '' }))}
                      style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: '#EF4444', background: 'white', border: '1px solid #FCA5A5', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>
                      이미지 제거
                    </button>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>제품 라인 (상단 작은 텍스트)</label>
                  <input value={brandB.productsLine} onChange={e => setBrandB(p => ({ ...p, productsLine: e.target.value }))} style={inputStyle} placeholder="예: 램프·휠·시트" />
                </div>
                <div>
                  <label style={labelStyle}>헤드라인 (줄바꿈 가능)</label>
                  <textarea value={brandB.headline} onChange={e => setBrandB(p => ({ ...p, headline: e.target.value }))}
                    style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
                </div>
                <div style={{ paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 8 }}>불릿 포인트 (3개)</div>
                  {brandB.bullets.map((b, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <label style={labelStyle}>포인트 {i + 1}</label>
                      <textarea value={b} onChange={e => setBrandB(p => { const bullets = [...p.bullets]; bullets[i] = e.target.value; return { ...p, bullets }; })}
                        style={{ ...inputStyle, height: 48, resize: 'vertical' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>연락처</label>
                  <input value={brandB.contactNum} onChange={e => setBrandB(p => ({ ...p, contactNum: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>QR 코드 URL</label>
                  <input value={brandB.qrUrl} onChange={e => setBrandB(p => ({ ...p, qrUrl: e.target.value }))} style={inputStyle} placeholder="https://pf.kakao.com/..." />
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

              {/* MMS 문구 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>MMS 문구</span>
                  {selected === 'gs25_event' && (
                    <button
                      onClick={() => {
                        const d = gs25;
                        const amt = Number(d.couponAmount).toLocaleString('ko-KR');
                        setMmsText(
`[${d.targetCompany} 협력 정비소 안내]
안녕하세요,
${d.targetCompany} 협력 정비소 담당자님!

1. 담당자님을 위한 '무제한' 증정 이벤트
■ 혜택: 에픽카 '${d.partName} ${d.damageDesc} 수리 시' 1건당 ☞ GS25 ${amt}원권 ☜ 100% 증정
■ 한도: 제한 없음
■ 지급: 부품 사용 확인 후 익일 즉시 발송

2. 참여 방법 (아주 간단합니다!)
아래 번호를 통해 에픽카로 ${d.targetCompany} 차량 ${d.partName}수리 요청하시면 됩니다.
☏빠른 전화/문자: ${d.contactNum}
＠카카오톡 채널 [에픽카_정비소]: ${d.qrUrl}
☞ 이벤트 기간: ${d.period}
☞ 프로모션은 사전 공지 없이 조기 종료될 수 있습니다.
업무로 바쁘신 와중에도 협조해 주셔서 감사합니다.
오늘 하루도 안전하고 활기찬 하루 보내세요!`
                        );
                      }}
                      style={{ fontSize: 11, fontWeight: 700, color: '#005957', background: '#E6F2F2', border: '1px solid #A7F3D0', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
                    >
                      ✨ 자동 생성
                    </button>
                  )}
                </div>
                <textarea
                  value={mmsText}
                  onChange={e => setMmsText(e.target.value)}
                  placeholder="문구를 직접 입력하거나 '자동 생성' 버튼을 누르세요."
                  rows={8}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                />
              </div>

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
                {selected === 'brand_promo_a' && <BrandPromoAFlyer d={brandA} />}
                {selected === 'brand_promo_b' && <BrandPromoBFlyer d={brandB} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

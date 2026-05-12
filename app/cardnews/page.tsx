'use client';

import { useState, useRef, useCallback } from 'react';
import { Download, Plus, Loader2, Copy, Trash2 } from 'lucide-react';

/* 로고 컴포넌트 — html2canvas에서도 렌더링됨 */
function Logo({ size, white = false }: { size: number; white?: boolean }) {
  const h = size * 0.028;
  const boxSize = h;
  const color = white ? 'white' : '#005957';
  const boxBg = white ? 'rgba(255,255,255,0.25)' : '#005957';
  const textColor = white ? 'white' : 'white';
  const labelColor = white ? 'rgba(255,255,255,0.9)' : '#191F28';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: boxSize * 0.35 }}>
      <div style={{
        width: boxSize, height: boxSize, borderRadius: boxSize * 0.28,
        background: boxBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: textColor, fontWeight: 900, fontSize: boxSize * 0.6, lineHeight: 1 }}>∞</span>
      </div>
      <span style={{ fontWeight: 800, fontSize: boxSize * 0.72, color: labelColor, letterSpacing: '-0.3px' }}>에픽카</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Types                                                     */
/* ────────────────────────────────────────────────────────── */
type TemplateKey = 'cover' | 'clients' | 'metrics' | 'features' | 'comparison' | 'cta';

interface CoverData   { badge: string; title: string; subtitle: string; highlight: string; company: string; }
interface ClientItem  { name: string; metric: string; number: string; unit: string; }
interface ClientsData { title: string; titleAccent: string; clients: ClientItem[]; }
interface MetricItem  { tag: string; number: string; desc: string; }
interface MetricsData { title: string; titleAccent: string; metrics: MetricItem[]; footerText: string; }
interface FeatureItem { title: string; desc: string; }
interface FeaturesData { title: string; features: FeatureItem[]; }
interface CompRow     { label: string; a: string; b: string; }
interface CompData    { title: string; headerA: string; headerB: string; rows: CompRow[]; }
interface CtaData     { title: string; subtitle: string; contact1: string; contact2: string; }

type CardData =
  | { template: 'cover';      data: CoverData }
  | { template: 'clients';    data: ClientsData }
  | { template: 'metrics';    data: MetricsData }
  | { template: 'features';   data: FeaturesData }
  | { template: 'comparison'; data: CompData }
  | { template: 'cta';        data: CtaData };

const DEFAULT_CARDS: CardData[] = [
  {
    template: 'cover',
    data: { badge: '에픽카 솔루션', title: '렌터카 부품비\n절감의 새로운 기준', subtitle: '데이터 기반 대체부품 공급 플랫폼', highlight: '1만대당 연간 1.6억 절감', company: '∞에픽카' },
  },
  {
    template: 'metrics',
    data: {
      title: '에픽카와 함께라면', titleAccent: '숫자가 달라집니다',
      metrics: [
        { tag: '매출 성장률', number: '850%', desc: '전년 대비 매출 성장' },
        { tag: '대체부품 성장', number: '304%', desc: '대체부품 사용 증가율' },
        { tag: '연간 절감', number: '1.6억', desc: '차량 1만대 기준' },
      ],
      footerText: '실제 파트너사 데이터 기준 (2024~2025)',
    },
  },
  {
    template: 'features',
    data: {
      title: '에픽카 핵심 솔루션',
      features: [
        { title: '에픽커넥트', desc: '사고처리 자동화로 담당자 업무 90% 절감' },
        { title: '에픽렌즈', desc: 'AI 기반 부품 판독으로 견적 오류 제로화' },
        { title: '헤드램프·휠', desc: 'OEM 대비 최대 40% 저렴한 대체부품 공급' },
      ],
    },
  },
  {
    template: 'clients',
    data: {
      title: '함께하는 파트너사',
      titleAccent: '실제 성과',
      clients: [
        { name: 'SK렌터카', metric: '연간 절감액', number: '1.6억', unit: '차량 1만대 기준' },
        { name: '롯데렌탈', metric: '대체부품 성장률', number: '304%', unit: '전년 대비' },
        { name: '그린카', metric: '업무 절감률', number: '90%', unit: '에픽커넥트 도입 후' },
        { name: '에픽카 파트너사', metric: '매출 성장률', number: '850%', unit: '전년 대비' },
      ],
    },
  },
  {
    template: 'comparison',
    data: {
      title: 'OEM vs 에픽카 대체부품',
      headerA: 'OEM 부품', headerB: '에픽카',
      rows: [
        { label: '단가', a: '높음', b: '30~40% 절감' },
        { label: '공급 속도', a: '3~5일', b: '당일~익일' },
        { label: '품질 보증', a: '제조사 보증', b: '에픽카 품질 인증' },
        { label: '업무 자동화', a: '수동 처리', b: '에픽커넥트 자동화' },
      ],
    },
  },
  {
    template: 'cta',
    data: { title: '지금 바로 시작하세요', subtitle: '에픽카 파트너십 문의', contact1: 'info@eficar.co.kr', contact2: '010-2752-1054' },
  },
];

const TEMPLATES: { key: TemplateKey; label: string; emoji: string }[] = [
  { key: 'cover',      label: '커버형',     emoji: '🖼' },
  { key: 'clients',    label: '고객사실적형', emoji: '🏆' },
  { key: 'metrics',    label: '3분할지표형', emoji: '📊' },
  { key: 'features',   label: '특징카드형', emoji: '✨' },
  { key: 'comparison', label: '비교표형',   emoji: '⚖️' },
  { key: 'cta',        label: 'CTA형',      emoji: '📣' },
];

/* ────────────────────────────────────────────────────────── */
/*  Card Renderers                                            */
/* ────────────────────────────────────────────────────────── */
function CardCover({ d, size }: { d: CoverData; size: number }) {
  const p = size * 0.07;
  return (
    <div style={{ width: size, height: size, fontFamily: 'Pretendard, sans-serif', overflow: 'hidden', position: 'relative', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 초록 헤더 영역 */}
      <div style={{ background: 'linear-gradient(135deg, #005957 0%, #007A77 100%)', height: size * 0.42, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* 장식 원형들 */}
        <div style={{ position: 'absolute', top: -size * 0.1, right: -size * 0.08, width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -size * 0.08, left: size * 0.3, width: size * 0.3, height: size * 0.3, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: size * 0.1, right: size * 0.1, width: size * 0.18, height: size * 0.18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        {/* 로고 + 뱃지 */}
        <div style={{ position: 'absolute', top: p, left: p, right: p, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size={size} white={true} />
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 100, padding: `${size * 0.012}px ${size * 0.026}px`, fontSize: size * 0.018, color: 'white', fontWeight: 700, backdropFilter: 'blur(4px)' }}>{d.badge}</div>
        </div>
        {/* 하이라이트 수치 */}
        <div style={{ position: 'absolute', bottom: p * 0.8, left: p }}>
          <div style={{ fontSize: size * 0.022, color: 'rgba(255,255,255,0.7)', marginBottom: size * 0.01, fontWeight: 600 }}>핵심 성과</div>
          <div style={{ fontSize: size * 0.036, fontWeight: 800, color: 'white' }}>{d.highlight}</div>
        </div>
      </div>
      {/* 하단 콘텐츠 */}
      <div style={{ flex: 1, padding: p, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: size * 0.054, fontWeight: 800, color: '#191F28', lineHeight: 1.25, whiteSpace: 'pre-wrap', marginBottom: size * 0.018 }}>{d.title}</div>
          <div style={{ fontSize: size * 0.024, color: '#8B95A1', fontWeight: 500 }}>{d.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: size * 0.1, height: 2, background: '#005957', borderRadius: 2 }} />
          <div style={{ fontSize: size * 0.02, color: '#8B95A1', fontWeight: 600 }}>{d.company}</div>
        </div>
      </div>
    </div>
  );
}

function CardClients({ d, size }: { d: ClientsData; size: number }) {
  const p = size * 0.065;
  const COLORS = ['#005957', '#00B386', '#6366F1', '#F59E0B'];
  const LIGHT  = ['#E6F2F2', '#E6FAF5', '#EEF2FF', '#FFFBEB'];
  return (
    <div style={{ width: size, height: size, background: 'white', fontFamily: 'Pretendard, sans-serif', padding: p, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: size * 0.032 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.014, background: '#E6F2F2', borderRadius: 100, padding: `${size * 0.01}px ${size * 0.022}px`, marginBottom: size * 0.016 }}>
          <span style={{ fontSize: size * 0.02 }}>🏆</span>
          <span style={{ fontSize: size * 0.017, fontWeight: 700, color: '#005957' }}>파트너사 실적</span>
        </div>
        <div>
          <span style={{ fontSize: size * 0.036, fontWeight: 900, color: '#191F28' }}>{d.title} </span>
          <span style={{ fontSize: size * 0.036, fontWeight: 900, color: '#005957' }}>{d.titleAccent}</span>
        </div>
      </div>
      {/* 고객사 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: size * 0.016, flex: 1 }}>
        {d.clients.map((c, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: size * 0.022,
            background: LIGHT[i % 4],
            padding: `${size * 0.018}px ${size * 0.026}px`,
            display: 'flex', alignItems: 'center', gap: size * 0.02,
          }}>
            {/* 이니셜 아바타 */}
            <div style={{
              width: size * 0.075, height: size * 0.075, borderRadius: size * 0.016, flexShrink: 0,
              background: COLORS[i % 4],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontSize: size * 0.026, fontWeight: 900 }}>{c.name.charAt(0)}</span>
            </div>
            {/* 고객사명 + 지표명 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: size * 0.022, fontWeight: 800, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: size * 0.017, color: '#8B95A1', marginTop: size * 0.004 }}>{c.metric}</div>
            </div>
            {/* 숫자 강조 영역 */}
            <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
              <div style={{ fontSize: size * 0.048, fontWeight: 900, color: COLORS[i % 4], lineHeight: 1 }}>{c.number}</div>
              <div style={{ fontSize: size * 0.015, color: '#8B95A1', marginTop: size * 0.006, whiteSpace: 'nowrap' }}>{c.unit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardMetrics({ d, size }: { d: MetricsData; size: number }) {
  const p = size * 0.065;
  const ACCENT_COLORS = ['#005957', '#00B386', '#6366F1'];
  const LIGHT_COLORS  = ['#E6F2F2', '#E6FAF5', '#EEF2FF'];
  return (
    <div style={{ width: size, height: size, background: 'white', fontFamily: 'Pretendard, sans-serif', padding: p, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: size * 0.044 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.016, marginBottom: size * 0.012 }}>
          <div style={{ width: size * 0.008, height: size * 0.044, background: '#005957', borderRadius: 2 }} />
          <div>
            <span style={{ fontSize: size * 0.036, fontWeight: 900, color: '#191F28' }}>{d.title} </span>
            <span style={{ fontSize: size * 0.036, fontWeight: 900, color: '#005957' }}>{d.titleAccent}</span>
          </div>
        </div>
      </div>
      {/* 지표 카드 3개 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: size * 0.022, flex: 1 }}>
        {d.metrics.map((m, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: size * 0.022,
            background: LIGHT_COLORS[i % 3],
            padding: `${size * 0.026}px ${size * 0.034}px`,
            display: 'flex', alignItems: 'center', gap: size * 0.03,
          }}>
            <div style={{
              width: size * 0.09, height: size * 0.09, borderRadius: size * 0.018,
              background: ACCENT_COLORS[i % 3], flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontSize: size * 0.036, fontWeight: 900 }}>{i + 1}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: size * 0.017, color: ACCENT_COLORS[i % 3], fontWeight: 700, marginBottom: size * 0.006 }}>{m.tag}</div>
              <div style={{ fontSize: size * 0.052, fontWeight: 900, color: '#191F28', lineHeight: 1, marginBottom: size * 0.006 }}>{m.number}</div>
              <div style={{ fontSize: size * 0.017, color: '#8B95A1' }}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {/* 각주 */}
      <div style={{ marginTop: size * 0.024, display: 'flex', alignItems: 'center', gap: size * 0.012 }}>
        <div style={{ width: size * 0.012, height: size * 0.012, borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
        <span style={{ fontSize: size * 0.017, color: '#8B95A1' }}>{d.footerText}</span>
      </div>
    </div>
  );
}

function CardFeatures({ d, size }: { d: FeaturesData; size: number }) {
  const p = size * 0.065;
  const ICONS = ['💡', '🔗', '📦'];
  const BG_COLORS = ['#E6F2F2', '#F0FDF9', '#EEF2FF'];
  const ACCENT = ['#005957', '#00B386', '#6366F1'];
  return (
    <div style={{ width: size, height: size, background: 'white', fontFamily: 'Pretendard, sans-serif', padding: p, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: size * 0.04 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.014, background: '#E6F2F2', borderRadius: 100, padding: `${size * 0.01}px ${size * 0.022}px`, marginBottom: size * 0.018 }}>
          <span style={{ fontSize: size * 0.022 }}>✨</span>
          <span style={{ fontSize: size * 0.017, fontWeight: 700, color: '#005957' }}>핵심 솔루션</span>
        </div>
        <div style={{ fontSize: size * 0.042, fontWeight: 900, color: '#191F28', lineHeight: 1.2 }}>{d.title}</div>
      </div>
      {/* 특징 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: size * 0.02, flex: 1 }}>
        {d.features.map((f, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: size * 0.022, background: BG_COLORS[i % 3],
            padding: `${size * 0.024}px ${size * 0.03}px`,
            display: 'flex', alignItems: 'center', gap: size * 0.026,
          }}>
            <div style={{
              width: size * 0.1, height: size * 0.1, borderRadius: size * 0.02, flexShrink: 0,
              background: ACCENT[i % 3],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: size * 0.042,
            }}>{ICONS[i % 3]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: size * 0.026, fontWeight: 800, color: '#191F28', marginBottom: size * 0.008 }}>{f.title}</div>
              <div style={{ fontSize: size * 0.021, color: '#6B7684', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
            <div style={{ width: size * 0.032, height: size * 0.032, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: size * 0.014, fontWeight: 900, color: ACCENT[i % 3] }}>{i + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardComparison({ d, size }: { d: CompData; size: number }) {
  const p = size * 0.065;
  return (
    <div style={{ width: size, height: size, background: 'white', fontFamily: 'Pretendard, sans-serif', padding: p, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: size * 0.036 }}>
        <div style={{ display: 'inline-flex', gap: size * 0.01, alignItems: 'center', marginBottom: size * 0.016 }}>
          <span style={{ fontSize: size * 0.017, fontWeight: 700, color: '#8B95A1' }}>{d.headerA}</span>
          <span style={{ fontSize: size * 0.017, color: '#E2E8F0' }}>vs</span>
          <span style={{ fontSize: size * 0.017, fontWeight: 700, color: '#005957' }}>{d.headerB}</span>
        </div>
        <div style={{ fontSize: size * 0.038, fontWeight: 900, color: '#191F28' }}>{d.title}</div>
      </div>
      {/* 비교 테이블 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: size * 0.01, marginBottom: size * 0.012 }}>
        <div style={{ fontSize: size * 0.018, color: '#8B95A1', fontWeight: 600 }}>항목</div>
        <div style={{ fontSize: size * 0.018, color: '#8B95A1', fontWeight: 600, textAlign: 'center' as const }}>{d.headerA}</div>
        <div style={{ fontSize: size * 0.018, fontWeight: 700, textAlign: 'center' as const, background: '#005957', color: 'white', borderRadius: `${size * 0.014}px ${size * 0.014}px 0 0`, padding: `${size * 0.01}px 0` }}>{d.headerB}</div>
      </div>
      {/* 행들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: size * 0.01, flex: 1 }}>
        {d.rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: size * 0.01, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: i % 2 === 0 ? '#F8F9FA' : 'white', borderRadius: size * 0.012, padding: `${size * 0.01}px ${size * 0.018}px`, fontSize: size * 0.022, color: '#6B7684', fontWeight: 600 }}>{row.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: i % 2 === 0 ? '#F8F9FA' : 'white', borderRadius: size * 0.012, padding: `${size * 0.01}px`, fontSize: size * 0.021, color: '#8B95A1', textAlign: 'center' as const }}>{row.a}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6F2F2', borderRadius: size * 0.012, padding: `${size * 0.01}px`, fontSize: size * 0.022, fontWeight: 700, color: '#005957', textAlign: 'center' as const }}>{row.b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardCta({ d, size }: { d: CtaData; size: number }) {
  const p = size * 0.08;
  return (
    <div style={{ width: size, height: size, fontFamily: 'Pretendard, sans-serif', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: p, textAlign: 'center' }}>
      {/* 배경 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #003D3C 0%, #005957 50%, #007A77 100%)' }} />
      {/* 장식 원형들 */}
      <div style={{ position: 'absolute', top: -size * 0.2, left: -size * 0.15, width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -size * 0.22, right: -size * 0.15, width: size * 0.65, height: size * 0.65, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', top: size * 0.25, right: -size * 0.06, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      {/* 콘텐츠 */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: `${size * 0.012}px ${size * 0.028}px`, fontSize: size * 0.018, color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginBottom: size * 0.032 }}>{d.subtitle}</div>
        <div style={{ fontSize: size * 0.054, fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: size * 0.048 }}>{d.title}</div>
        {/* 연락처 박스 */}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: size * 0.024, padding: `${size * 0.028}px ${size * 0.048}px`, marginBottom: size * 0.04, backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.016, marginBottom: size * 0.014 }}>
            <span style={{ fontSize: size * 0.022 }}>✉️</span>
            <span style={{ fontSize: size * 0.024, color: 'white', fontWeight: 600 }}>{d.contact1}</span>
          </div>
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: size * 0.014 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.016 }}>
            <span style={{ fontSize: size * 0.022 }}>📞</span>
            <span style={{ fontSize: size * 0.024, color: 'white', fontWeight: 600 }}>{d.contact2}</span>
          </div>
        </div>
        <Logo size={size} white={true} />
      </div>
    </div>
  );
}

function renderCard(card: CardData, size: number) {
  switch (card.template) {
    case 'cover':      return <CardCover d={card.data as CoverData} size={size} />;
    case 'clients':    return <CardClients d={card.data as ClientsData} size={size} />;
    case 'metrics':    return <CardMetrics d={card.data as MetricsData} size={size} />;
    case 'features':   return <CardFeatures d={card.data as FeaturesData} size={size} />;
    case 'comparison': return <CardComparison d={card.data as CompData} size={size} />;
    case 'cta':        return <CardCta d={card.data as CtaData} size={size} />;
  }
}

function defaultData(template: TemplateKey): CardData {
  switch (template) {
    case 'cover':   return { template, data: { badge: '에픽카', title: '제목을 입력하세요', subtitle: '부제목', highlight: '핵심 수치', company: '∞에픽카' } };
    case 'clients': return { template, data: { title: '파트너사', titleAccent: '실적', clients: [{ name: '고객사 1', metric: '성과 지표', number: '00%', unit: '기준' }, { name: '고객사 2', metric: '성과 지표', number: '00%', unit: '기준' }, { name: '고객사 3', metric: '성과 지표', number: '00%', unit: '기준' }] } };
    case 'metrics': return { template, data: { title: '제목', titleAccent: '강조 문구', metrics: [{ tag: '태그1', number: '숫자1', desc: '설명1' }, { tag: '태그2', number: '숫자2', desc: '설명2' }, { tag: '태그3', number: '숫자3', desc: '설명3' }], footerText: '각주 텍스트' } };
    case 'features': return { template, data: { title: '주요 특징', features: [{ title: '특징 1', desc: '설명' }, { title: '특징 2', desc: '설명' }, { title: '특징 3', desc: '설명' }] } };
    case 'comparison': return { template, data: { title: '비교', headerA: '기존', headerB: '에픽카', rows: [{ label: '항목 1', a: '-', b: '✓' }, { label: '항목 2', a: '보통', b: '우수' }] } };
    case 'cta':     return { template, data: { title: '지금 시작하세요', subtitle: '문의하기', contact1: 'info@eficar.co.kr', contact2: '010-2752-1054' } };
  }
}

/* ────────────────────────────────────────────────────────── */
/*  Editable Field Helpers                                    */
/* ────────────────────────────────────────────────────────── */
function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const style: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #F2F4F6', borderRadius: 8,
    fontSize: 13, color: '#191F28', background: 'white', fontFamily: 'inherit',
    resize: 'vertical' as const,
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', display: 'block', marginBottom: 4 }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} style={style} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={style} />
      }
    </div>
  );
}

function EditPanel({ card, onChange }: { card: CardData; onChange: (c: CardData) => void }) {
  const update = (patch: Partial<typeof card.data>) => onChange({ ...card, data: { ...card.data, ...patch } } as CardData);

  if (card.template === 'cover') {
    const d = card.data as CoverData;
    return <>
      <Field label="뱃지 텍스트" value={d.badge} onChange={v => update({ badge: v })} />
      <Field label="제목 (줄바꿈 가능)" value={d.title} onChange={v => update({ title: v })} multiline />
      <Field label="부제목" value={d.subtitle} onChange={v => update({ subtitle: v })} />
      <Field label="강조 텍스트" value={d.highlight} onChange={v => update({ highlight: v })} />
      <Field label="하단 회사명" value={d.company} onChange={v => update({ company: v })} />
    </>;
  }
  if (card.template === 'clients') {
    const d = card.data as ClientsData;
    return <>
      <Field label="제목" value={d.title} onChange={v => update({ title: v })} />
      <Field label="강조 문구" value={d.titleAccent} onChange={v => update({ titleAccent: v })} />
      {d.clients.map((c, i) => (
        <div key={i} style={{ background: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>고객사 {i + 1}</p>
          <Field label="고객사명" value={c.name} onChange={v => { const clients = [...d.clients]; clients[i] = { ...clients[i], name: v }; update({ clients }); }} />
          <Field label="지표명 (예: 연간 절감액)" value={c.metric} onChange={v => { const clients = [...d.clients]; clients[i] = { ...clients[i], metric: v }; update({ clients }); }} />
          <Field label="강조 숫자 (예: 1.6억, 304%)" value={c.number} onChange={v => { const clients = [...d.clients]; clients[i] = { ...clients[i], number: v }; update({ clients }); }} />
          <Field label="기준 설명 (예: 차량 1만대 기준)" value={c.unit} onChange={v => { const clients = [...d.clients]; clients[i] = { ...clients[i], unit: v }; update({ clients }); }} />
        </div>
      ))}
    </>;
  }
  if (card.template === 'metrics') {
    const d = card.data as MetricsData;
    return <>
      <Field label="제목" value={d.title} onChange={v => update({ title: v })} />
      <Field label="강조 문구 (두 번째 줄)" value={d.titleAccent} onChange={v => update({ titleAccent: v })} />
      {d.metrics.map((m, i) => (
        <div key={i} style={{ background: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>지표 {i + 1}</p>
          <Field label="태그" value={m.tag} onChange={v => { const metrics = [...d.metrics]; metrics[i] = { ...metrics[i], tag: v }; update({ metrics }); }} />
          <Field label="숫자" value={m.number} onChange={v => { const metrics = [...d.metrics]; metrics[i] = { ...metrics[i], number: v }; update({ metrics }); }} />
          <Field label="설명" value={m.desc} onChange={v => { const metrics = [...d.metrics]; metrics[i] = { ...metrics[i], desc: v }; update({ metrics }); }} />
        </div>
      ))}
      <Field label="각주" value={d.footerText} onChange={v => update({ footerText: v })} />
    </>;
  }
  if (card.template === 'features') {
    const d = card.data as FeaturesData;
    return <>
      <Field label="제목" value={d.title} onChange={v => update({ title: v })} />
      {d.features.map((f, i) => (
        <div key={i} style={{ background: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>특징 {i + 1}</p>
          <Field label="제목" value={f.title} onChange={v => { const features = [...d.features]; features[i] = { ...features[i], title: v }; update({ features }); }} />
          <Field label="설명" value={f.desc} onChange={v => { const features = [...d.features]; features[i] = { ...features[i], desc: v }; update({ features }); }} multiline />
        </div>
      ))}
    </>;
  }
  if (card.template === 'comparison') {
    const d = card.data as CompData;
    return <>
      <Field label="제목" value={d.title} onChange={v => update({ title: v })} />
      <Field label="A열 헤더" value={d.headerA} onChange={v => update({ headerA: v })} />
      <Field label="B열 헤더 (강조)" value={d.headerB} onChange={v => update({ headerB: v })} />
      {d.rows.map((row, i) => (
        <div key={i} style={{ background: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>행 {i + 1}</p>
          <Field label="항목명" value={row.label} onChange={v => { const rows = [...d.rows]; rows[i] = { ...rows[i], label: v }; update({ rows }); }} />
          <Field label="A열 값" value={row.a} onChange={v => { const rows = [...d.rows]; rows[i] = { ...rows[i], a: v }; update({ rows }); }} />
          <Field label="B열 값" value={row.b} onChange={v => { const rows = [...d.rows]; rows[i] = { ...rows[i], b: v }; update({ rows }); }} />
        </div>
      ))}
    </>;
  }
  if (card.template === 'cta') {
    const d = card.data as CtaData;
    return <>
      <Field label="메인 문구" value={d.title} onChange={v => update({ title: v })} multiline />
      <Field label="부제목" value={d.subtitle} onChange={v => update({ subtitle: v })} />
      <Field label="연락처 1" value={d.contact1} onChange={v => update({ contact1: v })} />
      <Field label="연락처 2" value={d.contact2} onChange={v => update({ contact2: v })} />
    </>;
  }
  return null;
}

/* ────────────────────────────────────────────────────────── */
/*  Main Page                                                 */
/* ────────────────────────────────────────────────────────── */
export default function CardNewsPage() {
  const [cards, setCards] = useState<CardData[]>(DEFAULT_CARDS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [size, setSize] = useState<1080 | 1920>(1080);
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(6);
  const [refContent, setRefContent] = useState('');
  const [refOpen, setRefOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const PREVIEW = 480;

  const activeCard = cards[activeIdx] ?? cards[0];

  const updateCard = (idx: number, c: CardData) => setCards(prev => prev.map((old, i) => i === idx ? c : old));
  const addCard = (tpl: TemplateKey) => { setCards(prev => [...prev, defaultData(tpl)]); setActiveIdx(cards.length); };
  const removeCard = (idx: number) => {
    if (cards.length <= 1) return;
    setCards(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, idx - 1));
  };

  const downloadCurrent = useCallback(async () => {
    if (!previewRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(previewRef.current, { scale: size / PREVIEW, useCORS: true, logging: false });
    const link = document.createElement('a');
    link.download = `eficar-card-${activeIdx + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [activeIdx, size]);

  const downloadAll = useCallback(async () => {
    const html2canvas = (await import('html2canvas')).default;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < cards.length; i++) {
      setActiveIdx(i);
      await new Promise(r => setTimeout(r, 100));
      if (!previewRef.current) continue;
      const canvas = await html2canvas(previewRef.current, { scale: size / PREVIEW, useCORS: true, logging: false });
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
      zip.file(`eficar-cardnews-${today}-${i + 1}.png`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `eficar-cardnews-${today}.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
  }, [cards, size]);

  const generateAI = async () => {
    if (!topic.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, cardCount, refContent: refContent.trim() || undefined }),
      });
      const json = await res.json();
      if (json.error) { setAiError(json.error); return; }
      if (json.cards?.length) {
        setCards(json.cards as CardData[]);
        setActiveIdx(0);
      }
    } catch (e) {
      setAiError('네트워크 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>카드뉴스 생성기</h1>
          <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>에픽카 브랜드 스타일 카드뉴스를 직접 편집하거나 AI로 자동 생성합니다</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
          {/* 좌측 편집 패널 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI 자동 작성 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>✨ AI 자동 작성</p>

              {/* 주제 */}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>주제</p>
              <input
                value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="예: SK렌터카 성과 사례, 에픽렌즈 소개, 대체부품 절감 효과"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', marginBottom: 12 }}
                onKeyDown={e => { if (e.key === 'Enter' && !aiLoading && topic.trim()) generateAI(); }}
              />

              {/* 슬라이드 수 — 숫자 스피너 */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', marginBottom: 8 }}>슬라이드 수 <span style={{ fontWeight: 400, color: '#C4CAD4' }}>(1~25장)</span></p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setCardCount(c => Math.max(1, c - 1))} style={{
                    width: 36, height: 36, borderRadius: 8, border: '1px solid #F2F4F6',
                    background: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700,
                    color: '#6B7684', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>−</button>
                  <input
                    type="number" min={1} max={25} value={cardCount}
                    onChange={e => setCardCount(Math.min(25, Math.max(1, Number(e.target.value) || 1)))}
                    style={{
                      flex: 1, height: 36, border: '1px solid #F2F4F6', borderRadius: 8,
                      textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#005957',
                      fontFamily: 'inherit', background: '#F8FFFE',
                    }}
                  />
                  <button onClick={() => setCardCount(c => Math.min(25, c + 1))} style={{
                    width: 36, height: 36, borderRadius: 8, border: '1px solid #F2F4F6',
                    background: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700,
                    color: '#6B7684', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>+</button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', flexShrink: 0 }}>장</span>
                </div>
              </div>

              {/* 참고 자료 토글 */}
              <button
                onClick={() => setRefOpen(o => !o)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${refOpen || refContent ? '#005957' : '#F2F4F6'}`,
                  background: refOpen || refContent ? '#E6F2F2' : '#F8F9FA',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  color: refOpen || refContent ? '#005957' : '#8B95A1',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: refOpen ? 8 : 12, transition: 'all 0.15s',
                }}
              >
                <span>📎 참고 자료 첨부 {refContent ? `(${refContent.length.toLocaleString()}자)` : '(선택사항)'}</span>
                <span style={{ fontSize: 10 }}>{refOpen ? '▲' : '▼'}</span>
              </button>
              {refOpen && (
                <div style={{ marginBottom: 12 }}>
                  <textarea
                    value={refContent} onChange={e => setRefContent(e.target.value)}
                    rows={6}
                    placeholder={"AI가 참고할 내용을 붙여넣으세요.\n예) 고객사 실적 데이터, 제품 스펙, 보도자료, 회사 소개 문구 등\n자유 형식으로 입력하면 카드 내용에 반영됩니다."}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #E6F2F2',
                      borderRadius: 8, fontSize: 12, color: '#191F28', fontFamily: 'inherit',
                      resize: 'vertical', lineHeight: 1.6, background: 'white',
                    }}
                  />
                  {refContent && (
                    <button onClick={() => setRefContent('')} style={{ marginTop: 4, fontSize: 11, color: '#8B95A1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      ✕ 내용 지우기
                    </button>
                  )}
                </div>
              )}

              {aiError && <p style={{ fontSize: 12, color: '#F04452', marginBottom: 8 }}>{aiError}</p>}
              <button onClick={generateAI} disabled={aiLoading || !topic.trim()} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: (aiLoading || !topic.trim()) ? 0.5 : 1 }}>
                {aiLoading
                  ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> 생성 중... (약 10~30초)</>
                  : `✨ AI로 ${cardCount}장 자동 작성`}
              </button>
            </div>

            {/* 템플릿 선택 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>카드 추가</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {TEMPLATES.map(t => (
                  <button key={t.key} onClick={() => addCard(t.key)}
                    style={{ padding: '8px 4px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#191F28', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 카드 목록 */}
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 10 }}>카드 목록 ({cards.length}장)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cards.map((c, i) => (
                  <div key={i} onClick={() => setActiveIdx(i)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: i === activeIdx ? '#E6F2F2' : '#F8F9FA',
                    border: i === activeIdx ? '1px solid #005957' : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: i === activeIdx ? '#005957' : '#191F28' }}>
                      {TEMPLATES.find(t => t.key === c.template)?.emoji} {i + 1}. {TEMPLATES.find(t => t.key === c.template)?.label}
                    </span>
                    <button onClick={e => { e.stopPropagation(); removeCard(i); }}
                      style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 style={{ width: 13, height: 13, color: '#8B95A1' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 편집 패널 */}
            {activeCard && (
              <div className="card" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 12 }}>
                  {TEMPLATES.find(t => t.key === activeCard.template)?.emoji} 카드 {activeIdx + 1} 편집
                </p>
                <EditPanel card={activeCard} onChange={c => updateCard(activeIdx, c)} />
              </div>
            )}
          </div>

          {/* 우측 미리보기 패널 */}
          <div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* 컨트롤 */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([1080, 1920] as const).map(s => (
                    <button key={s} onClick={() => setSize(s)} style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: size === s ? '#005957' : '#F2F4F6',
                      color: size === s ? 'white' : '#8B95A1',
                    }}>
                      {s === 1080 ? '1080×1080' : '1920×1080'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={downloadCurrent} className="btn-outline" style={{ gap: 6 }}>
                    <Download style={{ width: 14, height: 14 }} /> PNG 저장
                  </button>
                  <button onClick={downloadAll} className="btn-primary" style={{ gap: 6 }}>
                    <Download style={{ width: 14, height: 14 }} /> 전체 ZIP
                  </button>
                </div>
              </div>

              {/* 미리보기 카드 */}
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', aspectRatio: size === 1080 ? '1/1' : '16/9', width: '100%', maxWidth: PREVIEW }}>
                <div ref={previewRef} style={{ width: PREVIEW, height: size === 1080 ? PREVIEW : PREVIEW * (1080 / 1920) }}>
                  {activeCard && renderCard(activeCard, PREVIEW)}
                </div>
              </div>

              {/* 썸네일 줄 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {cards.map((c, i) => (
                  <div key={i} onClick={() => setActiveIdx(i)} style={{
                    width: 60, height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: i === activeIdx ? '2px solid #005957' : '2px solid transparent',
                    flexShrink: 0,
                  }}>
                    <div style={{ transform: 'scale(0.0556)', transformOrigin: '0 0', width: 1080, height: 1080 }}>
                      {renderCard(c, 1080)}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: 12, fontSize: 12, color: '#8B95A1' }}>
                실제 다운로드: {size}×{size === 1080 ? '1080' : '1080'}px PNG
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

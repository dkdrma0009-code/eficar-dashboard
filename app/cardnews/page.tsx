'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import type { CardItem, CardRatio, CoverData, BigNumberData, BeforeAfterData, ListData, CustomerCaseData, TimelineData, QuoteData, CTAData } from './types';
import { RATIO_HEIGHT, CARD_WIDTH } from './types';
import CardForm from './components/CardForm';
import type { KpiPreset } from './components/CardForm';
import CardCanvas from './components/CardCanvas';
import ExportBar from './components/ExportBar';
import type { CardFormInput } from './types';
import { useDashboardData } from '@/lib/DataContext';
import { computeViewData, formatCurrency, formatPercent } from '@/lib/dataUtils';

type Stage = 'form' | 'preview' | 'export';

const RATIO_OPTIONS: { label: string; value: CardRatio; desc: string }[] = [
  { label: '1:1', value: '1:1', desc: '인스타그램 정방형' },
  { label: '4:5', value: '4:5', desc: '인스타그램 세로형' },
  { label: '9:16', value: '9:16', desc: '스토리 / 릴스' },
  { label: '16:9', value: '16:9', desc: '가로형' },
];

export default function CardNewsPage() {
  const [stage, setStage] = useState<Stage>('form');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [ratio, setRatio] = useState<CardRatio>('1:1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentInput, setCurrentInput] = useState<CardFormInput | null>(null);
  const [selectedCard, setSelectedCard] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData } = useDashboardData();

  const kpiPreset = useMemo<KpiPreset | undefined>(() => {
    if (!dashboardData || !Array.isArray(dashboardData.records)) return undefined;
    const view = computeViewData(dashboardData.records, dashboardData.latestMonth, dashboardData.customers, dashboardData.latestMonth);
    const metrics: string[] = [];
    if (view.totalCurrentSales > 0) {
      metrics.push(`이번달 매출 ${formatCurrency(view.totalCurrentSales)}`);
    }
    if (view.growthRate !== 0) {
      metrics.push(`전월 대비 성장률 ${formatPercent(view.growthRate)}`);
    }
    if (view.transactionCount > 0) {
      metrics.push(`거래건수 ${view.transactionCount}건 / 활성 고객사 ${view.activeCustomers}개`);
    }
    return {
      metric1: metrics[0],
      metric2: metrics[1],
      metric3: metrics[2],
      targetCustomer: view.mvpCustomer?.name,
    };
  }, [dashboardData]);

  const updateCard = useCallback(<T extends CardItem['data']>(index: number, patch: Partial<T>) => {
    setCards(prev => prev.map((c, i) => i === index ? { ...c, data: { ...c.data, ...patch } } as CardItem : c));
  }, []);

  const handleGenerate = useCallback(async (input: CardFormInput) => {
    setLoading(true);
    setError('');
    setCurrentInput(input);
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? '생성 중 오류가 발생했습니다.');
        return;
      }
      setCards(data.cards ?? []);
      setSelectedCard(0);
      setStage('preview');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const cardWidth = CARD_WIDTH;
  const cardHeight = Math.round(cardWidth * RATIO_HEIGHT[ratio]);
  const previewScale = 320 / cardWidth;
  const previewH = Math.round(cardHeight * previewScale);

  const RatioSelector = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-600 mr-2">비율:</span>
        {RATIO_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setRatio(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              ratio === opt.value ? 'bg-[#005957] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label} <span className="ml-1 text-xs opacity-70">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#005957', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>&#8734;</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">카드뉴스 생성</h1>
              <p className="text-xs text-gray-500 mt-0.5">에픽카 AI 카드뉴스 메이커</p>
            </div>
          </div>

          {/* Stage nav */}
          <div className="flex items-center gap-2">
            {(['form', 'preview', 'export'] as Stage[]).map((s, i) => {
              const labels: Record<Stage, string> = { form: '입력', preview: '미리보기', export: '내보내기' };
              const enabled = s === 'form' || cards.length > 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className="w-6 h-px bg-gray-200" />}
                  <button
                    onClick={() => enabled && setStage(s)}
                    disabled={!enabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      stage === s ? 'bg-[#005957] text-white'
                        : enabled ? 'text-gray-500 hover:text-gray-700'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                      stage === s ? 'bg-white text-[#005957]' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                    {labels[s]}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      {stage === 'form' && (
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">카드뉴스 정보 입력</h2>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <CardForm onSubmit={handleGenerate} loading={loading} kpiPreset={kpiPreset} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { num: '8', label: '레이아웃 타입' },
              { num: '4', label: '비율 프리셋' },
              { num: '5', label: '내보내기 형식' },
            ].map(({ num, label }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="text-2xl font-black text-[#005957]">{num}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {stage === 'preview' && cards.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">카드뉴스 미리보기</h2>
              <p className="text-sm text-gray-500 mt-0.5">총 {cards.length}장</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStage('form')}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← 다시 입력
              </button>
              <button
                onClick={() => setStage('export')}
                className="bg-[#005957] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#004745] transition-colors"
              >
                내보내기 →
              </button>
            </div>
          </div>

          <RatioSelector />

          <div className="flex gap-6">
            {/* Thumbnail strip */}
            <div
              ref={scrollRef}
              className="flex flex-col gap-3 overflow-y-auto"
              style={{ maxHeight: '80vh', width: 340, flexShrink: 0 }}
            >
              {cards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCard(i)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    selectedCard === i
                      ? 'ring-2 ring-[#005957] shadow-lg'
                      : 'ring-1 ring-gray-200 hover:ring-gray-400'
                  }`}
                  style={{ width: 320, height: previewH, flexShrink: 0 }}
                >
                  <CardCanvas card={card} ratio={ratio} scale={previewScale} />
                  <div
                    style={{
                      position: 'absolute', top: 8, left: 8,
                      background: 'rgba(0,0,0,0.5)', color: '#fff',
                      fontSize: 11, fontWeight: 700, borderRadius: 4,
                      padding: '2px 6px',
                    }}
                  >
                    {i + 1}/{cards.length}
                  </div>
                  <div
                    style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(0,0,0,0.4)', color: '#fff',
                      fontSize: 11, borderRadius: 4, padding: '2px 6px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {card.layout}
                  </div>
                </button>
              ))}
            </div>

            {/* Large single preview */}
            <div className="flex-1 flex flex-col items-center">
              <div className="sticky top-24">
                <div
                  className="rounded-2xl overflow-hidden shadow-xl"
                  style={{
                    width: Math.min(540, cardWidth),
                    height: Math.round(Math.min(540, cardWidth) * RATIO_HEIGHT[ratio]),
                  }}
                >
                  {cards[selectedCard] && (
                    <CardCanvas
                      card={cards[selectedCard]}
                      ratio={ratio}
                      scale={Math.min(540, cardWidth) / cardWidth}
                    />
                  )}
                </div>
                <p className="mt-3 text-center text-sm text-gray-500 capitalize">
                  {selectedCard + 1} / {cards.length} &middot; {cards[selectedCard]?.layout}
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <button
                    onClick={() => setSelectedCard(i => Math.max(0, i - 1))}
                    disabled={selectedCard === 0}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold disabled:opacity-30 hover:bg-gray-200 transition-colors"
                  >
                    ← 이전
                  </button>
                  <button
                    onClick={() => setSelectedCard(i => Math.min(cards.length - 1, i + 1))}
                    disabled={selectedCard === cards.length - 1}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold disabled:opacity-30 hover:bg-gray-200 transition-colors"
                  >
                    다음 →
                  </button>
                </div>
              </div>
            </div>

            {/* Inline editor panel */}
            {cards[selectedCard] && (
              <div className="w-72 flex-shrink-0">
                <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#005957]" />
                    <span className="text-sm font-bold text-gray-700">카드 편집</span>
                    <span className="ml-auto text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                      {cards[selectedCard].layout}
                    </span>
                  </div>
                  <CardEditor card={cards[selectedCard]} index={selectedCard} updateCard={updateCard} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EXPORT ── */}
      {stage === 'export' && cards.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">내보내기</h2>
              <p className="text-sm text-gray-500 mt-0.5">총 {cards.length}장 &middot; {ratio} 비율</p>
            </div>
            <button
              onClick={() => setStage('preview')}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← 미리보기
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">내보내기 형식 선택</h3>
                <p className="text-sm text-gray-500">ZIP으로 전체 PNG를 한 번에 다운로드할 수 있습니다</p>
              </div>
              <ExportBar
                cards={cards}
                ratio={ratio}
                topic={currentInput?.topic ?? 'cardnews'}
              />
            </div>
          </div>

          <RatioSelector />

          {/* Hidden full-res canvases for html2canvas */}
          <div
            style={{
              position: 'fixed', top: -9999, left: -9999,
              pointerEvents: 'none', zIndex: -1,
            }}
          >
            {cards.map((card, i) => (
              <div
                key={i}
                id={`card-export-${i}`}
                style={{ width: cardWidth, height: cardHeight, overflow: 'hidden' }}
              >
                <CardCanvas card={card} ratio={ratio} forExport />
              </div>
            ))}
          </div>

          {/* Preview grid */}
          <h3 className="text-base font-semibold text-gray-700 mb-4">
            전체 카드 ({cards.length}장)
          </h3>
          <div className="flex flex-wrap gap-4">
            {cards.map((card, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="rounded-xl overflow-hidden shadow-sm border border-gray-200"
                  style={{ width: 200, height: Math.round(200 * RATIO_HEIGHT[ratio]) }}
                >
                  <CardCanvas card={card} ratio={ratio} scale={200 / cardWidth} />
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center capitalize">
                  {i + 1}. {card.layout}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 24, padding: 32,
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 16, maxWidth: 360, width: '100%', margin: '0 16px',
            }}
          >
            <div
              style={{
                width: 48, height: 48,
                border: '4px solid #005957', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#191F28', marginBottom: 4 }}>AI 카드뉴스 생성 중</div>
              <div style={{ fontSize: 14, color: '#8B95A1' }}>Gemini가 콘텐츠를 작성하고 있습니다...</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Inline Card Editor ─────────────────────────────────────────────────────── */

const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#005957] bg-white resize-none';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 mb-1 mt-3 first:mt-0';

function Field({ label, value, onChange, multiline }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {multiline ? (
        <textarea className={INPUT_CLS} value={value} rows={2} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className={INPUT_CLS} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function CardEditor({ card, index, updateCard }: {
  card: CardItem;
  index: number;
  updateCard: <T extends CardItem['data']>(index: number, patch: Partial<T>) => void;
}) {
  const u = <T extends CardItem['data']>(patch: Partial<T>) => updateCard<T>(index, patch);

  if (card.layout === 'cover') {
    const d = card.data as CoverData;
    return (
      <div className="space-y-0">
        <Field label="헤드라인" value={d.headline ?? ''} onChange={v => u({ headline: v })} multiline />
        <Field label="부제목" value={d.subheadline ?? ''} onChange={v => u({ subheadline: v })} />
        <Field label="핵심 수치" value={d.highlight ?? ''} onChange={v => u({ highlight: v })} />
        <Field label="배지" value={d.badge ?? ''} onChange={v => u({ badge: v })} />
      </div>
    );
  }
  if (card.layout === 'big-number') {
    const d = card.data as BigNumberData;
    return (
      <div className="space-y-0">
        <Field label="수치" value={d.number ?? ''} onChange={v => u({ number: v })} />
        <Field label="단위" value={d.unit ?? ''} onChange={v => u({ unit: v })} />
        <Field label="태그" value={d.tag ?? ''} onChange={v => u({ tag: v })} />
        <Field label="설명" value={d.desc ?? ''} onChange={v => u({ desc: v })} multiline />
      </div>
    );
  }
  if (card.layout === 'before-after') {
    const d = card.data as BeforeAfterData;
    return (
      <div className="space-y-0">
        <Field label="헤드라인" value={d.headline ?? ''} onChange={v => u({ headline: v })} />
        <Field label="A 컬럼" value={d.headerA ?? ''} onChange={v => u({ headerA: v })} />
        <Field label="B 컬럼" value={d.headerB ?? ''} onChange={v => u({ headerB: v })} />
        {d.rows.map((row, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-2 mt-3">
            <div className="text-xs font-semibold text-gray-400 mb-1">행 {i + 1}</div>
            <Field label="항목" value={row.label} onChange={v => u({ rows: d.rows.map((r, j) => j === i ? { ...r, label: v } : r) })} />
            <Field label="A 값" value={row.a} onChange={v => u({ rows: d.rows.map((r, j) => j === i ? { ...r, a: v } : r) })} />
            <Field label="B 값" value={row.b} onChange={v => u({ rows: d.rows.map((r, j) => j === i ? { ...r, b: v } : r) })} />
          </div>
        ))}
      </div>
    );
  }
  if (card.layout === 'list') {
    const d = card.data as ListData;
    return (
      <div className="space-y-0">
        <Field label="헤드라인" value={d.headline ?? ''} onChange={v => u({ headline: v })} />
        {d.items.map((item, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-2 mt-3">
            <div className="text-xs font-semibold text-gray-400 mb-1">항목 {i + 1}</div>
            <Field label="제목" value={item.title} onChange={v => u({ items: d.items.map((it, j) => j === i ? { ...it, title: v } : it) })} />
            <Field label="설명" value={item.desc ?? ''} onChange={v => u({ items: d.items.map((it, j) => j === i ? { ...it, desc: v } : it) })} multiline />
          </div>
        ))}
      </div>
    );
  }
  if (card.layout === 'customer-case') {
    const d = card.data as CustomerCaseData;
    return (
      <div className="space-y-0">
        <Field label="헤드라인" value={d.headline ?? ''} onChange={v => u({ headline: v })} />
        {d.cases.map((c, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-2 mt-3">
            <div className="text-xs font-semibold text-gray-400 mb-1">고객사 {i + 1}</div>
            <Field label="고객사명" value={c.name} onChange={v => u({ cases: d.cases.map((cs, j) => j === i ? { ...cs, name: v } : cs) })} />
            <Field label="지표명" value={c.metric} onChange={v => u({ cases: d.cases.map((cs, j) => j === i ? { ...cs, metric: v } : cs) })} />
            <Field label="수치" value={c.number} onChange={v => u({ cases: d.cases.map((cs, j) => j === i ? { ...cs, number: v } : cs) })} />
            <Field label="단위" value={c.unit ?? ''} onChange={v => u({ cases: d.cases.map((cs, j) => j === i ? { ...cs, unit: v } : cs) })} />
          </div>
        ))}
      </div>
    );
  }
  if (card.layout === 'timeline') {
    const d = card.data as TimelineData;
    return (
      <div className="space-y-0">
        <Field label="헤드라인" value={d.headline ?? ''} onChange={v => u({ headline: v })} />
        {d.steps.map((step, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-2 mt-3">
            <div className="text-xs font-semibold text-gray-400 mb-1">단계 {i + 1}</div>
            <Field label="제목" value={step.title} onChange={v => u({ steps: d.steps.map((s, j) => j === i ? { ...s, title: v } : s) })} />
            <Field label="설명" value={step.desc ?? ''} onChange={v => u({ steps: d.steps.map((s, j) => j === i ? { ...s, desc: v } : s) })} multiline />
          </div>
        ))}
      </div>
    );
  }
  if (card.layout === 'quote') {
    const d = card.data as QuoteData;
    return (
      <div className="space-y-0">
        <Field label="인용 문구" value={d.quote ?? ''} onChange={v => u({ quote: v })} multiline />
        <Field label="출처" value={d.attribution ?? ''} onChange={v => u({ attribution: v })} />
        <Field label="맥락 태그" value={d.context ?? ''} onChange={v => u({ context: v })} />
      </div>
    );
  }
  if (card.layout === 'cta') {
    const d = card.data as CTAData;
    return (
      <div className="space-y-0">
        <Field label="헤드라인" value={d.headline ?? ''} onChange={v => u({ headline: v })} multiline />
        <Field label="부제목" value={d.subheadline ?? ''} onChange={v => u({ subheadline: v })} />
        <Field label="이메일" value={d.contact1 ?? ''} onChange={v => u({ contact1: v })} />
        <Field label="전화" value={d.contact2 ?? ''} onChange={v => u({ contact2: v })} />
      </div>
    );
  }
  return null;
}

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import type { CardItem, CardRatio } from './types';
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

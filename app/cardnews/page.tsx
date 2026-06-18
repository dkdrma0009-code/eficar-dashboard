'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CardContent, GeneratedCard, CardFormInput } from './types';
import { CARD_WIDTH } from './types';
import CardForm from './components/CardForm';
import type { KpiPreset } from './components/CardForm';
import ExportBar from './components/ExportBar';
import { useDashboardData } from '@/lib/DataContext';
import { computeViewData, formatCurrency, formatPercent } from '@/lib/dataUtils';

type Stage = 'form' | 'preview' | 'export';

// Templates are always 540×540 — use 1:1 fixed
const CARD_RATIO = '1:1' as const;
const CARD_HEIGHT = CARD_WIDTH;

const SKELETON_COUNT = 6;

/* ── Skeleton card ──────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ width: 540, height: 540, background: '#F3F4F6', borderRadius: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#E5E7EB' }} />
      <div style={{ padding: 40 }}>
        <div style={{ width: 80, height: 24, background: '#E5E7EB', borderRadius: 6, marginBottom: 24 }} />
        <div style={{ width: '60%', height: 14, background: '#E5E7EB', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ width: '40%', height: 48, background: '#E5E7EB', borderRadius: 6, marginBottom: 16 }} />
        <div style={{ width: '80%', height: 12, background: '#E5E7EB', borderRadius: 4 }} />
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
        animation: 'shimmer 1.4s infinite',
      }} />
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function CardNewsPage() {
  const [stage, setStage] = useState<Stage>('form');
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [skeletonCount, setSkeletonCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentInput, setCurrentInput] = useState<CardFormInput | null>(null);
  const [selectedCard, setSelectedCard] = useState(0);
  const [rerendering, setRerendering] = useState(false);

  const { data: dashboardData } = useDashboardData();

  const kpiPreset = useMemo<KpiPreset | undefined>(() => {
    if (!dashboardData || !Array.isArray(dashboardData.records)) return undefined;
    const view = computeViewData(
      dashboardData.records,
      dashboardData.latestMonth,
      dashboardData.customers,
      dashboardData.latestMonth,
    );

    const metrics: string[] = [];

    if (view.totalCurrentSales > 0) {
      metrics.push(`이번달 매출 ${formatCurrency(view.totalCurrentSales)}`);
    }

    // MTD 진행 중인 달은 일평균 기준이라 음수 성장률이 나올 수 있음 → 양수만 사용
    if (view.growthRate > 0) {
      metrics.push(`전월 대비 성장률 +${Math.abs(view.growthRate).toFixed(1)}%`);
    } else {
      // 음수면 최고 성장 고객사 수치로 대체
      const mvp = [...(view.customerStats ?? [])]
        .sort((a, b) => b.growthRate - a.growthRate)[0];
      if (mvp && mvp.growthRate > 0) {
        metrics.push(`${mvp.name} 전월 대비 +${mvp.growthRate.toFixed(1)}% 성장`);
      }
    }

    if (view.transactionCount > 0) {
      metrics.push(`거래건수 ${view.transactionCount}건 / 활성 고객사 ${view.activeCustomers}개`);
    }

    // 매출 1위 고객사를 targetCustomer로 사용 (엑셀 원본 고객사명이 아닌 실적 기준)
    const topCustomer = [...(view.customerStats ?? [])]
      .filter(c => c.currentMonthSales > 0)
      .sort((a, b) => b.currentMonthSales - a.currentMonthSales)[0];

    return {
      metric1: metrics[0],
      metric2: metrics[1],
      metric3: metrics[2],
      targetCustomer: topCustomer?.name,
    };
  }, [dashboardData]);

  const handleGenerate = useCallback(async (input: CardFormInput) => {
    setLoading(true);
    setError('');
    setCurrentInput(input);
    setSkeletonCount(input.cardCount ?? SKELETON_COUNT);
    setGeneratedCards([]);
    try {
      console.log('[cardnews] sending:', { topic: input.topic, cardCount: input.cardCount });
      const res = await fetch('/api/ai-generate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json() as { cards?: GeneratedCard[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? '생성 중 오류가 발생했습니다.');
        return;
      }
      setGeneratedCards(data.cards ?? []);
      setSelectedCard(0);
      setStage('preview');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCardContent = useCallback(async (index: number, patch: Partial<CardContent>) => {
    setGeneratedCards(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content: { ...updated[index].content, ...patch } };
      return updated;
    });

    setRerendering(true);
    try {
      const current = generatedCards[index];
      const newContent: CardContent = { ...current.content, ...patch };
      const total = generatedCards.length;
      const res = await fetch('/api/ai-generate-html/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, index, total }),
      });
      const data = await res.json() as { html?: string; error?: string };
      if (data.html) {
        setGeneratedCards(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], html: data.html!, content: newContent };
          return updated;
        });
      }
    } finally {
      setRerendering(false);
    }
  }, [generatedCards]);

  const previewScale = 320 / CARD_WIDTH;
  const previewH = Math.round(CARD_HEIGHT * previewScale);

  const hasCards = generatedCards.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#005957', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>∞</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">카드뉴스 생성</h1>
              <p className="text-xs text-gray-500 mt-0.5">에픽카 AI 카드뉴스 메이커</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['form', 'preview', 'export'] as Stage[]).map((s, i) => {
              const labels: Record<Stage, string> = { form: '입력', preview: '미리보기', export: '내보내기' };
              const enabled = s === 'form' || hasCards;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className="w-6 h-px bg-gray-200" />}
                  <button
                    onClick={() => enabled && setStage(s)}
                    disabled={!enabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      stage === s ? 'bg-[#005957] text-white' : enabled ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${stage === s ? 'bg-white text-[#005957]' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
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
            {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
            <CardForm onSubmit={handleGenerate} loading={loading} kpiPreset={kpiPreset} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { num: '∞', label: 'AI 자동 디자인' },
              { num: '7', label: '카드 템플릿' },
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
      {stage === 'preview' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                카드뉴스 미리보기
                {rerendering && <span className="ml-3 inline-block w-4 h-4 border-2 border-[#005957] border-t-transparent rounded-full animate-spin align-middle" />}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">총 {generatedCards.length}장</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setStage('form')} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">← 다시 입력</button>
              <button onClick={() => setStage('export')} disabled={!hasCards} className="bg-[#005957] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#004745] transition-colors disabled:opacity-40">내보내기 →</button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Thumbnail strip */}
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ width: 336, flexShrink: 0, maxHeight: '80vh' }}>
              {loading
                ? Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ width: 320, height: 320, flexShrink: 0 }}>
                      <div style={{ width: 540, height: 540, transformOrigin: 'top left', transform: `scale(${320 / 540})` }}>
                        <SkeletonCard />
                      </div>
                    </div>
                  ))
                : generatedCards.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedCard(i)}
                      className={`relative rounded-xl overflow-hidden transition-all text-left ${selectedCard === i ? 'ring-2 ring-[#005957] shadow-lg' : 'ring-1 ring-gray-200 hover:ring-gray-400'}`}
                      style={{ width: 320, height: 320, flexShrink: 0, background: '#f5f5f5' }}
                    >
                      <div style={{ width: 540, height: 540, transformOrigin: 'top left', transform: `scale(${320 / 540})` }}
                        dangerouslySetInnerHTML={{ __html: card.html }} />
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>
                        {i + 1}/{generatedCards.length}
                      </div>
                      <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 11, borderRadius: 4, padding: '2px 6px' }}>
                        {card.type}
                      </div>
                    </button>
                  ))
              }
            </div>

            {/* Large preview */}
            <div className="flex-1 flex flex-col items-center">
              <div className="sticky top-24">
                <div className="rounded-2xl overflow-hidden shadow-xl" style={{ width: 540, height: 540 }}>
                  {generatedCards[selectedCard] && (
                    <div dangerouslySetInnerHTML={{ __html: generatedCards[selectedCard].html }} />
                  )}
                  {loading && !generatedCards[selectedCard] && (
                    <SkeletonCard />
                  )}
                </div>
                {generatedCards[selectedCard] && (
                  <>
                    <p className="mt-3 text-center text-sm text-gray-500">
                      {selectedCard + 1} / {generatedCards.length} · {generatedCards[selectedCard].type}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <button onClick={() => setSelectedCard(i => Math.max(0, i - 1))} disabled={selectedCard === 0}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold disabled:opacity-30 hover:bg-gray-200 transition-colors">← 이전</button>
                      <button onClick={() => setSelectedCard(i => Math.min(generatedCards.length - 1, i + 1))} disabled={selectedCard === generatedCards.length - 1}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold disabled:opacity-30 hover:bg-gray-200 transition-colors">다음 →</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Side panel editor */}
            {generatedCards[selectedCard] && (
              <div style={{ width: 280, flexShrink: 0 }}>
                <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#005957]" />
                    <span className="text-sm font-bold text-gray-700">카드 편집</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {generatedCards[selectedCard].type}
                    </span>
                  </div>
                  <CardEditor
                    content={generatedCards[selectedCard].content}
                    onChange={patch => updateCardContent(selectedCard, patch)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EXPORT ── */}
      {stage === 'export' && hasCards && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">내보내기</h2>
              <p className="text-sm text-gray-500 mt-0.5">총 {generatedCards.length}장 · 540×540 정방형</p>
            </div>
            <button onClick={() => setStage('preview')} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">← 미리보기</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">내보내기 형식 선택</h3>
                <p className="text-sm text-gray-500">ZIP으로 전체 PNG를 한 번에 다운로드할 수 있습니다</p>
              </div>
              <ExportBar cards={generatedCards} ratio={CARD_RATIO} topic={currentInput?.topic ?? 'cardnews'} />
            </div>
          </div>

          {/* Hidden full-res divs for html2canvas */}
          <div style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none', zIndex: -1 }}>
            {generatedCards.map((card, i) => (
              <div key={i} id={`card-export-${i}`} style={{ width: CARD_WIDTH, height: CARD_HEIGHT, overflow: 'hidden' }}
                dangerouslySetInnerHTML={{ __html: card.html }} />
            ))}
          </div>

          <h3 className="text-base font-semibold text-gray-700 mb-4">전체 카드 ({generatedCards.length}장)</h3>
          <div className="flex flex-wrap gap-4">
            {generatedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200" style={{ width: 200, height: 200 }}>
                  <div style={{ width: 540, height: 540, transformOrigin: 'top left', transform: 'scale(0.370)' }}
                    dangerouslySetInnerHTML={{ __html: card.html }} />
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">{i + 1}. {card.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 360, width: '100%', margin: '0 16px' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #005957', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#191F28', marginBottom: 4 }}>AI 카드뉴스 생성 중</div>
              <div style={{ fontSize: 14, color: '#8B95A1' }}>Gemini가 콘텐츠를 작성하고 있습니다...</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

/* ── Inline Card Editor ─────────────────────────────────────────────────────── */

const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#005957] bg-white resize-none';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 mb-1 mt-3 first:mt-0';

function Field({ label, value, onChange, multiline, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {multiline ? (
        <textarea className={INPUT_CLS} value={value} rows={2} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className={INPUT_CLS} type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function CardEditor({ content, onChange }: {
  content: CardContent;
  onChange: (patch: Partial<CardContent>) => void;
}) {
  switch (content.type) {
    case 'cover':
      return (
        <div>
          <Field label="배지" value={content.badge ?? ''} placeholder="절감 솔루션" onChange={v => onChange({ badge: v })} />
          <Field label="헤드라인 (\\n으로 줄바꿈)" value={content.headline ?? ''} placeholder="부품비를\n줄이는 방법" onChange={v => onChange({ headline: v })} multiline />
          <Field label="부제목" value={content.subtext ?? ''} onChange={v => onChange({ subtext: v })} />
        </div>
      );
    case 'kpi':
      return (
        <div>
          <Field label="제목" value={content.kpiTitle ?? ''} onChange={v => onChange({ kpiTitle: v })} />
          <Field label="수치" value={content.kpiNumber ?? ''} placeholder="1.6억" onChange={v => onChange({ kpiNumber: v })} />
          <Field label="레이블" value={content.kpiLabel ?? ''} placeholder="SK렌터카 연간" onChange={v => onChange({ kpiLabel: v })} />
          <Field label="설명" value={content.kpiDesc ?? ''} onChange={v => onChange({ kpiDesc: v })} />
        </div>
      );
    case 'comparison':
      return (
        <div>
          <Field label="제목" value={content.compTitle ?? ''} onChange={v => onChange({ compTitle: v })} />
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500">비교 행 (최대 5개)</div>
            {(content.compRows ?? []).map((row, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">행 {i + 1}</div>
                <input className={INPUT_CLS + ' mb-1'} value={row.item} placeholder="항목" onChange={e => {
                  const rows = [...(content.compRows ?? [])];
                  rows[i] = { ...rows[i], item: e.target.value };
                  onChange({ compRows: rows });
                }} />
                <div className="flex gap-1">
                  <input className={INPUT_CLS} value={row.oem} placeholder="OEM" onChange={e => {
                    const rows = [...(content.compRows ?? [])];
                    rows[i] = { ...rows[i], oem: e.target.value };
                    onChange({ compRows: rows });
                  }} />
                  <input className={INPUT_CLS} value={row.eficar} placeholder="에픽카" onChange={e => {
                    const rows = [...(content.compRows ?? [])];
                    rows[i] = { ...rows[i], eficar: e.target.value };
                    onChange({ compRows: rows });
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'customers':
      return (
        <div>
          <Field label="제목" value={content.custTitle ?? ''} onChange={v => onChange({ custTitle: v })} />
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500">파트너사 (최대 4개)</div>
            {(content.customers ?? []).map((cu, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">{i + 1}번째</div>
                <input className={INPUT_CLS + ' mb-1'} value={cu.name} placeholder="고객사명" onChange={e => {
                  const arr = [...(content.customers ?? [])];
                  arr[i] = { ...arr[i], name: e.target.value };
                  onChange({ customers: arr });
                }} />
                <input className={INPUT_CLS + ' mb-1'} value={cu.metric} placeholder="지표명" onChange={e => {
                  const arr = [...(content.customers ?? [])];
                  arr[i] = { ...arr[i], metric: e.target.value };
                  onChange({ customers: arr });
                }} />
                <div className="flex gap-1">
                  <input className={INPUT_CLS} value={cu.value} placeholder="수치" onChange={e => {
                    const arr = [...(content.customers ?? [])];
                    arr[i] = { ...arr[i], value: e.target.value };
                    onChange({ customers: arr });
                  }} />
                  <input className={INPUT_CLS} value={cu.note ?? ''} placeholder="참고" onChange={e => {
                    const arr = [...(content.customers ?? [])];
                    arr[i] = { ...arr[i], note: e.target.value };
                    onChange({ customers: arr });
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'list':
      return (
        <div>
          <Field label="제목" value={content.listTitle ?? ''} onChange={v => onChange({ listTitle: v })} />
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500">항목 (최대 4개)</div>
            {(content.listItems ?? []).map((it, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">{it.num}번</div>
                <input className={INPUT_CLS + ' mb-1'} value={it.title} placeholder="제목" onChange={e => {
                  const arr = [...(content.listItems ?? [])];
                  arr[i] = { ...arr[i], title: e.target.value };
                  onChange({ listItems: arr });
                }} />
                <input className={INPUT_CLS} value={it.desc} placeholder="설명" onChange={e => {
                  const arr = [...(content.listItems ?? [])];
                  arr[i] = { ...arr[i], desc: e.target.value };
                  onChange({ listItems: arr });
                }} />
              </div>
            ))}
          </div>
        </div>
      );
    case 'timeline':
      return (
        <div>
          <Field label="제목" value={content.timeTitle ?? ''} onChange={v => onChange({ timeTitle: v })} />
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500">단계 (최대 4개)</div>
            {(content.timeSteps ?? []).map((s, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">단계 {i + 1}</div>
                <input className={INPUT_CLS + ' mb-1'} value={s.title} placeholder="단계명" onChange={e => {
                  const arr = [...(content.timeSteps ?? [])];
                  arr[i] = { ...arr[i], title: e.target.value };
                  onChange({ timeSteps: arr });
                }} />
                <input className={INPUT_CLS} value={s.desc} placeholder="설명" onChange={e => {
                  const arr = [...(content.timeSteps ?? [])];
                  arr[i] = { ...arr[i], desc: e.target.value };
                  onChange({ timeSteps: arr });
                }} />
              </div>
            ))}
          </div>
        </div>
      );
    case 'cta':
      return (
        <div>
          <Field label="상단 레이블" value={content.ctaBadge ?? ''} placeholder="지금 바로 시작하세요" onChange={v => onChange({ ctaBadge: v })} />
          <Field label="메인 카피 (\\n으로 줄바꿈)" value={content.ctaTitle ?? ''} placeholder="2주 안에\n도입 가능합니다" onChange={v => onChange({ ctaTitle: v })} multiline />
        </div>
      );
    default:
      return null;
  }
}

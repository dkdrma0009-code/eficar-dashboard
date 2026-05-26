'use client';
import { useState, useMemo, useEffect } from 'react';
import { Sparkles, Copy, Check, AlertTriangle, TrendingUp, TrendingDown, FileText, Pencil, X, Brain } from 'lucide-react';
import { useDashboardData } from '@/lib/DataContext';
import { getCampaigns } from '@/lib/campaignStorage';
import { categorizeProduct } from '@/lib/dataUtils';

const URGENCY_OPTIONS = ['높음', '보통', '낮음'] as const;
const URGENCY_COLOR: Record<string, { bg: string; color: string }> = {
  '높음': { bg: '#FEF2F2', color: '#DC2626' },
  '보통': { bg: '#FFFBEB', color: '#D97706' },
  '낮음': { bg: '#F0FDF4', color: '#16A34A' },
};
const ALL_ITEMS = ['헤드램프', '테일램프', '범퍼', '휠/타이어', '사이드미러', '후드', '도어', '에픽커넥트', '에픽렌즈'];

function getPrevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
}

interface ProposalItem { item: string; reason: string; benefit: string; urgency: string; }
interface ProposalResult {
  title: string; greeting: string; currentAchievement: string;
  proposalItems: ProposalItem[]; roiSummary: string; nextStep: string; closing: string;
}

export default function ProposalPage() {
  const { data } = useDashboardData();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<ProposalResult | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const customers = useMemo(() => {
    if (!data) return [];
    return data.customers.filter(c => /sk|롯데|그린카|삼성화재/i.test(c));
  }, [data]);

  const customerData = useMemo(() => {
    if (!data || !selectedCustomer) return null;
    const currentMonth = data.currentMonth;
    const prevMonth = getPrevMonth(currentMonth);
    const curRecs = data.records.filter(r => r.date === currentMonth && r.service === selectedCustomer);
    const prevRecs = data.records.filter(r => r.date === prevMonth && r.service === selectedCustomer);
    const currentSales = curRecs.reduce((s, r) => s + r.amount, 0);
    const prevSales = prevRecs.reduce((s, r) => s + r.amount, 0);
    const growthRate = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;
    const totalSales = data.records.filter(r => r.service === selectedCustomer).reduce((s, r) => s + r.amount, 0);
    const monthsActive = data.allMonths.filter(m => data.records.some(r => r.date === m && r.service === selectedCustomer && r.amount > 0)).length;
    const itemMap = new Map<string, number>();
    curRecs.forEach(r => {
      const cat = categorizeProduct(r.itemName);
      itemMap.set(cat, (itemMap.get(cat) ?? 0) + r.amount);
    });
    const topItems = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n);
    const missingItems = ALL_ITEMS.filter(item => !topItems.some(t => t.startsWith(item.split('/')[0])));
    return { currentMonth, currentSales, prevSales, growthRate, totalSales, monthsActive, topItems, missingItems };
  }, [data, selectedCustomer]);

  const generate = async () => {
    if (!customerData || !selectedCustomer) return;
    setLoading(true); setError(''); setDraft(null); setEditMode(false);
    try {
      const campaigns = getCampaigns().filter(c => c.customer === selectedCustomer);
      const res = await fetch('/api/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: selectedCustomer,
          currentMonth: customerData.currentMonth,
          currentSales: customerData.currentSales,
          prevSales: customerData.prevSales,
          growthRate: customerData.growthRate,
          totalSales: customerData.totalSales,
          monthsActive: customerData.monthsActive,
          topItems: customerData.topItems,
          missingItems: customerData.missingItems,
          campaignHistory: campaigns.slice(0, 5),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setDraft(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const proposalText = useMemo(() => {
    if (!draft) return '';
    return [
      draft.title, '',
      draft.greeting, '',
      '[ 현재 성과 ]', draft.currentAchievement, '',
      '[ 추가 제안 품목 ]',
      ...(draft.proposalItems ?? []).map(p => `• ${p.item}\n  - ${p.reason}\n  - 기대 효과: ${p.benefit}`),
      '', '[ ROI 분석 ]', draft.roiSummary, '',
      '[ 다음 단계 ]', draft.nextStep, '',
      draft.closing,
    ].join('\n');
  }, [draft]);

  const copy = () => {
    navigator.clipboard.writeText(proposalText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  // helpers
  const setField = (key: keyof ProposalResult, value: string) =>
    setDraft(d => d ? { ...d, [key]: value } : d);

  const setItem = (i: number, key: keyof ProposalItem, value: string) =>
    setDraft(d => {
      if (!d) return d;
      const items = d.proposalItems.map((p, idx) => idx === i ? { ...p, [key]: value } : p);
      return { ...d, proposalItems: items };
    });

  const removeItem = (i: number) =>
    setDraft(d => d ? { ...d, proposalItems: d.proposalItems.filter((_, idx) => idx !== i) } : d);

  const addItem = () =>
    setDraft(d => d ? { ...d, proposalItems: [...d.proposalItems, { item: '', reason: '', benefit: '', urgency: '보통' }] } : d);

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #C7E8E8', borderRadius: 8,
    fontSize: 13, color: '#191F28', fontFamily: 'inherit', background: 'white',
    outline: 'none',
  };
  const taStyle = { ...inputStyle, resize: 'vertical' as const, lineHeight: 1.7 };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191F28', marginBottom: 4 }}>AI 제안서 생성</h1>
        <p style={{ fontSize: 13, color: '#8B95A1' }}>실적 데이터를 기반으로 고객사 맞춤 영업 제안서를 자동 작성합니다.</p>
      </div>

      {/* 설정 */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', display: 'block', marginBottom: 6 }}>고객사 선택</label>
            {!data ? (
              <p style={{ fontSize: 13, color: '#F04452' }}>엑셀 파일을 먼저 업로드해주세요.</p>
            ) : (
              <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); setDraft(null); setEditMode(false); }}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 14, color: '#191F28', background: 'white', fontFamily: 'inherit' }}>
                <option value="">고객사를 선택하세요</option>
                {customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          {customerData && (
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: '이달 매출', value: `${Math.round(customerData.currentSales / 10000)}만원` },
                { label: '미도입 품목', value: `${customerData.missingItems.length}개`, highlight: customerData.missingItems.length > 0 },
              ].map((k, i) => (
                <div key={i} style={{ background: k.highlight ? '#FEF2F2' : '#F8F9FA', borderRadius: 10, padding: '10px 16px', border: `1px solid ${k.highlight ? '#FECACA' : '#F2F4F6'}` }}>
                  <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 3 }}>{k.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: k.highlight ? '#DC2626' : '#191F28' }}>{k.value}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={generate} disabled={!selectedCustomer || loading || !data}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8, background: '#005957', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: (!selectedCustomer || loading) ? 'not-allowed' : 'pointer', opacity: (!selectedCustomer || !data) ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            <Sparkles style={{ width: 15, height: 15 }} />
            {loading ? 'AI 작성 중...' : draft ? '다시 생성' : 'AI 제안서 생성'}
          </button>
        </div>
        {customerData && customerData.missingItems.length > 0 && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: '#D97706', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#92400E' }}>
              미도입 품목 <strong>{customerData.missingItems.slice(0, 3).join(', ')}</strong>{customerData.missingItems.length > 3 ? ` 외 ${customerData.missingItems.length - 3}개` : ''} — 제안서에 자동 포함됩니다.
            </span>
          </div>
        )}
      </div>

      {/* AI Strategy Intelligence */}
      {customerData && selectedCustomer && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: 'white', border: '1px solid #E6F2F2', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Brain style={{ width: 15, height: 15, color: '#005957' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>AI 전략 인텔리전스</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8B95A1' }}>제안서 작성 전 참고하세요</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* 추천 전략 */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: customerData.growthRate >= 0 ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${customerData.growthRate >= 0 ? '#86EFAC' : '#FDE68A'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {customerData.growthRate >= 0
                  ? <TrendingUp style={{ width: 13, height: 13, color: '#16A34A' }} />
                  : <TrendingDown style={{ width: 13, height: 13, color: '#D97706' }} />}
                <span style={{ fontSize: 12, fontWeight: 700, color: customerData.growthRate >= 0 ? '#166534' : '#92400E' }}>
                  {customerData.growthRate > 15 ? '모멘텀 극대화 전략' : customerData.growthRate >= 0 ? '안정 유지 전략' : '관계 회복 전략'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                {customerData.growthRate > 15
                  ? `성장세(+${customerData.growthRate.toFixed(0)}%) 활용 — 추가 품목 확대와 장기 파트너십 강조가 효과적입니다.`
                  : customerData.growthRate >= 0
                  ? '안정적 거래 관계를 유지하며 미도입 품목 중심으로 추가 수요를 발굴하세요.'
                  : `감소세(${customerData.growthRate.toFixed(0)}%) 대응 — 비용 절감 효과와 구체적 수치로 관계를 재점화하세요.`}
              </p>
            </div>

            {/* 핵심 어필 포인트 */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8F9FA', border: '1px solid #F2F4F6' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>핵심 어필 포인트</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  customerData.monthsActive >= 6 ? `${customerData.monthsActive}개월 장기 파트너 — 신뢰도 어필` : '신규 거래 — 온보딩 가치 강조',
                  customerData.missingItems.length > 0 ? `미도입 ${customerData.missingItems.length}개 품목 — 크로스셀 기회` : '전 품목 도입 — 볼륨 업셀 시도',
                  /렌터카|렌탈|그린카/i.test(selectedCustomer) ? '렌터카 특화 — 공급 안정성 메시지' : /화재|보험/i.test(selectedCustomer) ? '보험사 특화 — 비용 절감 KPI' : '파트너십 기반 협력 강조',
                ].map((point, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontSize: 10, color: '#005957', fontWeight: 800, marginTop: 2, flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {loading && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E6F2F2', borderTopColor: '#005957', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#8B95A1' }}>AI가 맞춤 제안서를 작성하고 있습니다...</p>
        </div>
      )}

      {draft && (
        <div className="card" style={{ padding: '24px 28px' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FileText style={{ width: 18, height: 18, color: '#005957', flexShrink: 0 }} />
                {editMode ? (
                  <input value={draft.title} onChange={e => setField('title', e.target.value)}
                    style={{ ...inputStyle, fontSize: 16, fontWeight: 700 }} />
                ) : (
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191F28' }}>{draft.title}</h2>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#8B95A1' }}>{selectedCustomer} · {customerData?.currentMonth} 기준 · AI 생성</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setEditMode(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, border: `1px solid ${editMode ? '#005957' : '#F2F4F6'}`,
                background: editMode ? '#E6F2F2' : 'white', color: editMode ? '#005957' : '#8B95A1',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                <Pencil style={{ width: 13, height: 13 }} />
                {editMode ? '수정 완료' : '수정하기'}
              </button>
              <button onClick={copy} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, border: `1px solid ${copied ? '#005957' : '#F2F4F6'}`,
                background: copied ? '#E6F2F2' : 'white', color: copied ? '#005957' : '#8B95A1',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                {copied ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
                {copied ? '복사됨' : '전체 복사'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 인사말 */}
            <Section label="인사말">
              {editMode ? (
                <textarea value={draft.greeting} rows={3} onChange={e => setField('greeting', e.target.value)} style={taStyle} />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#191F28', whiteSpace: 'pre-wrap' }}>{draft.greeting}</p>
              )}
            </Section>

            {/* 현재 성과 */}
            <Section label="현재 성과" icon={<TrendingUp style={{ width: 14, height: 14, color: '#005957' }} />}>
              {editMode ? (
                <textarea value={draft.currentAchievement} rows={4} onChange={e => setField('currentAchievement', e.target.value)} style={taStyle} />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#191F28', whiteSpace: 'pre-wrap' }}>{draft.currentAchievement}</p>
              )}
            </Section>

            {/* 제안 품목 */}
            <Section label={`추가 제안 품목 (${draft.proposalItems?.length ?? 0}개)`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(draft.proposalItems ?? []).map((p, i) => {
                  const uc = URGENCY_COLOR[p.urgency] ?? URGENCY_COLOR['보통'];
                  return (
                    <div key={i} style={{ padding: '14px 16px', background: '#F8F9FA', borderRadius: 10, border: `1px solid ${editMode ? '#C7E8E8' : '#F2F4F6'}`, position: 'relative' }}>
                      {editMode && (
                        <button onClick={() => removeItem(i)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1', padding: 2 }}>
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {editMode ? (
                          <>
                            <input value={p.item} onChange={e => setItem(i, 'item', e.target.value)}
                              placeholder="품목명" style={{ ...inputStyle, width: 'auto', flex: 1, fontWeight: 700, fontSize: 14 }} />
                            <select value={p.urgency} onChange={e => setItem(i, 'urgency', e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #C7E8E8', fontSize: 12, fontWeight: 700, color: uc.color, background: uc.bg, fontFamily: 'inherit' }}>
                              {URGENCY_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>{p.item}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: uc.bg, color: uc.color }}>긴급도 {p.urgency}</span>
                          </>
                        )}
                      </div>
                      {editMode ? (
                        <>
                          <textarea value={p.reason} rows={2} onChange={e => setItem(i, 'reason', e.target.value)}
                            placeholder="제안 이유" style={{ ...taStyle, marginBottom: 8 }} />
                          <textarea value={p.benefit} rows={2} onChange={e => setItem(i, 'benefit', e.target.value)}
                            placeholder="기대 효과" style={taStyle} />
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 4, lineHeight: 1.6 }}>{p.reason}</p>
                          <p style={{ fontSize: 13, color: '#005957', fontWeight: 600 }}>💡 {p.benefit}</p>
                        </>
                      )}
                    </div>
                  );
                })}
                {editMode && (
                  <button onClick={addItem} style={{ padding: '8px', borderRadius: 8, border: '1px dashed #C7E8E8', background: 'white', color: '#005957', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    + 품목 추가
                  </button>
                )}
              </div>
            </Section>

            {/* ROI */}
            <Section label="ROI 분석">
              {editMode ? (
                <textarea value={draft.roiSummary} rows={4} onChange={e => setField('roiSummary', e.target.value)} style={taStyle} />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#191F28', whiteSpace: 'pre-wrap' }}>{draft.roiSummary}</p>
              )}
            </Section>

            {/* 다음 단계 */}
            <Section label="다음 단계">
              {editMode ? (
                <textarea value={draft.nextStep} rows={3} onChange={e => setField('nextStep', e.target.value)} style={taStyle} />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#191F28', whiteSpace: 'pre-wrap' }}>{draft.nextStep}</p>
              )}
            </Section>

            {/* 마무리 */}
            <Section label="마무리">
              {editMode ? (
                <textarea value={draft.closing} rows={2} onChange={e => setField('closing', e.target.value)} style={taStyle} />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#191F28', whiteSpace: 'pre-wrap' }}>{draft.closing}</p>
              )}
            </Section>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F2F4F6', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => {
              if (!draft) return;
              const ctx = {
                title: draft.title,
                items: (draft.proposalItems ?? []).map((p: ProposalItem) => `${p.item}: ${p.benefit}`).join(' / '),
                nextStep: draft.nextStep,
              };
              try { sessionStorage.setItem('eficar-proposal-context', JSON.stringify(ctx)); } catch {}
              window.location.href = `/content?customer=${encodeURIComponent(selectedCustomer)}`;
            }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8,
              background: '#005957', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>
              📋 제안서 기반 콘텐츠 생성 →
            </button>
            <span style={{ fontSize: 12, color: '#8B95A1' }}>제안 품목·다음 단계가 문구에 자동 반영됩니다</span>
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      </div>
      <div style={{ paddingLeft: 4 }}>{children}</div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useDashboardData } from '@/lib/DataContext';
import { getCampaigns } from '@/lib/campaignStorage';
import { getGoal } from '@/lib/goalsStorage';
import { formatMonth } from '@/lib/dataUtils';

interface CustomerResult {
  name: string;
  riskScore: number;
  priority: '즉시행동' | '이번주' | '이번달' | '유지';
  reason: string;
  recommendedChannel: 'kakao' | 'linkedin' | 'email';
  channelReason: string;
  messageTip: string;
  bestDay: string;
}

interface CoachResult {
  customers: CustomerResult[];
  weeklyPlan: { day: string; action: string }[];
  topPriority: string;
  summary: string;
}

const PRIORITY_META = {
  '즉시행동': { color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle },
  '이번주':   { color: '#D97706', bg: '#FFFBEB', icon: Clock },
  '이번달':   { color: '#0A66C2', bg: '#EFF6FF', icon: TrendingUp },
  '유지':     { color: '#059669', bg: '#E6F2F2', icon: CheckCircle },
};

const CHANNEL_EMOJI = { kakao: '💬', linkedin: '💼', email: '📧' };
const CHANNEL_LABEL = { kakao: '카카오톡', linkedin: 'LinkedIn', email: '이메일' };

export default function AICoachPage() {
  const { data } = useDashboardData();
  const [result, setResult] = useState<CoachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const campaigns = useMemo(() => getCampaigns(), []);

  const customerStats = useMemo(() => {
    if (!data) return [];
    const latestMonth = data.latestMonth;
    const months = data.allMonths;
    const prevMonth = months[months.indexOf(latestMonth) - 1] ?? '';

    return data.customers.map(name => {
      const cur = data.records.filter(r => r.date === latestMonth && r.service === name);
      const prev = data.records.filter(r => r.date === prevMonth && r.service === name);
      const currentSales = cur.reduce((s, r) => s + r.amount, 0);
      const prevSales = prev.reduce((s, r) => s + r.amount, 0);
      const growth = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;
      const totalSales = data.records.filter(r => r.service === name).reduce((s, r) => s + r.amount, 0);
      const monthsActive = months.filter(m => data.records.some(r => r.service === name && r.date === m && r.amount > 0)).length;
      return { name, currentSales, prevSales, growth, totalSales, monthsActive, goalAmount: getGoal(name) };
    });
  }, [data]);

  async function generate() {
    if (!data) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: formatMonth(data.latestMonth),
          customers: customerStats,
          campaigns: campaigns.map(c => ({
            customer: c.customer,
            channel: c.channel,
            outcome: c.outcome,
            date: c.date,
            contentSummary: c.contentSummary,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 분석 실패');
    } finally {
      setLoading(false);
    }
  }

  if (!data) return (
    <main style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>📂</p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>먼저 데이터를 업로드하세요</h2>
        <a href="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20, textDecoration: 'none' }}>대시보드로 이동</a>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>🤖 AI 영업 코치</h1>
            <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>
              매출·캠페인 데이터 기반으로 이번 주 영업 액션 플랜을 제안합니다
            </p>
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary"
            style={{ height: 44, padding: '0 24px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><span style={{ display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />분석 중...</>
              : result
                ? <><RefreshCw style={{ width: 15, height: 15, display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />재분석</>
                : <><Sparkles style={{ width: 15, height: 15, display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />AI 분석 시작</>
            }
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* 분석 전 — 고객사 요약 카드 */}
        {!result && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
            {customerStats.map(c => (
              <div key={c.name} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{c.name}</p>
                  <span style={{ fontSize: 11, color: '#8B95A1' }}>{c.monthsActive}개월 거래</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#005957' }}>
                  {c.currentSales > 0 ? `${Math.round(c.currentSales / 10000).toLocaleString()}만원` : '-'}
                </p>
                {c.prevSales > 0 && (
                  <p style={{ fontSize: 12, color: c.growth >= 0 ? '#059669' : '#DC2626', marginTop: 3 }}>
                    {c.growth >= 0 ? '▲' : '▼'} {Math.abs(c.growth).toFixed(1)}% 전월대비
                  </p>
                )}
                <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 6 }}>
                  캠페인 {campaigns.filter(x => x.customer === c.name).length}건
                </p>
              </div>
            ))}
          </div>
        )}

        {/* AI 분석 결과 */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 종합 요약 */}
            <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #005957 0%, #007A77 100%)', color: 'white' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: 0.8, marginBottom: 8 }}>AI 종합 진단</p>
              <p style={{ fontSize: 15, lineHeight: 1.7 }}>{result.summary}</p>
              {result.topPriority && (
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>🎯 최우선: {result.topPriority}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

              {/* 고객사별 분석 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#8B95A1', letterSpacing: 0.5 }}>고객사별 액션</h3>
                {result.customers
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map(c => {
                    const pm = PRIORITY_META[c.priority] ?? PRIORITY_META['유지'];
                    const Icon = pm.icon;
                    const riskColor = c.riskScore >= 7 ? '#DC2626' : c.riskScore >= 4 ? '#D97706' : '#059669';
                    return (
                      <div key={c.name} className="card" style={{ padding: '18px 20px', borderLeft: `4px solid ${pm.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <p style={{ fontSize: 16, fontWeight: 800, color: '#191F28' }}>{c.name}</p>
                            <span style={{ padding: '3px 10px', borderRadius: 20, background: pm.bg, color: pm.color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon style={{ width: 11, height: 11 }} />{c.priority}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 10, color: '#8B95A1', marginBottom: 2 }}>위험도</p>
                            <p style={{ fontSize: 22, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{c.riskScore}<span style={{ fontSize: 11, color: '#8B95A1' }}>/10</span></p>
                          </div>
                        </div>

                        <p style={{ fontSize: 13, color: '#4A5568', marginBottom: 12 }}>{c.reason}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <div style={{ padding: '10px 12px', background: '#F8F9FA', borderRadius: 8 }}>
                            <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>추천 채널</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>
                              {CHANNEL_EMOJI[c.recommendedChannel]} {CHANNEL_LABEL[c.recommendedChannel]}
                            </p>
                            <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 2 }}>{c.channelReason}</p>
                          </div>
                          <div style={{ padding: '10px 12px', background: '#F8F9FA', borderRadius: 8 }}>
                            <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>최적 발송일</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#005957' }}>{c.bestDay}요일</p>
                            <p style={{ fontSize: 11, color: '#8B95A1', marginTop: 2 }}>과거 전환율 기준</p>
                          </div>
                        </div>

                        <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, borderLeft: '3px solid #059669' }}>
                          <p style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginBottom: 4 }}>💡 메시지 전략</p>
                          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{c.messageTip}</p>
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          <a href={`/content?customer=${encodeURIComponent(c.name)}`}
                            style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#005957', color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
                            문구 생성하기 →
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 주간 액션 플랜 */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#8B95A1', letterSpacing: 0.5, marginBottom: 12 }}>이번 주 액션 플랜</h3>
                <div className="card" style={{ padding: '4px 0' }}>
                  {result.weeklyPlan.map((item, i) => (
                    <div key={item.day} style={{
                      padding: '14px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
                      borderBottom: i < result.weeklyPlan.length - 1 ? '1px solid #F2F4F6' : 'none'
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: i === 1 ? '#005957' : '#F2F4F6',
                        color: i === 1 ? 'white' : '#8B95A1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                      }}>
                        {item.day}
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, paddingTop: 4 }}>{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #E6F2F2', borderTopColor: '#005957', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, color: '#8B95A1' }}>매출·캠페인 데이터를 분석하고 있습니다...</p>
          </div>
        )}
      </div>
    </main>
  );
}

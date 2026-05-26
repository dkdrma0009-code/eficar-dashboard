// @ts-nocheck
'use client';
import { use, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Send, FileText, Plus, ChevronRight, Brain } from 'lucide-react';
import { useDashboardData } from '@/lib/DataContext';
import { getCampaigns } from '@/lib/campaignStorage';
import { getGoal, setGoal } from '@/lib/goalsStorage';
import { categorizeProduct, GRADE_CONFIG } from '@/lib/dataUtils';
import { computeHealthScore, computePredictiveAlerts } from '@/lib/intelligenceEngine';
import { getProfile } from '@/lib/relationshipStorage';
import { getMemory } from '@/lib/aiMemoryStorage';
import { getActivities } from '@/lib/activityStorage';
import QuickGenerateDrawer from '@/components/QuickGenerateDrawer';
import type { CampaignRecord } from '@/lib/campaignStorage';
import type { ActivityItem } from '@/lib/activityStorage';
import type { CustomerStats, CustomerGrade } from '@/lib/types';

function HealthRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2F4F6" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={size < 40 ? 9 : 11} fontWeight={800} fill="#191F28">{score}</text>
    </svg>
  );
}

const SLUG_MATCH: Record<string, (n: string) => boolean> = {
  sk:    (n) => /sk/i.test(n),
  lotte: (n) => /롯데|그린카/i.test(n),
};

const OUTCOME_LABEL: Record<string, string> = {
  sent: '발송', responded: '반응', meeting: '미팅', proposal: '제안', closed: '완료',
};
const OUTCOME_COLOR: Record<string, string> = {
  sent: '#8B95A1', responded: '#3B82F6', meeting: '#F59E0B', proposal: '#8B5CF6', closed: '#005957',
};
const CHANNEL_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn', kakao: '카카오톡', email: '이메일', cardnews: '카드뉴스', etc: '기타',
};

function fmt(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(0)}천만`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

function fmtAxis(n: number) {
  if (n === 0) return '0';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억`;
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(0)}천`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toString();
}

function getPrevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: slug } = use(params);
  const router = useRouter();
  const { data } = useDashboardData();

  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [goal, setGoalState] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [drawer, setDrawer] = useState<'message' | 'proposal' | null>(null);
  const [relProfile, setRelProfile] = useState<ReturnType<typeof getProfile>>(null);
  const [aiMemory, setAiMemory] = useState<ReturnType<typeof getMemory>>(null);

  const matcher = SLUG_MATCH[slug];

  const customerName = useMemo(() => {
    if (!data || !matcher) return '';
    return data.customers.find(c => matcher(c)) ?? '';
  }, [data, matcher]);

  useEffect(() => {
    if (!customerName) return;
    const all = getCampaigns();
    setCampaigns(all.filter(c => c.customer === customerName));
    const g = getGoal(customerName);
    setGoalState(g);
    setGoalInput(g > 0 ? String(Math.round(g / 10000)) : '');
    setActivities(getActivities().filter(a => a.customer === customerName));
    setRelProfile(getProfile(customerName));
    setAiMemory(getMemory(customerName));
  }, [customerName]);

  const monthlyStats = useMemo(() => {
    if (!data || !customerName) return [];
    return data.allMonths.map(month => {
      const recs = data.records.filter(r => r.date === month && r.service === customerName);
      return { month, sales: recs.reduce((s, r) => s + r.amount, 0), count: recs.length };
    });
  }, [data, customerName]);

  const latestMonth = data?.latestMonth ?? '';
  const currentMonth = data?.currentMonth ?? '';

  const currentStats = useMemo(() => {
    const cur = monthlyStats.find(m => m.month === currentMonth);
    const prev = monthlyStats.find(m => m.month === getPrevMonth(currentMonth));
    const cs = cur?.sales ?? 0;
    const ps = prev?.sales ?? 0;
    const growth = ps === 0 ? (cs > 0 ? 100 : 0) : ((cs - ps) / ps) * 100;
    const total = data?.records.filter(r => r.service === customerName).reduce((s, r) => s + r.amount, 0) ?? 0;
    const monthsActive = monthlyStats.filter(m => m.sales > 0).length;
    return { cs, ps, growth, total, monthsActive };
  }, [monthlyStats, currentMonth, data, customerName]);

  const productBreakdown = useMemo(() => {
    if (!data || !customerName) return [];
    const recs = data.records.filter(r => r.date === currentMonth && r.service === customerName);
    const map = new Map<string, number>();
    recs.forEach(r => {
      const cat = categorizeProduct(r.itemName);
      map.set(cat, (map.get(cat) ?? 0) + r.amount);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [data, customerName, currentMonth]);

  const totalProductSales = productBreakdown.reduce((s, p) => s + p.value, 0);

  const campaignStats = useMemo(() => {
    const total = campaigns.length;
    const responded = campaigns.filter(c => ['responded', 'meeting', 'proposal', 'closed'].includes(c.outcome)).length;
    const meeting = campaigns.filter(c => ['meeting', 'proposal', 'closed'].includes(c.outcome)).length;
    const closed = campaigns.filter(c => c.outcome === 'closed').length;
    return { total, responded, meeting, closed, rate: total > 0 ? Math.round((meeting / total) * 100) : 0 };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const list = campaignFilter === 'all' ? campaigns : campaigns.filter(c => c.outcome === campaignFilter);
    return showAllCampaigns ? list : list.slice(0, 6);
  }, [campaigns, campaignFilter, showAllCampaigns]);

  const goalPct = goal > 0 ? Math.min(Math.round((currentStats.cs / goal) * 100), 999) : 0;

  const gradeKey = currentStats.cs === 0 ? 'danger'
    : currentStats.cs >= 50_000_000 || currentStats.growth >= 20 ? 'vip'
    : currentStats.growth <= -60 ? 'danger'
    : currentStats.growth <= -30 ? 'warning'
    : currentStats.ps === 0 && currentStats.cs > 0 ? 'new'
    : 'normal';
  const grade = GRADE_CONFIG[gradeKey];

  const customerStatObj = useMemo((): CustomerStats => ({
    name: customerName,
    grade: gradeKey as CustomerGrade,
    currentMonthSales: currentStats.cs,
    prevMonthSales: currentStats.ps,
    growthRate: currentStats.growth,
    totalSales: currentStats.total,
    transactionCount: campaigns.length,
  }), [customerName, gradeKey, currentStats, campaigns]);

  const health = useMemo(() =>
    customerName ? computeHealthScore(customerStatObj, activities, campaigns) : null,
    [customerStatObj, activities, campaigns],
  );

  const customerAlert = useMemo(() =>
    customerName ? (computePredictiveAlerts([customerStatObj], activities)[0] ?? null) : null,
    [customerStatObj, activities],
  );

  const saveGoal = () => {
    const v = parseInt(goalInput.replace(/,/g, ''), 10);
    const amount = isNaN(v) ? 0 : v * 10000;
    setGoal(customerName, amount);
    setGoalState(amount);
    setEditingGoal(false);
  };

  if (!matcher) {
    return (
      <main style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#8B95A1' }}>지원하지 않는 고객사입니다.</p>
        <Link href="/" style={{ color: '#005957', fontSize: 14 }}>← 대시보드로</Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>📂</p>
        <p style={{ color: '#8B95A1', marginBottom: 16 }}>엑셀 파일을 먼저 업로드해주세요.</p>
        <Link href="/" style={{ color: '#005957', fontSize: 14 }}>← 대시보드로</Link>
      </main>
    );
  }

  if (!customerName) {
    return (
      <main style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#8B95A1' }}>해당 고객사 데이터가 없습니다.</p>
        <Link href="/" style={{ color: '#005957', fontSize: 14 }}>← 대시보드로</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px' }}>
      <button onClick={() => router.back()} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        cursor: 'pointer', color: '#8B95A1', fontSize: 13, marginBottom: 20, padding: 0,
      }}>
        <ArrowLeft style={{ width: 15, height: 15 }} /> 뒤로
      </button>

      {/* 헤더 */}
      <div className="card" style={{ marginBottom: 20, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191F28' }}>{customerName}</h1>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: grade.bg, color: grade.color }}>
                {grade.label}
              </span>
              {latestMonth === currentMonth && (
                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#FFFBEB', color: '#B45309' }}>진행중</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#8B95A1' }}>{currentMonth} 기준 · {currentStats.monthsActive}개월 거래</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href={`/content?customer=${encodeURIComponent(customerName)}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 8, background: '#005957', color: 'white',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              <FileText style={{ width: 14, height: 14 }} /> 콘텐츠 생성
            </Link>
            <Link href={`/campaigns?customer=${encodeURIComponent(customerName)}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 8, border: '1px solid #E6F2F2', background: 'white', color: '#005957',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              <Plus style={{ width: 14, height: 14 }} /> 캠페인 등록
            </Link>
          </div>
        </div>

        {/* KPI 3개 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
          {[
            {
              label: `${currentMonth} 매출`,
              value: `${fmt(currentStats.cs)}원`,
              sub: currentStats.ps > 0 ? `전월 ${fmt(currentStats.ps)}원` : '전월 데이터 없음',
            },
            {
              label: '전월 대비',
              value: currentStats.ps > 0 ? `${currentStats.growth > 0 ? '+' : ''}${currentStats.growth.toFixed(1)}%` : '-',
              sub: currentStats.growth > 0 ? '성장' : currentStats.growth < 0 ? '감소' : '변화없음',
              showIcon: true,
            },
            {
              label: '누적 공급액',
              value: `${fmt(currentStats.total)}원`,
              sub: `${currentStats.monthsActive}개월 합산`,
            },
          ].map((k, i) => (
            <div key={i} style={{ background: '#F8F9FA', borderRadius: 12, padding: '16px 18px', border: '1px solid #F2F4F6' }}>
              <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 6 }}>{k.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#191F28' }}>{k.value}</p>
                {k.showIcon && currentStats.ps > 0 && (
                  currentStats.growth >= 0
                    ? <TrendingUp style={{ width: 18, height: 18, color: '#005957' }} />
                    : <TrendingDown style={{ width: 18, height: 18, color: '#F04452' }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 4 }}>{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Intelligence Panel */}
      {health && (
        <div className="card" style={{ marginBottom: 20, padding: '20px 24px', border: '1px solid #E6F2F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Brain style={{ width: 16, height: 16, color: '#005957' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>AI Intelligence</span>
            <span style={{ fontSize: 11, color: '#8B95A1', marginLeft: 'auto' }}>관계 분석 · 건강도 · 액션 추천</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Health Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <HealthRing score={health.score} color={health.score >= 70 ? '#005957' : health.score >= 45 ? '#F59E0B' : '#F04452'} size={64} />
              <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600 }}>건강도</span>
            </div>

            {/* Health Factors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 2 }}>점수 구성</p>
              {health.factors.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#191F28' }}>{f.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: f.contribution >= 70 ? '#005957' : f.contribution >= 40 ? '#F59E0B' : '#F04452' }}>{f.contribution}pt</span>
                  </div>
                  <div style={{ height: 4, background: '#F2F4F6', borderRadius: 4 }}>
                    <div style={{ width: `${f.contribution}%`, height: '100%', background: f.contribution >= 70 ? '#005957' : f.contribution >= 40 ? '#F59E0B' : '#F04452', borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Alert + Actions + Relationship */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {customerAlert && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: customerAlert.severity === 'high' ? '#FEF2F2' : customerAlert.severity === 'medium' ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${customerAlert.severity === 'high' ? '#FCA5A5' : customerAlert.severity === 'medium' ? '#FDE68A' : '#86EFAC'}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: customerAlert.severity === 'high' ? '#DC2626' : customerAlert.severity === 'medium' ? '#B45309' : '#16A34A', marginBottom: 3 }}>
                    {customerAlert.severity === 'high' ? '⚠️' : customerAlert.severity === 'medium' ? '📊' : '✅'} {customerAlert.type === 'churn_risk' ? '이탈 위험' : customerAlert.type === 'growth_opportunity' ? '성장 기회' : '참여 감소'}
                  </p>
                  <p style={{ fontSize: 11, color: '#8B95A1' }}>{customerAlert.signals[0] ?? customerAlert.recommendation}</p>
                </div>
              )}

              {relProfile && relProfile.keywords.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 6 }}>선호 키워드</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {relProfile.keywords.slice(0, 4).map((kw, i) => (
                      <span key={i} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#E6F2F2', color: '#005957', fontWeight: 600 }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {aiMemory && aiMemory.lastSummary && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8F9FA', border: '1px solid #F2F4F6' }}>
                  <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>AI 메모리</p>
                  <p style={{ fontSize: 12, color: '#191F28' }}>{aiMemory.lastSummary}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setDrawer('message')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#005957', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Send style={{ width: 12, height: 12 }} /> 메시지 생성
                </button>
                <button onClick={() => setDrawer('proposal')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'white', color: '#005957', border: '1px solid #E6F2F2', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <FileText style={{ width: 12, height: 12 }} /> 제안서 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2열: 월별 추이 + 품목 구성 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>
            월별 매출 추이
            <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 400, marginLeft: 8 }}>이달 강조</span>
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
              <XAxis dataKey="month" tickFormatter={m => m.slice(5)} tick={{ fontSize: 11, fill: '#8B95A1' }} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#8B95A1' }} width={48} />
              <Tooltip
                formatter={(v: number) => [`${fmt(v)}원`, '매출']}
                labelFormatter={l => `${l}`}
                contentStyle={{ borderRadius: 8, border: '1px solid #F2F4F6', fontSize: 12 }}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {monthlyStats.map((m, i) => (
                  <Cell key={i} fill={m.month === currentMonth ? '#005957' : '#C7E8E8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28', marginBottom: 14 }}>{currentMonth} 품목 구성</p>
          {productBreakdown.length === 0 ? (
            <p style={{ fontSize: 13, color: '#8B95A1', textAlign: 'center', paddingTop: 40 }}>이달 실적 없음</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {productBreakdown.map((p, i) => {
                const pct = totalProductSales > 0 ? (p.value / totalProductSales) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#191F28' }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: '#8B95A1' }}>{fmt(p.value)}원 ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#F2F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: i === 0 ? '#005957' : '#00B386', borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 목표 + 캠페인 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target style={{ width: 15, height: 15, color: '#005957' }} /> 이달 목표
            </p>
            <button onClick={() => setEditingGoal(!editingGoal)} style={{ fontSize: 12, color: '#005957', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {editingGoal ? '취소' : '수정'}
            </button>
          </div>
          {editingGoal ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                placeholder="목표 금액 (만원)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E6F2F2', fontSize: 13, fontFamily: 'inherit' }}
              />
              <button onClick={saveGoal} style={{ padding: '8px 16px', borderRadius: 8, background: '#005957', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>저장</button>
            </div>
          ) : goal > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: goalPct >= 100 ? '#005957' : '#191F28' }}>{goalPct}%</span>
                <span style={{ fontSize: 13, color: '#8B95A1' }}>목표 {fmt(goal)}원</span>
              </div>
              <div style={{ height: 10, background: '#F2F4F6', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  width: `${Math.min(goalPct, 100)}%`, height: '100%', borderRadius: 6,
                  background: goalPct >= 100 ? '#005957' : goalPct >= 70 ? '#00B386' : goalPct >= 40 ? '#F59E0B' : '#F04452',
                  transition: 'width 0.6s',
                }} />
              </div>
              <p style={{ fontSize: 12, color: '#8B95A1' }}>달성 {fmt(currentStats.cs)}원 · 잔여 {fmt(Math.max(0, goal - currentStats.cs))}원</p>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 16, paddingBottom: 8 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12 }}>목표가 설정되지 않았습니다.</p>
              <button onClick={() => setEditingGoal(true)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px dashed #C7E8E8', background: 'white', color: '#005957', fontSize: 13, cursor: 'pointer' }}>
                + 목표 설정
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send style={{ width: 15, height: 15, color: '#005957' }} /> 캠페인 요약
            </p>
            <Link href={`/campaigns?customer=${encodeURIComponent(customerName)}`} style={{ fontSize: 12, color: '#005957', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              전체 보기 <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '총 발송', value: campaignStats.total, color: '#8B95A1' },
              { label: '미팅 전환', value: campaignStats.meeting, color: '#F59E0B' },
              { label: '반응', value: campaignStats.responded, color: '#3B82F6' },
              { label: '계약 완료', value: campaignStats.closed, color: '#005957' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '12px 14px', border: '1px solid #F2F4F6' }}>
                <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
          {campaignStats.total > 0 && (
            <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 12, textAlign: 'center' }}>
              미팅 전환율 <strong style={{ color: '#191F28' }}>{campaignStats.rate}%</strong>
            </p>
          )}
        </div>
      </div>

      {/* 캠페인 히스토리 */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>캠페인 히스토리</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'sent', 'responded', 'meeting', 'proposal', 'closed'].map(f => (
              <button key={f} onClick={() => { setCampaignFilter(f); setShowAllCampaigns(false); }} style={{
                padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: campaignFilter === f ? '#005957' : '#F2F4F6',
                color: campaignFilter === f ? 'white' : '#8B95A1',
              }}>
                {f === 'all' ? '전체' : OUTCOME_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8B95A1', fontSize: 13 }}>
            {campaigns.length === 0 ? '등록된 캠페인이 없습니다.' : '해당 필터의 캠페인이 없습니다.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredCampaigns.map((c, i) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '12px 0',
                borderBottom: i < filteredCampaigns.length - 1 ? '1px solid #F2F4F6' : 'none',
              }}>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: OUTCOME_COLOR[c.outcome] }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#8B95A1' }}>{c.date}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#F2F4F6', color: '#8B95A1' }}>
                      {CHANNEL_LABEL[c.channel] ?? c.channel}
                    </span>
                    <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: `${OUTCOME_COLOR[c.outcome]}22`, color: OUTCOME_COLOR[c.outcome] }}>
                      {OUTCOME_LABEL[c.outcome] ?? c.outcome}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#191F28', marginBottom: c.note ? 4 : 0 }}>{c.contentSummary || '(내용 없음)'}</p>
                  {c.note && <p style={{ fontSize: 12, color: '#8B95A1' }}>{c.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {campaigns.length > 6 && (
          <button onClick={() => setShowAllCampaigns(v => !v)} style={{
            width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 8,
            border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 13, cursor: 'pointer',
          }}>
            {showAllCampaigns ? '접기' : `전체 ${campaigns.length}건 보기`}
          </button>
        )}
      </div>

      {drawer && (
        <QuickGenerateDrawer
          customer={customerName}
          action={drawer}
          growthRate={currentStats.growth}
          onClose={() => setDrawer(null)}
          onGenerated={() => setActivities(getActivities().filter(a => a.customer === customerName))}
        />
      )}
    </main>
  );
}

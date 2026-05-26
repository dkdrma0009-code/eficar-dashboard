// @ts-nocheck
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcelFile } from '@/lib/parseExcel';
import { buildDashboardData, computeViewData, formatCurrency, formatPercent, formatMonth } from '@/lib/dataUtils';
import { useDashboardData } from '@/lib/DataContext';
import { getCampaigns } from '@/lib/campaignStorage';
import { getActivities, fetchActivitiesFromDB, ActivityItem } from '@/lib/activityStorage';
import { getMemory } from '@/lib/aiMemoryStorage';
import { computeStrategicInsights, computePriorityRankings } from '@/lib/intelligenceEngine';
import { syncAutoTasks, generateSignals } from '@/lib/autonomousOpsStorage';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import QuickGenerateDrawer from '@/components/QuickGenerateDrawer';
import type { DashboardData } from '@/lib/types';
import {
  Upload, AlertTriangle, TrendingUp, Sparkles, BarChart2,
  Clock, Zap, ChevronRight, Send, LayoutDashboard, Bot, Search, Brain, Cpu,
} from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────────
type DrawerCtx = { customer: string; action: 'message' | 'proposal'; growthRate: number; initialContent?: string } | null;
type ActionButton = {
  label: string; href: string; primary?: boolean;
  drawer?: { action: 'message' | 'proposal'; customer: string; growthRate: number };
};
type SuggestedAction = {
  id: string; urgency: 'high' | 'medium' | 'low';
  icon: typeof AlertTriangle; iconColor: string; iconBg: string;
  title: string; desc: string; reason: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
  buttons: ActionButton[];
};
type TodayTask = { id: string; priority: 'high' | 'medium' | 'low'; text: string; href: string; cta: string };

// ── 헬퍼 ─────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

const ACTIVITY_EMOJI: Record<string, string> = {
  message: '💬', proposal: '📋', report: '📊', cardnews: '🃏',
};

// ── 업로드 화면 ──────────────────────────────────────────────
function UploadScreen({ onFile, onSample, loading, error }: {
  onFile: (f: File) => void;
  onSample: () => void;
  loading: boolean;
  error: string | null;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ marginBottom: 44 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #005957 0%, #007A77 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px', boxShadow: '0 8px 28px rgba(0,89,87,0.28)',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 30, lineHeight: 1 }}>∞</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#191F28', marginBottom: 10, letterSpacing: '-0.4px' }}>
            AI Studio에 오신 걸 환영합니다
          </h1>
          <p style={{ fontSize: 14, color: '#8B95A1', lineHeight: 1.7 }}>
            매출 데이터를 업로드하면 AI가<br />즉시 인사이트와 실행 계획을 제안합니다
          </p>
        </div>

        <label
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            display: 'block', padding: '40px 32px',
            background: 'white', borderRadius: 16,
            border: '2px dashed #E2E8F0', cursor: 'pointer',
            marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <input
            type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            disabled={loading}
          />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #E6F2F2', borderTopColor: '#005957', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 14, color: '#8B95A1', fontWeight: 500 }}>데이터 분석 중...</p>
            </div>
          ) : (
            <>
              <Upload style={{ width: 32, height: 32, color: '#CBD5E0', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28', marginBottom: 5 }}>엑셀 파일 업로드</p>
              <p style={{ fontSize: 13, color: '#8B95A1' }}>클릭하거나 파일을 드래그하세요</p>
              <p style={{ fontSize: 11, color: '#B0B8C1', marginTop: 6 }}>.xlsx, .xls 지원</p>
            </>
          )}
        </label>

        {error && (
          <div style={{ padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626', marginBottom: 12, textAlign: 'left' }}>
            {error}
          </div>
        )}
        <button
          onClick={onSample} disabled={loading}
          style={{ fontSize: 13, color: '#8B95A1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', opacity: loading ? 0.5 : 1 }}
        >
          샘플 데이터로 미리보기
        </button>
      </div>
    </div>
  );
}

// ── AI Studio 메인 ────────────────────────────────────────────
function AIStudio({ data }: { data: DashboardData }) {
  const router = useRouter();

  // ── 데이터 계산 ──
  const viewData = useMemo(() =>
    computeViewData(data.records, data.currentMonth, data.customers, data.latestMonth),
    [data],
  );
  const recentCampaigns = useMemo(() => getCampaigns().slice(0, 5), []);

  // ── 거래 완전 중단 감지 (0원 & 전달 거래 있었음) ─────────────────────────────
  const dormantCustomers = useMemo(() => {
    const monthIdx  = data.allMonths.indexOf(data.currentMonth);
    const prevMonth = monthIdx > 0 ? data.allMonths[monthIdx - 1] : '';
    return data.customers
      .map(name => {
        const currentSales = data.records
          .filter(r => r.service === name && r.date === data.currentMonth)
          .reduce((s, r) => s + r.amount, 0);
        const prevSales = prevMonth
          ? data.records.filter(r => r.service === name && r.date === prevMonth).reduce((s, r) => s + r.amount, 0)
          : 0;
        // Find last active month for "months dormant" label
        const lastActiveMonth = [...data.allMonths].reverse().find(m =>
          m !== data.currentMonth && data.records.some(r => r.service === name && r.date === m && r.amount > 0)
        ) ?? null;
        return { name, currentSales, prevSales, lastActiveMonth };
      })
      .filter(c => c.currentSales === 0 && c.prevSales > 0);
  }, [data]);

  const priorityCustomers = useMemo(() =>
    viewData.customerStats
      .filter(c => c.growthRate < -20 || c.grade === 'danger' || c.grade === 'warning')
      .sort((a, b) => a.growthRate - b.growthRate)
      .slice(0, 4),
    [viewData],
  );

  const growingCustomers = useMemo(() =>
    viewData.customerStats
      .filter(c => c.growthRate > 20 && c.prevMonthSales > 0)
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 2),
    [viewData],
  );

  // ── 상태 ──
  const [drawerCtx, setDrawerCtx] = useState<DrawerCtx>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdFocused, setCmdFocused] = useState(false);
  const [briefVisible, setBriefVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('eficar-brief-dismissed') !== '1';
  });
  const [opsTaskCount, setOpsTaskCount] = useState(0);
  const [opsSignalCount, setOpsSignalCount] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  const STATUS_MSGS = ['고객 관계 분석 중', '위험 신호 감지 중', '우선순위 재계산 중', '캠페인 성과 학습 중', '팔로업 타이밍 계산 중'];

  useEffect(() => {
    // Seed cache from localStorage immediately, then hydrate from Supabase
    setActivities(getActivities());
    fetchActivitiesFromDB().then(setActivities).catch(() => {});
  }, []);

  useEffect(() => {
    const tasks = syncAutoTasks(viewData.customerStats, activities);
    setOpsTaskCount(tasks.filter(t => t.status === 'prepared').length);
    const sigs = generateSignals(viewData.customerStats, activities);
    setOpsSignalCount(sigs.length);
  }, [viewData.customerStats, activities]);

  useEffect(() => {
    const t = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MSGS.length), 3500);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissBrief = useCallback(() => {
    setBriefVisible(false);
    sessionStorage.setItem('eficar-brief-dismissed', '1');
  }, []);

  // ── Daily Brief ──
  const dailyBrief = useMemo(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '수고 많으셨어요';
    const bullets: string[] = [];
    if (priorityCustomers.length > 0)
      bullets.push(`⚠️ ${priorityCustomers[0].name} 등 ${priorityCustomers.length}곳이 감소세입니다`);
    if (growingCustomers.length > 0)
      bullets.push(`📈 ${growingCustomers[0].name}이 ${formatPercent(growingCustomers[0].growthRate)} 성장 중입니다`);
    bullets.push(`📅 ${formatMonth(data.currentMonth)} 월간 보고서가 준비되어 있습니다`);
    const recommend = priorityCustomers.length > 0
      ? `${priorityCustomers[0].name} 유지 메시지부터 시작해보세요.`
      : growingCustomers.length > 0
      ? `${growingCustomers[0].name} 확장 제안서 작성을 추천합니다.`
      : '이번 달 보고서를 작성해보세요.';
    return { greeting, bullets, recommend };
  }, [priorityCustomers, growingCustomers, data]);

  // ── Auto Suggestions ──
  const autoSuggestions = useMemo((): string[] => {
    const s: string[] = [];
    priorityCustomers.slice(0, 2).forEach(c => s.push(`${c.name} 팔로업 메시지 생성`));
    if (growingCustomers.length > 0) s.push(`${growingCustomers[0].name} 업셀링 제안서 작성`);
    s.push(`${formatMonth(data.currentMonth)} 월간 보고서 작성`);
    return s.slice(0, 3);
  }, [priorityCustomers, growingCustomers, data]);

  // ── Smart Templates ──
  const smartTemplates = useMemo(() => {
    return data.customers.slice(0, 6).map(name => {
      const mem = getMemory(name);
      const stat = viewData.customerStats.find(cs => cs.name === name);
      return { name, tone: mem?.lastTone, count: mem?.generationCount ?? 0, growthRate: stat?.growthRate ?? 0 };
    }).filter(t => t.count > 0);
  }, [data.customers, viewData.customerStats]);

  // ── Customer Timelines ──
  const customerTimelines = useMemo(() => {
    return priorityCustomers.slice(0, 2).map(c => {
      const cActivities = activities.filter(a => a.customer === c.name);
      const steps: { icon: string; label: string; time?: string; done: boolean; drawer?: { action: 'message' | 'proposal'; customer: string; growthRate: number } }[] = [
        { icon: '⚠️', label: `${formatPercent(c.growthRate)} 감소 감지`, done: true },
      ];
      cActivities.forEach(a => {
        steps.push({ icon: ACTIVITY_EMOJI[a.type] ?? '✨', label: a.description, time: a.createdAt, done: true });
      });
      const hasMessage = cActivities.some(a => a.type === 'message');
      const hasProposal = cActivities.some(a => a.type === 'proposal');
      if (!hasMessage) steps.push({ icon: '💬', label: '유지 메시지 생성 추천', done: false, drawer: { action: 'message', customer: c.name, growthRate: c.growthRate } });
      else if (!hasProposal) steps.push({ icon: '📋', label: '제안서 생성 추천', done: false, drawer: { action: 'proposal', customer: c.name, growthRate: c.growthRate } });
      return { customer: c, steps };
    });
  }, [priorityCustomers, activities]);

  const handleGenerated = useCallback((item: ActivityItem) => {
    setActivities(prev => [item, ...prev].slice(0, 20));
  }, []);

  // ── Command Bar 처리 (Intent 기반) ──
  const handleCommand = useCallback((q: string) => {
    const lower = q.toLowerCase().trim();
    if (!lower) return;
    setCmdQuery('');

    // 최근 작업 열기
    if ((lower.includes('최근') || lower.includes('마지막')) && (lower.includes('열어') || lower.includes('보여') || lower.includes('다시'))) {
      const last = activities[0];
      if (last?.content && last.customer) {
        const stat = viewData.customerStats.find(cs => cs.name === last.customer);
        setDrawerCtx({ customer: last.customer, action: last.type as 'message' | 'proposal', growthRate: stat?.growthRate ?? 0, initialContent: last.content });
      }
      return;
    }

    // 가장 위험한 고객
    if (lower.includes('가장') && (lower.includes('위험') || lower.includes('심각'))) {
      if (priorityCustomers.length > 0) {
        const c = priorityCustomers[0];
        setDrawerCtx({ customer: c.name, action: 'message', growthRate: c.growthRate });
      }
      return;
    }

    // 위험 고객 목록 보기
    if (lower.includes('위험') || lower.includes('리스크')) {
      document.getElementById('suggested-actions')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 고객사 이름 + 액션 매칭 (먼저 시도)
    const matchedCustomer = data.customers.find(c =>
      lower.includes(c.toLowerCase().slice(0, 3)) || lower.includes(c.toLowerCase().slice(0, 4))
    );
    if (matchedCustomer) {
      const stat = viewData.customerStats.find(cs => cs.name === matchedCustomer);
      const isProposal = lower.includes('제안서') || lower.includes('제안');
      setDrawerCtx({ customer: matchedCustomer, action: isProposal ? 'proposal' : 'message', growthRate: stat?.growthRate ?? 0 });
      return;
    }

    // 일반 액션 매칭
    if (lower.includes('메시지') || lower.includes('팔로업')) {
      if (priorityCustomers.length > 0) {
        const c = priorityCustomers[0];
        setDrawerCtx({ customer: c.name, action: 'message', growthRate: c.growthRate });
      } else { router.push('/content'); }
    } else if (lower.includes('제안서')) {
      if (priorityCustomers.length > 0) {
        const c = priorityCustomers[0];
        setDrawerCtx({ customer: c.name, action: 'proposal', growthRate: c.growthRate });
      } else { router.push('/proposal'); }
    } else if (lower.includes('리포트') || lower.includes('보고서')) {
      router.push('/report');
    } else if (lower.includes('캠페인')) {
      router.push('/campaigns');
    } else if (lower.includes('비교')) {
      router.push('/compare');
    } else {
      router.push('/ai-coach');
    }
  }, [priorityCustomers, data.customers, viewData.customerStats, activities, router]);

  // ── Today Focus ──
  const todayTasks = useMemo((): TodayTask[] => {
    const tasks: TodayTask[] = [];
    if (priorityCustomers.length > 0) {
      tasks.push({
        id: 'risk', priority: 'high',
        text: `위험 고객 ${priorityCustomers.length}곳 즉시 대응`,
        href: `/content?customer=${encodeURIComponent(priorityCustomers[0].name)}`,
        cta: '바로 실행',
      });
    }
    if (priorityCustomers.length > 0) {
      tasks.push({
        id: 'proposal', priority: 'medium',
        text: `${priorityCustomers[0].name} AI 제안서 생성`,
        href: '/proposal', cta: '만들기',
      });
    } else if (growingCustomers.length > 0) {
      tasks.push({
        id: 'growth-msg', priority: 'medium',
        text: `${growingCustomers[0].name} 성과 공유 메시지`,
        href: `/content?customer=${encodeURIComponent(growingCustomers[0].name)}`,
        cta: '생성',
      });
    }
    tasks.push({
      id: 'report', priority: tasks.length === 0 ? 'medium' : 'low',
      text: `${formatMonth(data.currentMonth)} 월간 보고서 작성`,
      href: '/report', cta: '이동',
    });
    if (recentCampaigns.length === 0) {
      tasks.push({ id: 'campaign', priority: 'low', text: '첫 캠페인 메시지 등록', href: '/campaigns', cta: '등록' });
    }
    return tasks.slice(0, 4);
  }, [priorityCustomers, growingCustomers, data, recentCampaigns]);

  // ── AI Suggested Actions ──
  const suggestedActions = useMemo((): SuggestedAction[] => {
    const actions: SuggestedAction[] = [];

    // 거래 완전 중단 고객을 최우선으로
    dormantCustomers.slice(0, 2).forEach(c => {
      const dormantStat = viewData.customerStats.find(s => s.name === c.name);
      actions.push({
        id: `dormant-${c.name}`,
        urgency: 'high',
        icon: AlertTriangle,
        iconColor: '#DC2626',
        iconBg: '#FEF2F2',
        title: `${c.name} — 거래 완전 중단`,
        desc: `이번 달 거래 실적 없음 — 전달 대비 완전 이탈 상태`,
        reason: `이번 달 매출 0원. 전달 ${(c.prevSales / 10000).toFixed(0)}만원에서 거래가 완전 중단됨 — 관계 회복 즉시 대응 필요`,
        confidence: 'high',
        confidenceReason: '이번달 거래 0건 확인 — 이탈 가능성 높음',
        buttons: [
          { label: '💬 재활성화 메시지', href: `/content?customer=${encodeURIComponent(c.name)}`, primary: true, drawer: { action: 'message', customer: c.name, growthRate: -100 } },
          { label: '📋 관계 회복 제안서', href: '/proposal', drawer: { action: 'proposal', customer: c.name, growthRate: -100 } },
          { label: `📊 ${c.name} 상세`, href: '/dashboard' },
        ],
      });
      void dormantStat;
    });

    priorityCustomers.slice(0, Math.max(0, 2 - dormantCustomers.length)).forEach(c => {
      const abs = Math.abs(Math.round(c.growthRate));
      const reason = c.grade === 'danger' && c.growthRate < -30
        ? `매출 ${abs}% 급감 — 거래 중단 위험 수준 도달`
        : c.grade === 'danger'
        ? `거래 중단 위험 수준 — 즉각 대응 필요`
        : `최근 매출 ${abs}% 감소 — 연속 하락 추세`;

      actions.push({
        id: `risk-${c.name}`,
        urgency: c.grade === 'danger' ? 'high' : 'medium',
        icon: AlertTriangle,
        iconColor: c.grade === 'danger' ? '#DC2626' : '#D97706',
        iconBg: c.grade === 'danger' ? '#FEF2F2' : '#FFFBEB',
        title: `${c.name} 감소세 감지`,
        desc: `성장률 ${formatPercent(c.growthRate)} — 즉시 팔로업이 필요합니다`,
        reason,
        confidence: c.grade === 'danger' ? 'high' : 'medium',
        confidenceReason: c.grade === 'danger' ? '연속 하락 + 거래 중단 위험 패턴 감지' : '최근 2개월 하락 트렌드 기반',
        buttons: [
          { label: '💬 유지 메시지', href: `/content?customer=${encodeURIComponent(c.name)}`, primary: true, drawer: { action: 'message', customer: c.name, growthRate: c.growthRate } },
          { label: '📋 제안서', href: '/proposal', drawer: { action: 'proposal', customer: c.name, growthRate: c.growthRate } },
          { label: '📊 리포트', href: '/report' },
        ],
      });
    });

    if (growingCustomers.length > 0) {
      const c = growingCustomers[0];
      actions.push({
        id: `growth-${c.name}`,
        urgency: 'medium',
        icon: TrendingUp, iconColor: '#059669', iconBg: '#F0FDF4',
        title: `${c.name} 확장 기회 발견`,
        desc: `성장률 ${formatPercent(c.growthRate)} — 업셀링 최적 타이밍입니다`,
        reason: `지속 성장세 감지 — 신규 품목 확장 가능성 발견`,
        confidence: 'high',
        confidenceReason: '3개월 연속 성장 패턴 + 거래량 증가 기반',
        buttons: [
          { label: '💬 성과 메시지', href: `/content?customer=${encodeURIComponent(c.name)}`, primary: true, drawer: { action: 'message', customer: c.name, growthRate: c.growthRate } },
          { label: '📋 확장 제안서', href: '/proposal', drawer: { action: 'proposal', customer: c.name, growthRate: c.growthRate } },
        ],
      });
    }

    actions.push({
      id: 'report',
      urgency: 'low',
      icon: BarChart2, iconColor: '#005957', iconBg: '#E6F2F2',
      title: `${formatMonth(data.currentMonth)} 월간 보고서`,
      desc: '이달 성과를 AI가 자동 정리해 Notion에 저장합니다',
      reason: `${formatMonth(data.currentMonth)} 성과 집계 완료 — 보고서 작성 권장`,
      confidence: 'low',
      confidenceReason: '이달 데이터 집계 완료 — 정기 보고 주기',
      buttons: [
        { label: '📊 보고서 생성', href: '/report', primary: true },
      ],
    });

    return actions.slice(0, 4);
  }, [priorityCustomers, growingCustomers, data]);

  // ── AI Assistant 메시지 ──
  const assistantMessage = useMemo(() => {
    if (priorityCustomers.length >= 2) {
      return `${priorityCustomers[0].name}과 ${priorityCustomers[1].name} 두 곳이 감소세입니다. 지금 바로 팔로업 메시지를 보내보세요.`;
    }
    if (priorityCustomers.length === 1) {
      return `${priorityCustomers[0].name}이 감소세입니다. 빠른 대응이 고객 유지에 결정적입니다.`;
    }
    if (growingCustomers.length > 0) {
      return `${growingCustomers[0].name}이 강한 성장세입니다. 지금이 업셀링 제안의 최적 타이밍이에요.`;
    }
    return `${formatMonth(data.currentMonth)} 데이터를 분석했습니다. 아래 추천 액션을 확인해보세요.`;
  }, [priorityCustomers, growingCustomers, data]);

  const assistantActions = useMemo(() => {
    if (priorityCustomers.length > 0) return [
      { label: '유지 메시지 생성', href: `/content?customer=${encodeURIComponent(priorityCustomers[0].name)}`, drawer: { action: 'message' as const, customer: priorityCustomers[0].name, growthRate: priorityCustomers[0].growthRate } },
      { label: '월간 리포트 작성', href: '/report' },
    ];
    if (growingCustomers.length > 0) return [
      { label: '성과 공유 메시지', href: `/content?customer=${encodeURIComponent(growingCustomers[0].name)}`, drawer: { action: 'message' as const, customer: growingCustomers[0].name, growthRate: growingCustomers[0].growthRate } },
      { label: '확장 제안서 생성', href: '/proposal' },
    ];
    return [
      { label: '월간 보고서 작성', href: '/report' },
      { label: 'AI 제안서 생성', href: '/proposal' },
    ];
  }, [priorityCustomers, growingCustomers]);

  // ── Command Bar 제안 칩 ──
  const cmdChips = useMemo(() => {
    const chips: string[] = [];
    if (priorityCustomers.length > 0) chips.push(`${priorityCustomers[0].name} 유지 메시지`);
    if (priorityCustomers.length > 1) chips.push('위험 고객 모두 보기');
    chips.push('이번 달 리포트 작성');
    if (growingCustomers.length > 0) chips.push(`${growingCustomers[0].name} 성과 공유`);
    return chips.slice(0, 4);
  }, [priorityCustomers, growingCustomers]);

  // ── 스타일 헬퍼 ──
  const urgencyStyle = (u: 'high' | 'medium' | 'low') => {
    if (u === 'high')   return { label: '즉시 대응', color: '#DC2626', bg: '#FEE2E2' };
    if (u === 'medium') return { label: '이번 주',   color: '#D97706', bg: '#FEF3C7' };
    return                     { label: '이번 달',   color: '#3B82F6', bg: '#DBEAFE' };
  };
  const priorityDot = (p: 'high' | 'medium' | 'low') =>
    p === 'high' ? '#DC2626' : p === 'medium' ? '#D97706' : '#94A3B8';

  // ── Quick Generate Bar 항목 ──
  const quickGenItems = [
    { label: '💬 메시지', href: '/content' },
    { label: '📋 제안서', href: '/proposal' },
    { label: '📊 보고서', href: '/report' },
    { label: '🃏 카드뉴스', href: '/cardnews' },
    { label: '🤖 AI 코치', href: '/ai-coach' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>

      {/* ── 헤더 ── */}
      <div style={{
        background: 'white', borderBottom: '1px solid #F2F4F6',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '16px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Zap style={{ width: 16, height: 16, color: '#005957' }} />
              <h1 style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>AI Studio</h1>
            </div>
            <p style={{ fontSize: 12, color: '#8B95A1' }}>
              {formatMonth(data.currentMonth)} 기준 · {data.customers.length}개 고객사
              {priorityCustomers.length > 0 && (
                <span style={{ color: '#DC2626', fontWeight: 700 }}> · ⚠️ {priorityCustomers.length}건 위험</span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard')} className="btn-outline" style={{ height: 34, fontSize: 12 }}>
              <LayoutDashboard style={{ width: 13, height: 13 }} /> 상세 분석
            </button>
            <button onClick={() => router.push('/proposal')} className="btn-primary" style={{ height: 34, fontSize: 12 }}>
              <Sparkles style={{ width: 13, height: 13 }} /> AI 제안서
            </button>
          </div>
        </div>
        {/* Quick Generate Bar */}
        <div style={{ padding: '10px 28px 14px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, borderTop: '1px solid #F8F9FA' }}>
          <span style={{ fontSize: 11, color: '#B0B8C1', fontWeight: 700, flexShrink: 0, letterSpacing: '0.3px' }}>바로 만들기</span>
          {quickGenItems.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{ padding: '5px 13px', borderRadius: 100, border: '1px solid #E8ECEF', background: 'white', color: '#4A5568', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 콘텐츠 영역 ── */}
      <div style={{ padding: '20px 28px' }}>

        {/* ─ Daily Brief ─ */}
        {briefVisible && (
          <div className="animate-slide-down" style={{
            marginBottom: 16, background: 'linear-gradient(135deg, #005957 0%, #007A77 100%)',
            borderRadius: 14, padding: '16px 20px', color: 'white',
            boxShadow: '0 4px 18px rgba(0,89,87,0.25)', position: 'relative',
          }}>
            <button
              onClick={dismissBrief}
              style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🤖</span>
              <p style={{ fontSize: 14, fontWeight: 800 }}>AI 브리핑 — {dailyBrief.greeting}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {dailyBrief.bullets.map((b, i) => (
                <p key={i} style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5 }}>{b}</p>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, opacity: 0.75 }}>추천: {dailyBrief.recommend}</p>
              {priorityCustomers.length > 0 && (
                <button
                  onClick={() => { dismissBrief(); setDrawerCtx({ customer: priorityCustomers[0].name, action: 'message', growthRate: priorityCustomers[0].growthRate }); }}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'white', color: '#005957', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                >
                  오늘 시작하기 →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─ Intelligence Entry Point ─ */}
        {(() => {
          const campaigns = getCampaigns();
          const insights = computeStrategicInsights(viewData.customerStats, activities);
          const topPriority = computePriorityRankings(viewData.customerStats, activities, campaigns)[0];
          return (
            <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'stretch' }}>
              {/* 인사이트 미리보기 */}
              <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
                {insights.slice(0, 2).map((ins, i) => {
                  const colors = {
                    warning:     { border: '#FCA5A5', bg: '#FEF9F9', text: '#DC2626' },
                    opportunity: { border: '#6EE7B7', bg: '#F0FDF9', text: '#059669' },
                    tip:         { border: '#93C5FD', bg: '#F0F7FF', text: '#2563EB' },
                  }[ins.type] ?? { border: '#E2E8F0', bg: 'white', text: '#6B7280' };
                  return (
                    <div
                      key={i}
                      onClick={() => router.push('/intelligence')}
                      style={{ flex: 1, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, padding: '10px 14px', cursor: 'pointer', minWidth: 0 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{ins.icon}</span>
                        <p style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{ins.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Intelligence 바로가기 */}
              <button
                onClick={() => router.push('/intelligence')}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #E8ECEF', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}
              >
                <Brain style={{ width: 18, height: 18, color: '#7C3AED' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>Intelligence</span>
                {topPriority && (
                  <span style={{ fontSize: 9, color: '#B0B8C1' }}>{topPriority.customerName} ↑</span>
                )}
              </button>
            </div>
          );
        })()}

        {/* ─ Command Bar ─ */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            background: 'white', borderRadius: 14,
            border: `1.5px solid ${cmdFocused ? '#005957' : '#E8ECEF'}`,
            boxShadow: cmdFocused ? '0 0 0 3px rgba(0,89,87,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}>
            <Search style={{ width: 16, height: 16, color: '#B0B8C1', flexShrink: 0 }} />
            <input
              value={cmdQuery}
              onChange={e => setCmdQuery(e.target.value)}
              onFocus={() => setCmdFocused(true)}
              onBlur={() => setCmdFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter') handleCommand(cmdQuery); }}
              placeholder="무엇을 도와드릴까요? (예: 삼성화재 메시지 생성해줘, 이번 달 리포트)"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#191F28', background: 'transparent', padding: '14px 0' }}
            />
            {cmdQuery && (
              <button
                onClick={() => handleCommand(cmdQuery)}
                style={{ padding: '6px 14px', borderRadius: 8, background: '#005957', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                실행
              </button>
            )}
          </div>
          {/* 제안 칩 */}
          <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
            {cmdChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleCommand(chip)}
                style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid #E8ECEF', background: 'white', color: '#4A5568', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ─ 2컬럼 그리드 ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ── 좌측 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 1. Today Focus */}
            <div className="animate-slide-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityCustomers.length > 0 ? '#DC2626' : '#059669' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>오늘 할 일</h2>
                <span style={{ fontSize: 11, color: '#B0B8C1' }}>· {todayTasks.length}건</span>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {todayTasks.map((task, i) => (
                  <div
                    key={task.id}
                    style={{ padding: '12px 18px', borderBottom: i < todayTasks.length - 1 ? '1px solid #F8F9FA' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityDot(task.priority), flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#191F28' }}>{task.text}</span>
                    <button
                      onClick={() => router.push(task.href)}
                      style={{
                        padding: '5px 11px', borderRadius: 7, flexShrink: 0,
                        border: task.priority === 'high' ? 'none' : '1px solid #E8ECEF',
                        background: task.priority === 'high' ? '#005957' : 'white',
                        color: task.priority === 'high' ? 'white' : '#4A5568',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {task.cta} →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Quick KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: '이달 총 매출', value: formatCurrency(viewData.totalCurrentSales), sub: formatPercent(viewData.growthRate) + ' 전월비', ok: viewData.growthRate >= 0 },
                { label: '거래건수', value: viewData.transactionCount.toLocaleString() + '건', sub: `${viewData.activeCustomers}개 활성`, ok: true },
                { label: '위험 고객', value: priorityCustomers.length + '곳', sub: priorityCustomers.length > 0 ? '즉시 대응 필요' : '이상 없음', ok: priorityCustomers.length === 0 },
                { label: '최근 캠페인', value: recentCampaigns.length + '건', sub: recentCampaigns[0]?.date ?? '없음', ok: true },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 5 }}>{s.label}</p>
                  <p style={{ fontSize: 21, fontWeight: 800, color: '#191F28', marginBottom: 3 }}>{s.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: s.ok ? '#059669' : '#DC2626' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* 3. AI Suggested Actions */}
            <div className="animate-slide-up" id="suggested-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles style={{ width: 15, height: 15, color: '#005957' }} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>AI 추천 액션</h2>
                <span style={{ fontSize: 11, color: '#B0B8C1' }}>· 우선순위 순</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestedActions.map(action => {
                  const Icon = action.icon;
                  const us = urgencyStyle(action.urgency);
                  return (
                    <div key={action.id} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${action.iconColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: action.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 19, height: 19, color: action.iconColor }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: us.color, background: us.bg, padding: '2px 8px', borderRadius: 100 }}>{us.label}</span>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>{action.title}</p>
                          </div>
                          <p style={{ fontSize: 12, color: '#8B95A1', lineHeight: 1.5 }}>{action.desc}</p>
                          {/* 추천 이유 + 신뢰도 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: '#B0B8C1', fontWeight: 600 }}>이유</span>
                            <span style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>{action.reason}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100, flexShrink: 0,
                              background: action.confidence === 'high' ? '#DCFCE7' : action.confidence === 'medium' ? '#FEF3C7' : '#F3F4F6',
                              color: action.confidence === 'high' ? '#16A34A' : action.confidence === 'medium' ? '#D97706' : '#6B7280',
                            }} title={action.confidenceReason}>
                              {action.confidence === 'high' ? '신뢰도 높음' : action.confidence === 'medium' ? '신뢰도 보통' : '참고용'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        {action.buttons.map(btn => (
                          <button
                            key={btn.label}
                            onClick={() => btn.drawer ? setDrawerCtx(btn.drawer) : router.push(btn.href)}
                            style={{
                              padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                              ...(btn.primary
                                ? { background: '#005957', color: 'white', border: 'none', boxShadow: '0 2px 6px rgba(0,89,87,0.2)' }
                                : { background: 'white', color: '#4A5568', border: '1px solid #E8ECEF' }
                              ),
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. AI Timeline Intelligence */}
            {customerTimelines.length > 0 && (
              <div className="animate-slide-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Clock style={{ width: 14, height: 14, color: '#8B95A1' }} />
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>AI 타임라인</h2>
                  <span style={{ fontSize: 11, color: '#B0B8C1' }}>· 고객사 대응 흐름</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {customerTimelines.map(({ customer: c, steps }) => (
                    <div key={c.name} className="card" style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.grade === 'danger' ? '#DC2626' : '#D97706' }} />
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#191F28' }}>{c.name}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.growthRate < 0 ? '#DC2626' : '#059669' }}>{formatPercent(c.growthRate)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {steps.map((step, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: si < steps.length - 1 ? 12 : 0, position: 'relative' }}>
                            {/* 연결선 */}
                            {si < steps.length - 1 && (
                              <div style={{ position: 'absolute', left: 11, top: 22, width: 2, height: 'calc(100% - 10px)', background: step.done ? '#E2E8F0' : '#F8F9FA' }} />
                            )}
                            {/* 아이콘 노드 */}
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                              background: step.done ? '#F2F4F6' : '#E6F2F2',
                              border: step.done ? '2px solid #E2E8F0' : '2px solid #005957',
                            }}>
                              {step.icon}
                            </div>
                            <div style={{ flex: 1, paddingTop: 2 }}>
                              <p style={{ fontSize: 12, fontWeight: step.done ? 500 : 700, color: step.done ? '#8B95A1' : '#191F28', lineHeight: 1.4 }}>
                                {step.label}
                              </p>
                              {step.time && (
                                <p style={{ fontSize: 10, color: '#B0B8C1' }}>{timeAgo(step.time)}</p>
                              )}
                            </div>
                            {/* 미완료 단계 실행 버튼 */}
                            {!step.done && step.drawer && (
                              <button
                                onClick={() => setDrawerCtx(step.drawer!)}
                                style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#005957', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                              >
                                실행 →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. 성장 고객 */}
            {growingCustomers.length > 0 && (
              <div className="animate-slide-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp style={{ width: 15, height: 15, color: '#059669' }} />
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>성장 중인 고객 — 지금 공략하세요</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {growingCustomers.map(c => (
                    <div key={c.name} className="card" style={{ padding: '16px 18px', borderLeft: '3px solid #059669', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#191F28', marginBottom: 3 }}>{c.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                          <TrendingUp style={{ width: 12, height: 12 }} />
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{formatPercent(c.growthRate)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDrawerCtx({ customer: c.name, action: 'message', growthRate: c.growthRate })}
                        style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#F0FDF4', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        성과 메시지 →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. 최근 캠페인 */}
            {recentCampaigns.length > 0 && (
              <div className="animate-slide-up">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Send style={{ width: 14, height: 14, color: '#8B95A1' }} />
                    <h2 style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>최근 캠페인</h2>
                  </div>
                  <button
                    onClick={() => router.push('/campaigns')}
                    style={{ fontSize: 12, color: '#005957', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    전체보기 →
                  </button>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {recentCampaigns.map((c, i) => {
                    const outcomeMap: Record<string, string> = { sent: '발송', responded: '반응', meeting: '미팅', proposal: '제안', closed: '완료' };
                    return (
                      <div key={c.id} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < recentCampaigns.length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                        <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, minWidth: 52 }}>{c.date.slice(5)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>{c.customer}</p>
                          {c.contentSummary && (
                            <p style={{ fontSize: 11, color: '#8B95A1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.contentSummary}</p>
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#F2F4F6', color: '#4A5568', flexShrink: 0 }}>
                          {outcomeMap[c.outcome] ?? c.outcome}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── 우측 ── */}
          <div style={{ position: 'sticky', top: 120, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI 어시스턴트 패널 */}
            <div className="card animate-fade-in" style={{ padding: '18px', background: 'linear-gradient(160deg, #F0FBF9 0%, #ffffff 60%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: 'linear-gradient(135deg, #005957 0%, #007A77 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,89,87,0.25)',
                }}>
                  <Bot style={{ width: 15, height: 15, color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#191F28' }}>AI 어시스턴트</p>
                  <p style={{ fontSize: 10, color: '#8B95A1' }}>데이터 기반 실시간 분석</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
                  <span style={{ fontSize: 9, color: '#8B95A1', fontWeight: 500 }}>{STATUS_MSGS[statusIdx]}</span>
                </div>
              </div>
              {/* 말풍선 */}
              <div style={{ background: '#EBF5F4', borderRadius: '0 12px 12px 12px', padding: '12px 14px', marginBottom: 12, border: '1px solid #C7E3E2' }}>
                <p style={{ fontSize: 13, color: '#1A3332', lineHeight: 1.7, fontWeight: 500 }}>{assistantMessage}</p>
              </div>
              {/* AI 자동 제안 */}
              {autoSuggestions.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#B0B8C1', marginBottom: 6, letterSpacing: '0.6px' }}>AI가 먼저 제안해요</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {autoSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleCommand(s)}
                        style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: '1px solid #C7E3E2', background: 'white', color: '#005957', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        ✦ {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* 추천 */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#B0B8C1', marginBottom: 8, letterSpacing: '0.6px', textTransform: 'uppercase' }}>추천 액션</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                {assistantActions.map((a, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => 'drawer' in a && a.drawer ? setDrawerCtx(a.drawer) : router.push(a.href)}
                  >
                    <ChevronRight style={{ width: 13, height: 13, color: '#005957', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#4A5568', fontWeight: 600 }}>{a.label}</span>
                    {'drawer' in a && a.drawer && (
                      <span style={{ fontSize: 10, color: '#B0B8C1', marginLeft: 'auto' }}>즉시 생성</span>
                    )}
                  </div>
                ))}
              </div>
              {/* 실행 버튼 */}
              <div style={{ display: 'flex', gap: 7 }}>
                {assistantActions.slice(0, 2).map((a, i) => (
                  <button
                    key={i}
                    onClick={() => 'drawer' in a && a.drawer ? setDrawerCtx(a.drawer) : router.push(a.href)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                      fontSize: 11, fontWeight: 700,
                      ...(i === 0
                        ? { background: '#005957', color: 'white', border: 'none' }
                        : { background: 'white', color: '#005957', border: '1px solid #C7E3E2' }
                      ),
                    }}
                  >
                    {a.label.replace(/ 생성$| 작성$/, '')}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Operations Center 카드 */}
            <div
              className="card"
              onClick={() => router.push('/operations')}
              style={{ padding: '14px 18px', cursor: 'pointer', background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', border: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Cpu style={{ width: 14, height: 14, color: 'white' }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>AI Operations Center</p>
                {opsTaskCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: '#F59E0B', color: 'white', padding: '1px 7px', borderRadius: 100, marginLeft: 'auto' }}>{opsTaskCount}건 대기</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{opsTaskCount}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>준비된 초안</p>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{opsSignalCount}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>감지된 신호</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>운영 중</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Activity Feed */}
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1' }}>AI 활동 피드</p>
                  {activities.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
                      <span style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>활성</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: '#B0B8C1' }}>{activities.length}건</span>
              </div>
              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: 12, color: '#B0B8C1', lineHeight: 1.7 }}>
                    아직 활동이 없습니다<br />
                    <span style={{ fontSize: 11 }}>AI 추천 액션을 실행해보세요</span>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activities.slice(0, 6).map((item, i) => {
                    const customerStat = viewData.customerStats.find(cs => cs.name === item.customer);
                    const typeColors: Record<string, { bg: string; color: string }> = {
                      message:  { bg: '#E6F2F2', color: '#005957' },
                      proposal: { bg: '#EEF2FF', color: '#4F46E5' },
                      report:   { bg: '#FEF3C7', color: '#D97706' },
                      cardnews: { bg: '#F3F4F6', color: '#6B7280' },
                    };
                    const tc = typeColors[item.type] ?? typeColors.message;
                    return (
                      <div
                        key={item.id}
                        style={{ paddingTop: i > 0 ? 10 : 0, paddingBottom: i < Math.min(activities.length, 6) - 1 ? 10 : 0, borderBottom: i < Math.min(activities.length, 6) - 1 ? '1px solid #F8F9FA' : 'none' }}
                      >
                        {/* 타입 배지 + 시간 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, padding: '1px 7px', borderRadius: 100 }}>
                            {ACTIVITY_EMOJI[item.type]} {item.type === 'message' ? '메시지' : item.type === 'proposal' ? '제안서' : item.type === 'report' ? '리포트' : '카드뉴스'}
                          </span>
                          <span style={{ fontSize: 10, color: '#B0B8C1', marginLeft: 'auto' }}>{timeAgo(item.createdAt)}</span>
                        </div>
                        {/* 설명 */}
                        <p style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description}
                        </p>
                        {/* 액션 버튼 */}
                        <div style={{ display: 'flex', gap: 5 }}>
                          {item.content && item.customer && (item.type === 'message' || item.type === 'proposal') && (
                            <button
                              onClick={() => setDrawerCtx({ customer: item.customer!, action: item.type as 'message' | 'proposal', growthRate: customerStat?.growthRate ?? 0, initialContent: item.content })}
                              style={{ padding: '3px 9px', borderRadius: 6, border: '1px solid #E8ECEF', background: 'white', color: '#005957', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                            >
                              다시 보기
                            </button>
                          )}
                          <button
                            onClick={() => router.push(item.href)}
                            style={{ padding: '3px 9px', borderRadius: 6, border: '1px solid #E8ECEF', background: 'white', color: '#4A5568', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                          >
                            이어하기 →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Templates */}
            {smartTemplates.length > 0 && (
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Sparkles style={{ width: 12, height: 12, color: '#005957' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1' }}>스마트 템플릿</p>
                  <span style={{ fontSize: 10, color: '#B0B8C1', marginLeft: 'auto' }}>메모리 기반</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {smartTemplates.map(t => (
                    <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                        {t.tone && <p style={{ fontSize: 10, color: '#8B95A1' }}>{t.tone} 톤 · {t.count}회 생성</p>}
                      </div>
                      <button
                        onClick={() => setDrawerCtx({ customer: t.name, action: 'message', growthRate: t.growthRate })}
                        style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E8ECEF', background: 'white', color: '#005957', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                      >
                        재사용 →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI 인사이트 */}
            <AIInsightsPanel data={data} trendMap={viewData.trendMap} />

            {/* 고객사 성과 순위 */}
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1' }}>고객사 성과 순위</p>
                <button onClick={() => router.push('/dashboard')} style={{ fontSize: 11, color: '#005957', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  상세 →
                </button>
              </div>
              {viewData.customerStats.slice(0, 5).map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 4 ? 10 : 0 }}>
                  <span style={{ fontSize: 11, color: '#B0B8C1', minWidth: 14, fontWeight: 700, textAlign: 'center' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.growthRate >= 0 ? '#059669' : '#DC2626', flexShrink: 0 }}>
                    {formatPercent(c.growthRate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Generate Drawer ── */}
      {drawerCtx && (
        <QuickGenerateDrawer
          customer={drawerCtx.customer}
          action={drawerCtx.action}
          growthRate={drawerCtx.growthRate}
          initialContent={drawerCtx.initialContent}
          onClose={() => setDrawerCtx(null)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  );
}

// ─── 페이지 엔트리 ─────────────────────────────────────────────
export default function Home() {
  const { data, setData, setFileName } = useDashboardData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    try {
      const records = await parseExcelFile(file);
      if (records.length === 0) throw new Error('데이터를 찾을 수 없습니다. 컬럼명을 확인해주세요.');
      setData(buildDashboardData(records));
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.');
    } finally { setLoading(false); }
  }, [setData, setFileName]);

  const loadSample = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/sample-data.xlsx');
      if (!res.ok) throw new Error('샘플 파일을 불러올 수 없습니다');
      const blob = await res.blob();
      const records = await parseExcelFile(new File([blob], 'sample-data.xlsx', { type: blob.type }));
      setData(buildDashboardData(records));
      setFileName('sample-data.xlsx (샘플)');
    } catch (err) {
      setError(err instanceof Error ? err.message : '샘플 데이터 로드 실패');
    } finally { setLoading(false); }
  }, [setData, setFileName]);

  if (!data) return <UploadScreen onFile={handleFile} onSample={loadSample} loading={loading} error={error} />;
  return <AIStudio data={data} />;
}

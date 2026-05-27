'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/lib/DataContext';
import { computeViewData, formatCurrency, formatPercent } from '@/lib/dataUtils';
import { addCampaign } from '@/lib/campaignStorage';
import type { CustomerStats } from '@/lib/types';
import type { TargetingInput } from '@/app/api/targeting-message/route';

type Channel = 'kakao' | 'email' | 'linkedin';

interface GeneratedMessages {
  kakao?: string;
  email?: { subject: string; body: string };
  linkedin?: string;
}

const GRADE_CONFIG = {
  vip:     { label: 'VIP',  bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200', dot: 'bg-yellow-400' },
  normal:  { label: '일반', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-400'   },
  warning: { label: '주의', bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400' },
  danger:  { label: '위험', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    dot: 'bg-red-400'    },
  new:     { label: '신규', bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  dot: 'bg-green-400'  },
} as const;

const CHANNEL_CONFIG = {
  kakao:    { label: '카카오톡', icon: '💬', color: 'bg-yellow-400 hover:bg-yellow-500', active: 'bg-yellow-400' },
  email:    { label: '이메일',   icon: '📧', color: 'bg-blue-500 hover:bg-blue-600',     active: 'bg-blue-500'   },
  linkedin: { label: 'LinkedIn', icon: '💼', color: 'bg-[#0A66C2] hover:bg-[#0952a5]',  active: 'bg-[#0A66C2]'  },
} as const;

function GradeBadge({ grade }: { grade: string }) {
  const cfg = GRADE_CONFIG[grade as keyof typeof GRADE_CONFIG] ?? GRADE_CONFIG.normal;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CopyButton({ text, channel, customer }: { text: string; channel: string; customer: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (customer) {
        addCampaign({
          date: new Date().toISOString().slice(0, 10),
          customer,
          channel: channel as 'kakao' | 'email' | 'linkedin' | 'etc',
          contentSummary: `타겟 메시지 — ${channel}`,
          outcome: 'sent',
          note: '',
        });
      }
    });
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors"
    >
      {copied ? '✓ 복사됨' : '복사'}
    </button>
  );
}

export default function TargetingPage() {
  const { data: dashboardData } = useDashboardData();
  const router = useRouter();
  const [selected, setSelected] = useState<CustomerStats | null>(null);
  const [manualName, setManualName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [activeChannel, setActiveChannel] = useState<Channel>('kakao');
  const [messages, setMessages] = useState<GeneratedMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const customers = useMemo<CustomerStats[]>(() => {
    if (!dashboardData || !Array.isArray(dashboardData.records)) return [];
    const view = computeViewData(dashboardData.records, dashboardData.latestMonth, dashboardData.customers, dashboardData.latestMonth);
    return view.customerStats.sort((a, b) => b.currentMonthSales - a.currentMonthSales);
  }, [dashboardData]);

  const filteredCustomers = useMemo(() =>
    customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [customers, searchQuery],
  );

  async function generate() {
    const name = selected?.name ?? manualName.trim();
    if (!name) { setError('고객사를 선택하거나 이름을 입력해주세요.'); return; }

    setLoading(true);
    setError('');
    setMessages(null);

    const input: TargetingInput = {
      customerName: name,
      grade: selected?.grade ?? 'normal',
      currentSales: selected?.currentMonthSales ?? 0,
      prevSales: selected?.prevMonthSales ?? 0,
      growthRate: selected?.growthRate ?? 0,
      totalSales: selected?.totalSales ?? 0,
      transactionCount: selected?.transactionCount ?? 0,
      additionalContext: additionalContext.trim() || undefined,
    };

    try {
      const res = await fetch('/api/targeting-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? '생성 실패'); return; }
      setMessages(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const targetName = selected?.name ?? manualName.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#005957] flex items-center justify-center">
            <span className="text-white font-black text-base">🎯</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">타겟 메시지 생성</h1>
            <p className="text-xs text-gray-500 mt-0.5">고객사 데이터 기반 맞춤 메시지</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Left: Customer selector */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Customer list from dashboard */}
          {customers.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-2">고객사 선택</p>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="고객사 검색..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957]"
                />
              </div>
              <div className="overflow-y-auto max-h-72">
                {filteredCustomers.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { setSelected(c); setMessages(null); }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selected?.name === c.name ? 'bg-[#E6F2F2] border-l-2 border-l-[#005957]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">{c.name}</span>
                      <GradeBadge grade={c.grade} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{formatCurrency(c.currentMonthSales)}</span>
                      <span className={`text-xs font-semibold ${c.growthRate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatPercent(c.growthRate)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-3">대시보드 데이터 없음 — 고객사명 직접 입력</p>
              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="예: SK렌터카"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957]"
              />
            </div>
          )}

          {/* Additional context */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              추가 맥락 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="예: 이번 달 헤드램프 신규 제안 예정, 최근 납기 지연 이슈 있었음"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] resize-none"
            />
          </div>

          {/* Selected customer stats */}
          {selected && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">{selected.name}</p>
                <GradeBadge grade={selected.grade} />
              </div>
              <div className="space-y-2">
                {[
                  { label: '이번달 매출', value: formatCurrency(selected.currentMonthSales) },
                  { label: '전월 대비',   value: formatPercent(selected.growthRate), color: selected.growthRate >= 0 ? 'text-green-600' : 'text-red-500' },
                  { label: '누적 거래액', value: formatCurrency(selected.totalSales) },
                  { label: '거래건수',    value: `${selected.transactionCount}건` },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-xs font-bold ${color ?? 'text-gray-800'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !targetName}
            className="w-full bg-[#005957] text-white rounded-xl py-3.5 font-bold text-sm hover:bg-[#004745] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                생성 중...
              </>
            ) : (
              `${targetName || '고객사'} 메시지 생성`
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Right: Messages */}
        <div className="flex-1 min-w-0">
          {!messages && !loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-4">🎯</div>
                <p className="text-sm font-semibold">고객사를 선택하고 메시지를 생성하세요</p>
                <p className="text-xs mt-1">카카오톡 / 이메일 / LinkedIn 3종 동시 생성</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#005957] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600 font-semibold">{targetName} 맞춤 메시지 생성 중...</p>
                <p className="text-xs text-gray-400 mt-1">카카오톡 · 이메일 · LinkedIn 3종</p>
              </div>
            </div>
          )}

          {messages && (
            <div className="space-y-4">
              {/* Channel tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-2">
                {(Object.keys(CHANNEL_CONFIG) as Channel[]).map(ch => {
                  const cfg = CHANNEL_CONFIG[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() => setActiveChannel(ch)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                        activeChannel === ch ? `${cfg.color} text-white` : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Kakao */}
              {activeChannel === 'kakao' && messages.kakao && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <span className="font-bold text-gray-800">카카오톡 메시지</span>
                    </div>
                    <CopyButton text={messages.kakao} channel="kakao" customer={targetName} />
                  </div>
                  <div className="bg-[#FEE500]/10 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {messages.kakao}
                  </div>
                </div>
              )}

              {/* Email */}
              {activeChannel === 'email' && messages.email && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📧</span>
                      <span className="font-bold text-gray-800">이메일</span>
                    </div>
                    <CopyButton text={`제목: ${messages.email.subject}\n\n${messages.email.body}`} channel="email" customer={targetName} />
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 mb-1">제목</div>
                    <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800">
                      {messages.email.subject}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">본문</div>
                    <div className="bg-blue-50/50 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {messages.email.body}
                    </div>
                  </div>
                </div>
              )}

              {/* LinkedIn */}
              {activeChannel === 'linkedin' && messages.linkedin && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💼</span>
                      <span className="font-bold text-gray-800">LinkedIn 포스트</span>
                    </div>
                    <CopyButton text={messages.linkedin} channel="linkedin" customer={targetName} />
                  </div>
                  <div className="bg-[#0A66C2]/5 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {messages.linkedin}
                  </div>
                </div>
              )}

              {/* Regenerate + 콘텐츠 생성기 이동 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={generate}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-[#005957] hover:text-[#005957] transition-colors font-semibold"
                >
                  다시 생성
                </button>
                {targetName && (
                  <button
                    onClick={() => router.push(`/content?customer=${encodeURIComponent(targetName)}`)}
                    style={{ padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: '#005957', color: 'white', whiteSpace: 'nowrap' }}
                  >
                    📤 SMS · 카카오 발송하기
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

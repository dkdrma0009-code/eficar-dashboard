'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSendLogs, type SendLog } from '@/lib/sendLogStorage';
import { downloadExcel } from '@/lib/exportExcel';
import {
  BarChart2, Mail, MessageSquare, Image, Phone, Filter, Download,
  TrendingUp, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

const CHANNEL_LABELS: Record<string, string> = {
  sms: 'SMS', lms: 'LMS', mms: 'MMS', kakao: '카카오', email: '이메일',
};

const CHANNEL_COLORS: Record<string, string> = {
  sms:   '#3B82F6',
  lms:   '#8B5CF6',
  mms:   '#EC4899',
  kakao: '#F59E0B',
  email: '#10B981',
};

const STATUS_CONFIG = {
  sent:    { label: '발송완료', bg: '#F1F5F9', color: '#64748B' },
  opened:  { label: '열람',     bg: '#EFF6FF', color: '#2563EB' },
  clicked: { label: '클릭',     bg: '#F0FDF4', color: '#16A34A' },
};

function ChannelIcon({ ch }: { ch: string }) {
  const color = CHANNEL_COLORS[ch] ?? '#8B95A1';
  const s = { width: 13, height: 13, color };
  if (ch === 'email')  return <Mail style={s} />;
  if (ch === 'kakao')  return <MessageSquare style={s} />;
  if (ch === 'mms')    return <Image style={s} />;
  return <Phone style={s} />;
}

function fmt(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function toDateStr(iso: string) {
  return iso.slice(0, 10);
}

export default function HistoryPage() {
  const [logs, setLogs]           = useState<SendLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [channelFilter, setChannelFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);
  const [showCharts, setShowCharts] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ updated: number; matched: number } | null>(null);
  const PER_PAGE = 20;

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const data = await getSendLogs(undefined, 500);
    setLogs(data);
    if (!silent) setLoading(false);
    else setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const customers = useMemo(() => {
    const s = new Set(logs.map(l => l.customer).filter(Boolean));
    return Array.from(s).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
      if (customerFilter !== 'all' && l.customer !== customerFilter) return false;
      if (dateFrom && l.sent_at < dateFrom) return false;
      if (dateTo && l.sent_at.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [logs, channelFilter, customerFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => {
    const total = filtered.length;
    const opened = filtered.filter(l => l.open_at).length;
    const clicked = filtered.filter(l => l.click_at).length;
    return {
      total, opened, clicked,
      openRate: total ? (opened / total * 100).toFixed(1) : '0',
      clickRate: total ? (clicked / total * 100).toFixed(1) : '0',
    };
  }, [filtered]);

  // 채널별 발송 수
  const channelChartData = useMemo(() => {
    const m: Record<string, { sends: number; opens: number }> = {};
    filtered.forEach(l => {
      const ch = CHANNEL_LABELS[l.channel] ?? l.channel;
      if (!m[ch]) m[ch] = { sends: 0, opens: 0 };
      m[ch].sends++;
      if (l.open_at) m[ch].opens++;
    });
    return Object.entries(m)
      .map(([channel, v]) => ({ channel, ...v }))
      .sort((a, b) => b.sends - a.sends);
  }, [filtered]);

  // 일별 발송 트렌드 (최근 30일)
  const trendData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    const cutStr = cutoff.toISOString().slice(0, 10);

    const m: Record<string, { sends: number; opens: number }> = {};
    filtered.filter(l => l.sent_at >= cutStr).forEach(l => {
      const d = toDateStr(l.sent_at);
      if (!m[d]) m[d] = { sends: 0, opens: 0 };
      m[d].sends++;
      if (l.open_at) m[d].opens++;
    });

    // 최근 30일 전체 날짜 채우기
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      result.push({ date: key, label, sends: m[key]?.sends ?? 0, opens: m[key]?.opens ?? 0 });
    }
    return result;
  }, [filtered]);

  const hasTrendData = trendData.some(t => t.sends > 0);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#8B95A1', fontSize: 14 }}>
      발송 이력 불러오는 중...
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <BarChart2 style={{ width: 20, height: 20, color: '#005957' }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2332', margin: 0 }}>발송 이력</h1>
          </div>
          <p style={{ fontSize: 13, color: '#8B95A1', margin: 0 }}>SMS·LMS·MMS·카카오 발송 기록 및 열람/클릭 추적</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {checkResult && (
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, background: '#F0FDF4', padding: '4px 10px', borderRadius: 8, border: '1px solid #BBF7D0' }}>
              ✅ {checkResult.matched}건 확인 · {checkResult.updated}건 업데이트
            </span>
          )}
          <button
            onClick={async () => {
              setChecking(true);
              setCheckResult(null);
              try {
                const res = await fetch('/api/popbill/receipt-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 7 }) });
                const json = await res.json();
                if (res.ok) { setCheckResult({ matched: json.matched, updated: json.updated }); await load(true); }
              } finally { setChecking(false); }
            }}
            disabled={checking}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #A7F3D0', background: checking ? '#F0FDF9' : 'white', color: '#005957', fontSize: 13, fontWeight: 600, cursor: checking ? 'not-allowed' : 'pointer', opacity: checking ? 0.7 : 1 }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: checking ? 'spin 1s linear infinite' : 'none' }} />
            {checking ? '수신 확인 중...' : '수신 결과 동기화'}
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: refreshing ? 0.6 : 1 }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? '새로고침...' : '새로고침'}
          </button>
          {filtered.length > 0 && (
            <button
              onClick={() => {
                const rows = filtered.map(l => ({
                  '발송일시': l.sent_at?.slice(0, 16).replace('T', ' ') ?? '',
                  '채널': CHANNEL_LABELS[l.channel] ?? l.channel,
                  '고객사': l.customer ?? '',
                  '수신번호': l.receiver_masked ?? '',
                  '내용 미리보기': l.content_preview ?? '',
                  '상태': STATUS_CONFIG[l.status as keyof typeof STATUS_CONFIG]?.label ?? l.status,
                  '열람일시': l.open_at?.slice(0, 16).replace('T', ' ') ?? '',
                  '클릭일시': l.click_at?.slice(0, 16).replace('T', ' ') ?? '',
                }));
                downloadExcel(rows, `발송이력_${new Date().toISOString().slice(0, 10)}.xlsx`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Download style={{ width: 14, height: 14 }} /> 엑셀 내보내기
            </button>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '총 발송', value: stats.total.toLocaleString(), unit: '건', color: '#1A2332' },
          { label: '열람', value: stats.opened.toLocaleString(), unit: '건', color: '#2563EB' },
          { label: '클릭', value: stats.clicked.toLocaleString(), unit: '건', color: '#16A34A' },
          { label: '열람율', value: stats.openRate, unit: '%', color: '#2563EB' },
          { label: '클릭율', value: stats.clickRate, unit: '%', color: '#16A34A' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{s.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 섹션 */}
      {logs.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
          <button
            onClick={() => setShowCharts(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#005957' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>발송 분석 차트</span>
            </div>
            {showCharts
              ? <ChevronUp style={{ width: 16, height: 16, color: '#8B95A1' }} />
              : <ChevronDown style={{ width: 16, height: 16, color: '#8B95A1' }} />
            }
          </button>

          {showCharts && (
            <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
              {/* 트렌드 차트 */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 12 }}>
                  일별 발송 트렌드 (최근 30일)
                </p>
                {hasTrendData ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#8B95A1' }}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#8B95A1' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #F2F4F6', fontSize: 12 }}
                        formatter={(v: number, name: string) => [v, name === 'sends' ? '발송' : '열람']}
                        labelFormatter={l => l}
                      />
                      <Legend
                        formatter={v => v === 'sends' ? '발송' : '열람'}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      <Line type="monotone" dataKey="sends" stroke="#005957" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="opens" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B0B8C1', fontSize: 13 }}>
                    최근 30일 발송 기록이 없습니다
                  </div>
                )}
              </div>

              {/* 채널별 바 차트 */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 12 }}>
                  채널별 발송 현황
                </p>
                {channelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={channelChartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
                      <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#8B95A1' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B95A1' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #F2F4F6', fontSize: 12 }}
                        formatter={(v: number, name: string) => [v, name === 'sends' ? '발송' : '열람']}
                      />
                      <Bar dataKey="sends" name="발송" radius={[4, 4, 0, 0]}>
                        {channelChartData.map((entry, i) => (
                          <Cell key={i} fill={CHANNEL_COLORS[Object.entries(CHANNEL_LABELS).find(([, v]) => v === entry.channel)?.[0] ?? ''] ?? '#8B95A1'} />
                        ))}
                      </Bar>
                      <Bar dataKey="opens" name="열람" fill="#BFDBFE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B0B8C1', fontSize: 13 }}>
                    데이터 없음
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 채널별 현황 배지 */}
      {(() => {
        const channelCounts: Record<string, number> = {};
        logs.forEach(l => { channelCounts[l.channel] = (channelCounts[l.channel] ?? 0) + 1; });
        return Object.keys(channelCounts).length > 0 ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {Object.entries(channelCounts).map(([ch, cnt]) => (
              <div key={ch} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white', border: `1px solid ${CHANNEL_COLORS[ch] ?? '#E2E8F0'}`,
                borderRadius: 20, padding: '5px 12px',
              }}>
                <ChannelIcon ch={ch} />
                <span style={{ fontSize: 12, fontWeight: 700, color: CHANNEL_COLORS[ch] ?? '#64748B' }}>{CHANNEL_LABELS[ch] ?? ch}</span>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>{cnt}건</span>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter style={{ width: 14, height: 14, color: '#8B95A1', flexShrink: 0 }} />
        <select
          value={channelFilter}
          onChange={e => { setChannelFilter(e.target.value); setPage(1); }}
          style={{ height: 32, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, padding: '0 10px', color: '#4A5568' }}
        >
          <option value="all">전체 채널</option>
          {Object.keys(CHANNEL_LABELS).map(k => (
            <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>
          ))}
        </select>
        <select
          value={customerFilter}
          onChange={e => { setCustomerFilter(e.target.value); setPage(1); }}
          style={{ height: 32, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, padding: '0 10px', color: '#4A5568' }}
        >
          <option value="all">전체 고객사</option>
          {customers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          style={{ height: 32, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, padding: '0 10px', color: '#4A5568' }}
        />
        <span style={{ fontSize: 12, color: '#B0B8C1' }}>~</span>
        <input
          type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          style={{ height: 32, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, padding: '0 10px', color: '#4A5568' }}
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#8B95A1', fontSize: 12, cursor: 'pointer' }}
          >
            초기화
          </button>
        )}
        <span style={{ fontSize: 12, color: '#8B95A1', marginLeft: 4 }}>{filtered.length}건</span>
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#8B95A1', fontSize: 14 }}>
          발송 기록이 없습니다.
          <p style={{ fontSize: 12, marginTop: 8, color: '#B0B8C1' }}>
            콘텐츠 생성 페이지에서 SMS/카카오를 발송하면 여기에 기록됩니다.
          </p>
        </div>
      ) : (
        <>
          <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F2F4F6' }}>
                  {['채널', '고객사', '수신번호', '내용 미리보기', '상태', '팝빌 수신', '발송일시', '열람일시', '클릭일시'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8B95A1', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((log, i) => {
                  const st = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.sent;
                  return (
                    <tr key={log.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <ChannelIcon ch={log.channel} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: CHANNEL_COLORS[log.channel] ?? '#64748B' }}>
                            {CHANNEL_LABELS[log.channel] ?? log.channel}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1A2332', fontWeight: 600 }}>{log.customer || '-'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>{log.receiver_masked || '-'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#4A5568', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.content_preview || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 9px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {log.popbill_result ? (
                          <span style={{
                            display: 'inline-block', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                            background: log.popbill_result === '0' ? '#F0FDF4' : '#FEF2F2',
                            color: log.popbill_result === '0' ? '#16A34A' : '#DC2626',
                          }}>
                            {log.popbill_result === '0' ? '수신완료' : log.popbill_msg ?? log.popbill_result}
                          </span>
                        ) : <span style={{ fontSize: 11, color: '#D1D5DB' }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{fmt(log.sent_at)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: log.open_at ? '#2563EB' : '#D1D5DB', whiteSpace: 'nowrap' }}>{fmt(log.open_at)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: log.click_at ? '#16A34A' : '#D1D5DB', whiteSpace: 'nowrap' }}>{fmt(log.click_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {page > 1 && (
                <button onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, cursor: 'pointer' }}>
                  이전
                </button>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1
                  : page <= 4 ? i + 1
                  : page >= totalPages - 3 ? totalPages - 6 + i
                  : page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: '1px solid',
                      borderColor: p === page ? '#005957' : '#E2E8F0',
                      background: p === page ? '#005957' : 'white',
                      color: p === page ? 'white' : '#4A5568',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              {page < totalPages && (
                <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, cursor: 'pointer' }}>
                  다음
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

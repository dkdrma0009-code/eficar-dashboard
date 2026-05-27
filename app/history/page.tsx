'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSendLogs, type SendLog } from '@/lib/sendLogStorage';
import { BarChart2, Mail, MessageSquare, Image, Phone, Filter } from 'lucide-react';

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

export default function HistoryPage() {
  const [logs, setLogs]           = useState<SendLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [channelFilter, setChannelFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    getSendLogs(undefined, 200).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const customers = useMemo(() => {
    const s = new Set(logs.map(l => l.customer).filter(Boolean));
    return Array.from(s).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
      if (customerFilter !== 'all' && l.customer !== customerFilter) return false;
      return true;
    });
  }, [logs, channelFilter, customerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => {
    const total = filtered.length;
    const opened = filtered.filter(l => l.open_at).length;
    const clicked = filtered.filter(l => l.click_at).length;
    return { total, opened, clicked, openRate: total ? (opened / total * 100).toFixed(1) : '0', clickRate: total ? (clicked / total * 100).toFixed(1) : '0' };
  }, [filtered]);

  const channelCounts = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach(l => { m[l.channel] = (m[l.channel] ?? 0) + 1; });
    return m;
  }, [logs]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#8B95A1', fontSize: 14 }}>
      발송 이력 불러오는 중...
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <BarChart2 style={{ width: 20, height: 20, color: '#005957' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2332', margin: 0 }}>발송 이력</h1>
        </div>
        <p style={{ fontSize: 13, color: '#8B95A1', margin: 0 }}>SMS·LMS·MMS·카카오 발송 기록 및 열람/클릭 추적</p>
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

      {/* 채널별 현황 */}
      {Object.keys(channelCounts).length > 0 && (
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
      )}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <Filter style={{ width: 14, height: 14, color: '#8B95A1' }} />
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
                  {['채널', '고객사', '수신번호', '내용 미리보기', '상태', '발송일시', '열람일시', '클릭일시'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8B95A1', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((log, i) => {
                  const st = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.sent;
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

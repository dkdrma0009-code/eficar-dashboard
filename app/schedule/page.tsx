'use client';

import { useEffect, useState } from 'react';
import { Clock, Trash2, RefreshCw, Plus, Mail, Phone } from 'lucide-react';
import { getScheduledSends, deleteScheduledSend, type ScheduledSend } from '@/lib/scheduledSendStorage';

const CHANNEL_LABELS: Record<string, string> = {
  email: '이메일', sms: 'SMS', lms: 'LMS', mms: 'MMS',
};

const STATUS_CONFIG = {
  pending: { label: '대기중', bg: '#FFFBEB', color: '#B45309' },
  sent:    { label: '발송완료', bg: '#F0FDF4', color: '#16A34A' },
  failed:  { label: '실패', bg: '#FEF2F2', color: '#DC2626' },
};

function fmtDT(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function SchedulePage() {
  const [jobs, setJobs] = useState<ScheduledSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');

  const load = async () => {
    setLoading(true);
    const data = await getScheduledSends();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 예약을 취소하시겠습니까?')) return;
    setDeleting(id);
    await deleteScheduledSend(id);
    setJobs(prev => prev.filter(j => j.id !== id));
    setDeleting(null);
  };

  const filtered = jobs.filter(j => filter === 'all' || j.status === filter);

  const counts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    sent: jobs.filter(j => j.status === 'sent').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock style={{ width: 22, height: 22, color: '#005957' }} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2332', margin: 0 }}>예약 발송</h1>
            <p style={{ fontSize: 13, color: '#8B95A1', margin: 0 }}>콘텐츠 생성 페이지에서 예약한 이메일·SMS 목록</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            새로고침
          </button>
          <a href="/content" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#005957', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
            <Plus style={{ width: 13, height: 13 }} />
            콘텐츠에서 예약
          </a>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {([['all', '전체', '#1A2332'], ['pending', '대기중', '#B45309'], ['sent', '발송완료', '#16A34A'], ['failed', '실패', '#DC2626']] as const).map(([key, label, color]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: '12px 16px', borderRadius: 12, border: `2px solid ${filter === key ? color : '#F2F4F6'}`, background: filter === key ? '#F8FAFC' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <p style={{ fontSize: 11, color: '#8B95A1', margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
            <span style={{ fontSize: 24, fontWeight: 800, color }}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#8B95A1' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid #F2F4F6' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>예약된 발송이 없습니다</p>
          <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 20 }}>콘텐츠 생성 페이지에서 문구를 만들고 예약 발송하세요</p>
          <a href="/content" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: '#005957', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            콘텐츠 생성하러 가기 →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(job => {
            const st = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
            const isPending = job.status === 'pending';
            const isPast = new Date(job.scheduled_at) < new Date();
            return (
              <div key={job.id} style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: job.channel === 'email' ? '#DCFCE7' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {job.channel === 'email'
                    ? <Mail style={{ width: 16, height: 16, color: '#16A34A' }} />
                    : <Phone style={{ width: 16, height: 16, color: '#2563EB' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>
                      {job.subject || job.content.slice(0, 30) + '...'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: st.bg, color: st.color }}>{st.label}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F1F5F9', color: '#64748B' }}>{CHANNEL_LABELS[job.channel] ?? job.channel}</span>
                    {job.customer && <span style={{ fontSize: 11, color: '#8B95A1' }}>{job.customer}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8B95A1' }}>
                    <span>
                      <Clock style={{ width: 11, height: 11, display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                      {fmtDT(job.scheduled_at)}
                      {isPending && isPast && <span style={{ marginLeft: 6, color: '#DC2626', fontWeight: 700 }}>⚠️ 지연됨</span>}
                    </span>
                    <span>수신 {job.recipients.length}명</span>
                    {job.sent_at && <span>발송 {fmtDT(job.sent_at)}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#374151', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.content.replace(/^제목:.*\n\n?/, '').slice(0, 80)}...
                  </p>
                </div>
                {isPending && (
                  <button onClick={() => handleDelete(job.id)} disabled={deleting === job.id}
                    style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: 'white', color: '#DC2626', fontSize: 12, cursor: 'pointer', flexShrink: 0, opacity: deleting === job.id ? 0.5 : 1 }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20, padding: '14px 16px', background: '#F8F9FA', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: 12, color: '#8B95A1', margin: 0, lineHeight: 1.7 }}>
          💡 예약 발송은 서버에서 5분 간격으로 실행됩니다. 로컬 개발 환경에서는 <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: 4 }}>/api/cron/scheduled-sends</code>를 직접 호출하거나, Vercel 배포 후 자동 실행됩니다.
        </p>
      </div>
    </div>
  );
}

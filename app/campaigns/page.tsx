'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, X, Check, Send, Upload, AlertCircle, Bell, Mail, Clock, Brain, TrendingUp, TrendingDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadExcel } from '@/lib/exportExcel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign, isDuplicateCampaign, type CampaignRecord, type CampaignChannel, type CampaignOutcome } from '@/lib/campaignStorage';
import { getSendLogs, type SendLog } from '@/lib/sendLogStorage';
import { useDashboardData } from '@/lib/DataContext';

const CHANNELS: { value: CampaignChannel; label: string; emoji: string }[] = [
  { value: 'linkedin', label: 'LinkedIn',  emoji: '💼' },
  { value: 'kakao',    label: '카카오톡',  emoji: '💬' },
  { value: 'email',    label: '이메일',    emoji: '📧' },
  { value: 'cardnews', label: '카드뉴스',  emoji: '🃏' },
  { value: 'etc',      label: '기타',      emoji: '📌' },
];

const OUTCOMES: { value: CampaignOutcome; label: string; color: string; bg: string }[] = [
  { value: 'sent',     label: '발송',      color: '#8B95A1', bg: '#F2F4F6' },
  { value: 'responded',label: '반응 있음', color: '#0A66C2', bg: '#EFF6FF' },
  { value: 'meeting',  label: '미팅 확정', color: '#D97706', bg: '#FFFBEB' },
  { value: 'proposal', label: '제안 진행', color: '#6366F1', bg: '#EEF2FF' },
  { value: 'closed',   label: '성과 완료', color: '#005957', bg: '#E6F2F2' },
];

const EMPTY: Omit<CampaignRecord, 'id' | 'createdAt'> = {
  date: '', customer: '', channel: 'kakao', contentSummary: '', outcome: 'sent', note: '', scheduledDate: '',
};

interface ImportRow {
  date: string;
  customer: string;
  template: string;
  senderId: string;
  total: number;
  success: number;
  fail: number;
}

function extractCustomer(text: string): string {
  if (/롯데렌탈/.test(text)) return '롯데렌탈';
  if (/SK렌터카|sk렌터카/i.test(text)) return 'SK렌터카';
  if (/그린카/.test(text)) return '그린카';
  if (/삼성화재/.test(text)) return '삼성화재';
  return '전체';
}

export default function CampaignsPage() {
  const { data } = useDashboardData();
  const [records, setRecords] = useState<CampaignRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [filterOutcome, setFilterOutcome] = useState<CampaignOutcome | 'all'>('all');
  const [importPreview, setImportPreview] = useState<ImportRow[] | null>(null);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    setRecords(getCampaigns());
    const c = searchParams.get('customer');
    if (c) { setForm(prev => ({ ...prev, customer: c })); setShowForm(true); }
  }, []);

  const [viewMode, setViewMode] = useState<'grouped' | 'list' | 'sendlogs' | 'charts'>('grouped');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);

  useEffect(() => {
    getSendLogs(undefined, 100).then(setSendLogs);
  }, []);

  const filtered = useMemo(() =>
    records.filter(r => filterOutcome === 'all' || r.outcome === filterOutcome),
    [records, filterOutcome]
  );

  function parseNote(note: string) {
    const raw = {
      total:   Number(note.match(/발송\s*(\d+)건/)?.[1]  ?? 0),
      success: Number(note.match(/성공\s*(\d+)건/)?.[1]  ?? 0),
      fail:    Number(note.match(/실패\s*(\d+)건/)?.[1]  ?? 0),
    };
    // 발송 총수가 성공+실패보다 작으면 성공+실패를 기준으로 사용
    return { ...raw, total: Math.max(raw.total, raw.success + raw.fail) };
  }

  const totalStats = useMemo(() => {
    let sent = 0, success = 0, fail = 0;
    records.forEach(r => {
      const n = parseNote(r.note);
      if (n.total > 0) { sent += n.total; success += n.success; fail += n.fail; }
      else sent += 1;
    });
    return { sent, success, fail, rate: sent > 0 ? Math.min(100, Math.round((success / sent) * 100)) : 0 };
  }, [records]);

  const grouped = useMemo(() => {
    const map = new Map<string, {
      key: string; template: string; customer: string; channel: CampaignChannel;
      occasions: number; totalSent: number; totalSuccess: number; totalFail: number;
      firstDate: string; lastDate: string; records: CampaignRecord[];
    }>();
    filtered.forEach(r => {
      const key = r.contentSummary || r.customer;
      const n = parseNote(r.note);
      if (!map.has(key)) {
        map.set(key, { key, template: r.contentSummary, customer: r.customer, channel: r.channel,
          occasions: 0, totalSent: 0, totalSuccess: 0, totalFail: 0,
          firstDate: r.date, lastDate: r.date, records: [] });
      }
      const g = map.get(key)!;
      g.occasions += 1;
      g.totalSent += n.total > 0 ? n.total : 1;
      g.totalSuccess += n.success;
      g.totalFail += n.fail;
      if (r.date < g.firstDate) g.firstDate = r.date;
      if (r.date > g.lastDate) g.lastDate = r.date;
      g.records.push(r);
    });
    return Array.from(map.values())
      .filter(g => filterCustomer === 'all' || g.customer === filterCustomer)
      .sort((a, b) => b.totalSent - a.totalSent);
  }, [filtered, filterCustomer]);

  const customerList = useMemo(() => [...new Set(records.map(r => r.customer))].sort(), [records]);

  const stats = useMemo(() => {
    return OUTCOMES.map(o => ({ ...o, count: records.filter(r => r.outcome === o.value).length }))
      .filter(o => o.count > 0 || o.value === 'sent');
  }, [records]);

  const conversionRate = useMemo(() => {
    const sent = records.length;
    const converted = records.filter(r => r.outcome === 'meeting' || r.outcome === 'proposal' || r.outcome === 'closed').length;
    return sent > 0 ? Math.round((converted / sent) * 100) : 0;
  }, [records]);

  const overdue = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return records
      .filter(r => r.outcome === 'sent' && r.date <= cutoffStr)
      .map(r => ({
        ...r,
        daysSince: Math.floor((Date.now() - new Date(r.date).getTime()) / 86400000),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  const scheduledToday = useMemo(() =>
    records.filter(r => r.scheduledDate === today),
    [records, today]
  );

  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { month: string; 발송: number; 성공: number }>();
    records.forEach(r => {
      const month = r.date.slice(0, 7);
      const n = parseNote(r.note);
      if (!map.has(month)) map.set(month, { month, 발송: 0, 성공: 0 });
      const m = map.get(month)!;
      m.발송 += n.total > 0 ? n.total : 1;
      m.성공 += n.success;
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [records]);

  const channelChartData = useMemo(() => {
    return CHANNELS.map(ch => {
      const recs = records.filter(r => r.channel === ch.value);
      const conv = recs.filter(r => r.outcome === 'meeting' || r.outcome === 'proposal' || r.outcome === 'closed').length;
      return { name: ch.label, 전환율: recs.length > 0 ? Math.round(conv / recs.length * 100) : 0, 캠페인수: recs.length };
    }).filter(d => d.캠페인수 > 0);
  }, [records]);

  const outcomeChartData = useMemo(() => {
    return OUTCOMES.map(o => ({
      name: o.label,
      value: records.filter(r => r.outcome === o.value).length,
      color: o.color,
    })).filter(d => d.value > 0);
  }, [records]);

  function sendBrowserNotification() {
    if (!('Notification' in window)) { alert('이 브라우저는 알림을 지원하지 않습니다.'); return; }
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification('에픽카 팔로업 알림 🔔', {
          body: `${overdue.length}건의 캠페인이 7일 이상 반응 없음. 지금 확인하세요.`,
          icon: '/favicon.ico',
        });
      }
    });
  }

  async function sendEmailNotification() {
    if (!overdue.length) return;
    setEmailSending(true);
    setEmailResult('');
    try {
      const res = await fetch('/api/followup-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns: overdue }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setEmailResult('이메일 발송 완료 ✓');
    } catch (e: unknown) {
      setEmailResult(e instanceof Error ? e.message : '발송 실패');
    } finally {
      setEmailSending(false);
      setTimeout(() => setEmailResult(''), 4000);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as unknown[][];

        // 헤더 행 건너뛰기 (첫 행이 컬럼명)
        const dataRows = rows.slice(1).filter(r => r && r.length >= 11);

        // 날짜+템플릿+발신자 기준 그룹핑
        const grouped = new Map<string, ImportRow>();

        for (const row of dataRows) {
          const rawDate = row[3];
          const senderId = String(row[5] ?? '');
          const content  = String(row[9] ?? '');
          const success  = Number(row[12]) || 0;
          const fail     = Number(row[14]) || 0;
          // total이 0이면 success+fail을 기준으로 사용, 둘 다 0이면 1
          const total    = Math.max(Number(row[10]) || 0, success + fail) || 1;

          let date = '';
          if (rawDate instanceof Date) {
            date = rawDate.toISOString().slice(0, 10);
          } else {
            date = String(rawDate ?? '').slice(0, 10);
          }
          if (!date || date.length < 10 || date === 'undefined') continue;

          const bracketMatch = content.match(/\[([^\]]+)\]/);
          const template = bracketMatch ? bracketMatch[1] : content.slice(0, 40);
          const key = `${date}__${template}__${senderId}`;

          if (grouped.has(key)) {
            const g = grouped.get(key)!;
            g.total += total;
            g.success += success;
            g.fail += fail;
          } else {
            grouped.set(key, {
              date,
              customer: extractCustomer(template + content),
              template,
              senderId,
              total,
              success,
              fail,
            });
          }
        }

        const preview = Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
        if (preview.length === 0) { setImportError('데이터를 찾을 수 없습니다. 팝빌 카카오톡 전송결과 파일인지 확인해주세요.'); return; }
        setImportPreview(preview);
      } catch {
        setImportError('파일 읽기 실패. 팝빌 엑셀 파일을 그대로 업로드해주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function confirmImport() {
    if (!importPreview) return;
    let skipped = 0;
    importPreview.forEach(row => {
      if (isDuplicateCampaign(row.date, row.template)) { skipped++; return; }
      addCampaign({
        date: row.date,
        customer: row.customer,
        channel: 'kakao',
        contentSummary: row.template,
        outcome: 'sent',
        note: `발송 ${row.total}건 · 성공 ${row.success}건 · 실패 ${row.fail}건`,
      });
    });
    setRecords(getCampaigns());
    setImportPreview(null);
    if (skipped > 0) setImportError(`${skipped}건은 이미 등록된 캠페인이어서 건너뛰었습니다.`);
  }

  function openNew() {
    setForm({ ...EMPTY, date: today });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(r: CampaignRecord) {
    setForm({ date: r.date, customer: r.customer, channel: r.channel, contentSummary: r.contentSummary, outcome: r.outcome, note: r.note, scheduledDate: r.scheduledDate ?? '' });
    setEditId(r.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.customer || !form.date) return;
    if (editId) updateCampaign(editId, form);
    else addCampaign(form);
    setRecords(getCampaigns());
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteCampaign(id);
    setRecords(getCampaigns());
  }

  const customers = useMemo(() => {
    const fromData = data?.customers ?? [];
    const fromRecords = records.map(r => r.customer).filter(Boolean);
    return [...new Set([...fromData, ...fromRecords])].sort();
  }, [data, records]);
  const channelEmoji = (c: CampaignChannel) => CHANNELS.find(x => x.value === c)?.emoji ?? '📌';
  const outcomeMeta = (o: CampaignOutcome) => OUTCOMES.find(x => x.value === o)!;

  return (
    <>
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>캠페인 성과 트래킹</h1>
            <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>콘텐츠 발송 후 반응과 성과를 기록하세요</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
            {records.length > 0 && (
              <button
                onClick={() => {
                  const rows = records.map(r => ({
                    '날짜': r.date,
                    '고객사': r.customer,
                    '채널': CHANNELS.find(c => c.value === r.channel)?.label ?? r.channel,
                    '콘텐츠 요약': r.contentSummary,
                    '성과': OUTCOMES.find(o => o.value === r.outcome)?.label ?? r.outcome,
                    '메모': r.note,
                    '예약 발송일': r.scheduledDate ?? '',
                  }));
                  downloadExcel(rows, `캠페인_${new Date().toISOString().slice(0, 10)}.xlsx`);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Download style={{ width: 14, height: 14 }} /> 엑셀 내보내기
              </button>
            )}
            <button onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Upload style={{ width: 14, height: 14 }} /> 팝빌 가져오기
            </button>
            <button onClick={openNew} className="btn-primary">
              <Plus style={{ width: 14, height: 14 }} /> 캠페인 기록
            </button>
          </div>
        </div>

        {/* 팔로업 알림 배너 */}
        {overdue.length > 0 && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', margin: 0 }}>
                팔로업 필요 {overdue.length}건
              </p>
              <p style={{ fontSize: 12, color: '#B45309', margin: '2px 0 0' }}>
                {overdue.slice(0, 3).map(r => `${r.customer} (${r.daysSince}일 경과)`).join(' · ')}{overdue.length > 3 ? ` 외 ${overdue.length - 3}건` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={sendBrowserNotification}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #FDE68A', background: 'white', color: '#92400E', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Bell style={{ width: 12, height: 12 }} /> 브라우저 알림
              </button>
              <button onClick={sendEmailNotification} disabled={emailSending}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#D97706', color: 'white', fontSize: 12, fontWeight: 700, cursor: emailSending ? 'default' : 'pointer', opacity: emailSending ? 0.7 : 1 }}>
                <Mail style={{ width: 12, height: 12 }} /> {emailSending ? '발송 중...' : '이메일 알림'}
              </button>
            </div>
          </div>
        )}

        {/* 오늘 예약 발송 배너 */}
        {scheduledToday.length > 0 && (
          <div style={{ marginBottom: 16, padding: '14px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock style={{ width: 18, height: 18, color: '#2563EB', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', margin: 0 }}>오늘 예약 발송 {scheduledToday.length}건</p>
              <p style={{ fontSize: 12, color: '#3B82F6', margin: '2px 0 0' }}>
                {scheduledToday.map(r => `${r.customer} · ${r.contentSummary || r.channel}`).slice(0, 3).join(' / ')}
                {scheduledToday.length > 3 ? ` 외 ${scheduledToday.length - 3}건` : ''}
              </p>
            </div>
          </div>
        )}

        {/* AI Campaign Intelligence */}
        {records.length > 0 && (() => {
          const closedCount = records.filter(r => r.outcome === 'closed').length;
          const meetingCount = records.filter(r => r.outcome === 'meeting' || r.outcome === 'proposal' || r.outcome === 'closed').length;
          const channelPerf = CHANNELS.map(ch => {
            const recs = records.filter(r => r.channel === ch.value);
            const conv = recs.filter(r => r.outcome === 'meeting' || r.outcome === 'proposal' || r.outcome === 'closed').length;
            return { ...ch, total: recs.length, conv, rate: recs.length > 0 ? Math.round((conv / recs.length) * 100) : 0 };
          }).filter(c => c.total > 0).sort((a, b) => b.rate - a.rate);
          const bestChannel = channelPerf[0];
          const worstChannel = channelPerf[channelPerf.length - 1];
          const insights: { icon: string; text: string; sub: string; positive: boolean }[] = [];
          if (bestChannel && bestChannel.rate > 0) insights.push({ icon: '🏆', text: `${bestChannel.label} 채널 전환율 ${bestChannel.rate}%로 최고`, sub: `${bestChannel.total}건 발송 → ${bestChannel.conv}건 전환`, positive: true });
          if (conversionRate >= 30) insights.push({ icon: '🚀', text: `전체 미팅 전환율 ${conversionRate}% — 목표 초과`, sub: `${meetingCount}건 미팅/제안/완료`, positive: true });
          else if (conversionRate > 0) insights.push({ icon: '📈', text: `전환율 ${conversionRate}% — 개선 여지 있음`, sub: '반응 고객에게 빠른 팔로업 권장', positive: false });
          if (closedCount > 0) insights.push({ icon: '✅', text: `성과 완료 ${closedCount}건 — 우수한 클로징`, sub: '클로징 성공 템플릿을 재사용하세요', positive: true });
          if (overdue.length > 0) insights.push({ icon: '⏰', text: `팔로업 미응답 ${overdue.length}건 리스크`, sub: `평균 ${Math.round(overdue.reduce((s, r) => s + r.daysSince, 0) / overdue.length)}일 경과`, positive: false });
          if (worstChannel && worstChannel !== bestChannel && worstChannel.total >= 2) insights.push({ icon: '💡', text: `${worstChannel.label} 채널 전환율 ${worstChannel.rate}%로 최저`, sub: '채널 전략 재검토 필요', positive: false });
          if (insights.length === 0) return null;
          return (
            <div style={{ marginBottom: 20, padding: '16px 20px', background: 'white', border: '1px solid #E6F2F2', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Brain style={{ width: 15, height: 15, color: '#005957' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>AI 캠페인 인사이트</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8B95A1' }}>총 {records.length}건 분석</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {insights.slice(0, 4).map((ins, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: ins.positive ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${ins.positive ? '#86EFAC' : '#FDE68A'}` }}>
                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: ins.positive ? '#166534' : '#92400E', margin: 0, marginBottom: 2 }}>{ins.text}</p>
                      <p style={{ fontSize: 11, color: '#8B95A1', margin: 0 }}>{ins.sub}</p>
                    </div>
                    {ins.positive ? <TrendingUp style={{ width: 12, height: 12, color: '#16A34A', flexShrink: 0, marginLeft: 'auto', marginTop: 2 }} /> : <TrendingDown style={{ width: 12, height: 12, color: '#D97706', flexShrink: 0, marginLeft: 'auto', marginTop: 2 }} />}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 이메일 발송 결과 */}
        {emailResult && (
          <div style={{ marginBottom: 16, padding: '10px 16px', background: emailResult.includes('✓') ? '#E6F2F2' : '#FEF2F2', border: `1px solid ${emailResult.includes('✓') ? '#A7F3D0' : '#FECACA'}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: emailResult.includes('✓') ? '#005957' : '#DC2626' }}>
            {emailResult}
          </div>
        )}

        {/* 발송 통계 카드 */}
        {records.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: '총 발송건', value: totalStats.sent.toLocaleString(), color: '#191F28' },
              { label: '성공', value: totalStats.success.toLocaleString(), color: '#059669' },
              { label: '실패', value: totalStats.fail.toLocaleString(), color: '#DC2626' },
              { label: '성공률', value: `${totalStats.rate}%`, color: '#005957' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 필터 + 뷰 토글 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setFilterCustomer('all')}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filterCustomer === 'all' ? '#005957' : 'white', color: filterCustomer === 'all' ? 'white' : '#8B95A1', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            전체
          </button>
          {customerList.map(c => (
            <button key={c} onClick={() => setFilterCustomer(filterCustomer === c ? 'all' : c)}
              style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: filterCustomer === c ? '#0A66C2' : 'white', color: filterCustomer === c ? 'white' : '#8B95A1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {c}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#F2F4F6', borderRadius: 8, padding: 3 }}>
            {(['grouped', 'list', 'sendlogs', 'charts'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: viewMode === v ? 'white' : 'transparent', color: viewMode === v ? '#191F28' : '#8B95A1',
                  boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                {v === 'grouped' ? '그룹' : v === 'list' ? '전체' : v === 'sendlogs' ? '📡 발송 로그' : '📊 차트'}
              </button>
            ))}
          </div>
        </div>

        {/* 빈 상태 */}
        {records.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Send style={{ width: 48, height: 48, color: '#D1D5DB', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>기록된 캠페인이 없습니다</h3>
            <p style={{ fontSize: 13, color: '#8B95A1' }}>팝빌 가져오기 또는 캠페인 기록을 추가해보세요</p>
          </div>
        )}

        {/* 그룹 뷰 */}
        {viewMode === 'grouped' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {grouped.map(g => {
              const rate = g.totalSent > 0 ? Math.round((g.totalSuccess / g.totalSent) * 100) : 0;
              const isOpen = expandedGroup === g.key;
              return (
                <div key={g.key} className="card" style={{ overflow: 'hidden' }}>
                  {/* 그룹 헤더 */}
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                    onClick={() => setExpandedGroup(isOpen ? null : g.key)}>
                    <span style={{ fontSize: 20 }}>💬</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.template || g.customer}</p>
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: '#EFF6FF', color: '#0A66C2', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{g.customer}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 6, background: '#F2F4F6', color: '#4A5568', fontSize: 12, fontWeight: 600 }}>
                          {g.firstDate === g.lastDate ? g.firstDate : `${g.firstDate} ~ ${g.lastDate}`}
                        </span>
                        <span style={{ fontSize: 12, color: '#8B95A1' }}>{g.occasions}회 발송</span>
                      </div>
                    </div>
                    {/* 수치 */}
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600 }}>발송</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#191F28' }}>{g.totalSent}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>성공</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{g.totalSuccess}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#DC2626', fontWeight: 600 }}>실패</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: g.totalFail > 0 ? '#DC2626' : '#D1D5DB' }}>{g.totalFail}</p>
                      </div>
                      <div style={{ width: 64, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>성공률</p>
                        <div style={{ height: 6, background: '#F2F4F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: 6, width: `${rate}%`, background: rate >= 80 ? '#059669' : rate >= 50 ? '#D97706' : '#DC2626', borderRadius: 3 }} />
                        </div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#191F28', marginTop: 2 }}>{rate}%</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: '#8B95A1', marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {/* 펼치면 세부 내역 */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #F2F4F6', background: '#FAFAFA' }}>
                      {g.records.map(r => {
                        const om = outcomeMeta(r.outcome);
                        const n = parseNote(r.note);
                        return (
                          <div key={r.id} style={{ padding: '10px 20px 10px 54px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F2F4F6' }}>
                            <span style={{ fontSize: 12, color: '#8B95A1', minWidth: 52, fontWeight: 600 }}>{r.date.slice(5)}</span>
                            {n.total > 0 ? (
                              <span style={{ fontSize: 12, color: '#4A5568' }}>발송 {n.total} · 성공 {n.success} · 실패 {n.fail}</span>
                            ) : (
                              <span style={{ fontSize: 12, color: '#8B95A1' }}>{r.note || '-'}</span>
                            )}
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <select value={r.outcome} onChange={e => { updateCampaign(r.id, { outcome: e.target.value as CampaignOutcome }); setRecords(getCampaigns()); }}
                                style={{ padding: '3px 8px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: om.bg, color: om.color, fontFamily: 'inherit' }}>
                                {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <button onClick={() => handleDelete(r.id)} style={{ padding: 4, borderRadius: 4, border: 'none', background: 'none', color: '#F04452', cursor: 'pointer', display: 'flex' }}>
                                <X style={{ width: 12, height: 12 }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 전체 목록 뷰 */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => {
              const om = outcomeMeta(r.outcome);
              return (
                <div key={r.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, color: '#8B95A1', fontWeight: 600, minWidth: 56 }}>{r.date.slice(5)}</span>
                  <span style={{ fontSize: 18 }}>{channelEmoji(r.channel)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>{r.customer}</p>
                    {r.contentSummary && <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.contentSummary}</p>}
                  </div>
                  {r.note && <p style={{ fontSize: 12, color: '#8B95A1', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note}</p>}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select value={r.outcome} onChange={e => { updateCampaign(r.id, { outcome: e.target.value as CampaignOutcome }); setRecords(getCampaigns()); }}
                      style={{ padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: om.bg, color: om.color, fontFamily: 'inherit' }}>
                      {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={() => openEdit(r)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 12, cursor: 'pointer' }}>수정</button>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: 5, borderRadius: 6, border: 'none', background: 'none', color: '#F04452', cursor: 'pointer', display: 'flex' }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 발송 로그 뷰 */}
        {viewMode === 'sendlogs' && (
          <div>
            {/* 통계 요약 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: '총 발송', value: sendLogs.length, color: '#191F28' },
                { label: '열람', value: sendLogs.filter(l => l.open_at).length, sub: sendLogs.length ? `${Math.round(sendLogs.filter(l => l.open_at).length / sendLogs.length * 100)}%` : '-', color: '#0A66C2' },
                { label: '클릭', value: sendLogs.filter(l => l.click_at).length, sub: sendLogs.length ? `${Math.round(sendLogs.filter(l => l.click_at).length / sendLogs.length * 100)}%` : '-', color: '#005957' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                  {s.sub && <p style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.sub}</p>}
                </div>
              ))}
            </div>

            {sendLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B95A1' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>📡</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>발송 로그가 없습니다</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>콘텐츠 페이지에서 SMS·카카오·이메일 발송 시 자동 기록됩니다</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sendLogs.map(log => {
                  const channelLabel = { sms: 'SMS', lms: 'LMS', mms: 'MMS', kakao: '카카오', email: '이메일' }[log.channel] ?? log.channel;
                  const channelEmoji = { sms: '📨', lms: '📄', mms: '🖼️', kakao: '💬', email: '📧' }[log.channel] ?? '📤';
                  return (
                    <div key={log.id} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, minWidth: 80 }}>{log.sent_at.slice(0, 16).replace('T', ' ')}</span>
                      <span style={{ fontSize: 16 }}>{channelEmoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28' }}>{log.customer || '—'} <span style={{ fontSize: 11, fontWeight: 500, color: '#8B95A1' }}>{channelLabel}</span></p>
                        <p style={{ fontSize: 11, color: '#8B95A1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.content_preview}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {log.open_at && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#0A66C2', background: '#EFF6FF', padding: '3px 8px', borderRadius: 12 }}>👁 열람</span>
                        )}
                        {log.click_at && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#005957', background: '#E6F2F2', padding: '3px 8px', borderRadius: 12 }}>🖱 클릭</span>
                        )}
                        {!log.open_at && !log.click_at && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#8B95A1', background: '#F2F4F6', padding: '3px 8px', borderRadius: 12 }}>발송됨</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 차트 뷰 */}
        {viewMode === 'charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#8B95A1', fontSize: 14 }}>
                캠페인 데이터가 없습니다. 팝빌 가져오기로 데이터를 추가해보세요.
              </div>
            ) : (
              <>
                {/* 월별 발송 추이 */}
                {monthlyChartData.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '20px 24px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>월별 발송 추이</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyChartData} barGap={4} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B95A1' }} tickLine={false} axisLine={false}
                          tickFormatter={v => v.slice(5) + '월'} />
                        <YAxis tick={{ fontSize: 11, fill: '#8B95A1' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #F2F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(val: number, name: string) => [`${val.toLocaleString()}건`, name]}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="발송" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="성공" fill="#005957" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* 채널별 전환율 */}
                  {channelChartData.length > 0 && (
                    <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '20px 24px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>채널별 전환율 (%)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={channelChartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8B95A1' }} tickLine={false} axisLine={false}
                            tickFormatter={v => `${v}%`} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#4A5568' }} tickLine={false} axisLine={false} width={56} />
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #F2F4F6' }}
                            formatter={(val: number, _: string, entry: { payload?: { 캠페인수?: number } }) => [`${val}% (${entry.payload?.캠페인수 ?? 0}건)`, '전환율']}
                          />
                          <Bar dataKey="전환율" radius={[0, 4, 4, 0]}>
                            {channelChartData.map((_, i) => (
                              <Cell key={i} fill={['#005957', '#0A66C2', '#6366F1', '#F59E0B', '#8B95A1'][i % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 성과 단계별 현황 */}
                  {outcomeChartData.length > 0 && (
                    <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '20px 24px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>성과 단계별 현황</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={outcomeChartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8B95A1' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#8B95A1' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #F2F4F6' }}
                            formatter={(val: number) => [`${val}건`, '캠페인']}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {outcomeChartData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 발송 로그 열람/클릭 */}
                {sendLogs.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '20px 24px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>발송 로그 열람·클릭 현황</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: '총 발송', value: sendLogs.length, unit: '건', color: '#191F28' },
                        { label: '열람율', value: sendLogs.length ? Math.round(sendLogs.filter(l => l.open_at).length / sendLogs.length * 100) : 0, unit: '%', color: '#0A66C2' },
                        { label: '클릭율', value: sendLogs.length ? Math.round(sendLogs.filter(l => l.click_at).length / sendLogs.length * 100) : 0, unit: '%', color: '#005957' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#F8F9FA', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                          <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
                          <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}<span style={{ fontSize: 14, fontWeight: 500, color: '#8B95A1' }}>{s.unit}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 팝빌 가져오기 에러 */}
        {importError && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle style={{ width: 16, height: 16, color: '#DC2626', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#DC2626' }}>{importError}</span>
            <button onClick={() => setImportError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X style={{ width: 14, height: 14 }} /></button>
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191F28' }}>{editId ? '기록 수정' : '캠페인 기록'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1' }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>날짜</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>고객사 *</label>
                  <input
                    list="customer-list"
                    value={form.customer}
                    onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                    placeholder="고객사 선택 또는 직접 입력"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit' }}
                  />
                  <datalist id="customer-list">
                    {customers.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>채널</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CHANNELS.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, channel: c.value }))}
                      style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: form.channel === c.value ? '#005957' : '#F2F4F6', color: form.channel === c.value ? 'white' : '#8B95A1' }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>콘텐츠 요약</label>
                <input value={form.contentSummary} onChange={e => setForm(f => ({ ...f, contentSummary: e.target.value }))}
                  placeholder="예: 에픽커넥트 도입 제안 이메일"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>성과</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {OUTCOMES.map(o => (
                    <button key={o.value} onClick={() => setForm(f => ({ ...f, outcome: o.value }))}
                      style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: form.outcome === o.value ? o.color : '#F2F4F6', color: form.outcome === o.value ? 'white' : '#8B95A1' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>메모</label>
                <textarea value={form.note} rows={2} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              {/* 예약 발송 */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <Clock style={{ width: 12, height: 12 }} /> 예약 발송일 <span style={{ fontSize: 11, fontWeight: 400 }}>(선택 — 해당 날짜에 알림)</span>
                </label>
                <input type="date" value={form.scheduledDate ?? ''} min={today}
                  onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${form.scheduledDate ? '#005957' : '#F2F4F6'}`, borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit' }} />
                {form.scheduledDate && (
                  <p style={{ fontSize: 11, color: '#005957', marginTop: 4 }}>📅 {form.scheduledDate} 에 발송 알림이 표시됩니다.</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {editId && <button onClick={() => { handleDelete(editId); setShowForm(false); }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>삭제</button>}
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={!form.customer} className="btn-primary" style={{ flex: 2, justifyContent: 'center', opacity: !form.customer ? 0.5 : 1 }}>
                <Check style={{ width: 14, height: 14 }} /> {editId ? '수정 완료' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>

    {/* 팝빌 가져오기 미리보기 모달 */}
    {importPreview && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={() => setImportPreview(null)}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 680, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191F28' }}>팝빌 발송내역 가져오기</h3>
              <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 3 }}>
              총 {importPreview.length}개 중{' '}
              {importPreview.filter(r => !isDuplicateCampaign(r.date, r.template)).length}개 신규 등록 ·{' '}
              {importPreview.filter(r => isDuplicateCampaign(r.date, r.template)).length}개 중복 건너뜀
            </p>
            </div>
            <button onClick={() => setImportPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1' }}><X style={{ width: 18, height: 18 }} /></button>
          </div>

          {/* 미리보기 테이블 */}
          <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #F2F4F6', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8F9FA', position: 'sticky', top: 0 }}>
                  {['날짜', '고객사', '템플릿', '발송', '성공', '실패'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#8B95A1', borderBottom: '1px solid #F2F4F6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importPreview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F2F4F6' }}>
                    <td style={{ padding: '8px 12px', color: '#8B95A1', whiteSpace: 'nowrap' }}>{row.date}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#191F28' }}>{row.customer}</td>
                    <td style={{ padding: '8px 12px', color: '#4A5568', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.template}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#191F28' }}>{row.total}</td>
                    <td style={{ padding: '8px 12px', color: '#059669' }}>{row.success}</td>
                    <td style={{ padding: '8px 12px', color: row.fail > 0 ? '#DC2626' : '#8B95A1' }}>{row.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setImportPreview(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>취소</button>
            <button onClick={confirmImport} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
              <Check style={{ width: 14, height: 14 }} /> {importPreview.length}개 캠페인 등록
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

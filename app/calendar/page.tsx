'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react';
import {
  getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  type CalendarEvent, type CalendarChannel, type CalendarStatus,
} from '@/lib/calendarStorage';
import { useDashboardData } from '@/lib/DataContext';

const CHANNELS: { value: CalendarChannel; label: string; emoji: string; color: string }[] = [
  { value: 'linkedin', label: 'LinkedIn',  emoji: '💼', color: '#0A66C2' },
  { value: 'kakao',    label: '카카오톡',  emoji: '💬', color: '#F59E0B' },
  { value: 'email',    label: '이메일',    emoji: '📧', color: '#EA4335' },
  { value: 'cardnews', label: '카드뉴스',  emoji: '🃏', color: '#6366F1' },
  { value: 'etc',      label: '기타',      emoji: '📌', color: '#8B95A1' },
];

const STATUS_META: Record<CalendarStatus, { label: string; color: string; bg: string }> = {
  planned:   { label: '예정', color: '#005957', bg: '#E6F2F2' },
  done:      { label: '완료', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: '취소', color: '#8B95A1', bg: '#F2F4F6' },
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface FormState {
  date: string; channel: CalendarChannel; title: string; customer: string; status: CalendarStatus; note: string;
}

const EMPTY_FORM: FormState = { date: '', channel: 'linkedin', title: '', customer: '', status: 'planned', note: '' };

export default function CalendarPage() {
  const { data } = useDashboardData();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => { setEvents(getCalendarEvents()); }, []);

  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = useMemo(() => events.filter(e => e.date.startsWith(ym)), [events, ym]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  function openNewForm(dateStr: string) {
    setForm({ ...EMPTY_FORM, date: dateStr });
    setEditId(null);
    setShowForm(true);
  }

  function openEditForm(e: CalendarEvent) {
    setForm({ date: e.date, channel: e.channel, title: e.title, customer: e.customer, status: e.status, note: e.note });
    setEditId(e.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title || !form.date) return;
    if (editId) {
      updateCalendarEvent(editId, form);
    } else {
      addCalendarEvent(form);
    }
    setEvents(getCalendarEvents());
    setShowForm(false);
    setEditId(null);
  }

  function handleDelete(id: string) {
    deleteCalendarEvent(id);
    setEvents(getCalendarEvents());
  }

  function toggleStatus(e: CalendarEvent) {
    const next: CalendarStatus = e.status === 'planned' ? 'done' : e.status === 'done' ? 'cancelled' : 'planned';
    updateCalendarEvent(e.id, { status: next });
    setEvents(getCalendarEvents());
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthEvents.filter(e => e.date === dateStr);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const customers = data?.customers ?? [];

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>콘텐츠 캘린더</h1>
            <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>채널별 콘텐츠 발행 계획을 관리하세요</p>
          </div>
          <button onClick={() => openNewForm(todayStr)} className="btn-primary">
            <Plus style={{ width: 14, height: 14 }} /> 일정 추가
          </button>
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ padding: 6, borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <ChevronLeft style={{ width: 16, height: 16, color: '#8B95A1' }} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191F28', minWidth: 120, textAlign: 'center' }}>
            {year}년 {month + 1}월
          </h2>
          <button onClick={nextMonth} style={{ padding: 6, borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <ChevronRight style={{ width: 16, height: 16, color: '#8B95A1' }} />
          </button>
          <div style={{ marginLeft: 8, display: 'flex', gap: 6 }}>
            {CHANNELS.map(c => (
              <span key={c.value} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#F2F4F6', color: '#8B95A1' }}>
                {c.emoji} {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* 달력 */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F2F4F6' }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700,
                color: i === 0 ? '#F04452' : i === 6 ? '#0A66C2' : '#8B95A1' }}>{d}</div>
            ))}
          </div>
          {/* 날짜 셀 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} style={{ minHeight: 100, borderRight: '1px solid #F2F4F6', borderBottom: '1px solid #F2F4F6', background: '#FAFAFA' }} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const dow = (firstDay + day - 1) % 7;
              return (
                <div key={i} onClick={() => openNewForm(dateStr)}
                  style={{ minHeight: 100, borderRight: '1px solid #F2F4F6', borderBottom: '1px solid #F2F4F6', padding: '8px', cursor: 'pointer', transition: 'background 0.1s',
                    background: isToday ? '#F0FFFE' : 'white' }}
                  onMouseEnter={e => (e.currentTarget.style.background = isToday ? '#E6F2F2' : '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = isToday ? '#F0FFFE' : 'white')}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                    background: isToday ? '#005957' : 'transparent',
                    color: isToday ? 'white' : dow === 0 ? '#F04452' : dow === 6 ? '#0A66C2' : '#191F28',
                    fontSize: 12, fontWeight: isToday ? 700 : 500 }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }} onClick={e => e.stopPropagation()}>
                    {dayEvents.slice(0, 3).map(ev => {
                      const ch = CHANNELS.find(c => c.value === ev.channel)!;
                      const st = STATUS_META[ev.status];
                      return (
                        <div key={ev.id} onClick={() => openEditForm(ev)}
                          style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            background: ev.status === 'done' ? '#D1FAE5' : ev.status === 'cancelled' ? '#F2F4F6' : ch.color + '18',
                            color: ev.status === 'done' ? '#059669' : ev.status === 'cancelled' ? '#8B95A1' : ch.color,
                            textDecoration: ev.status === 'cancelled' ? 'line-through' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                          {ch.emoji} {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 9, color: '#8B95A1', fontWeight: 600, paddingLeft: 6 }}>+{dayEvents.length - 3}개 더</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 이번 달 일정 목록 */}
        {monthEvents.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 12 }}>{month + 1}월 전체 일정 ({monthEvents.length}개)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {monthEvents.sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
                const ch = CHANNELS.find(c => c.value === ev.channel)!;
                const st = STATUS_META[ev.status];
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: '#F8F9FA', border: '1px solid #F2F4F6' }}>
                    <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600, minWidth: 40 }}>{ev.date.slice(5)}</span>
                    <span style={{ fontSize: 14 }}>{ch.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: ev.status === 'cancelled' ? '#8B95A1' : '#191F28', textDecoration: ev.status === 'cancelled' ? 'line-through' : 'none' }}>{ev.title}</span>
                    {ev.customer && <span style={{ fontSize: 11, color: '#8B95A1' }}>{ev.customer}</span>}
                    <button onClick={() => toggleStatus(ev)}
                      style={{ padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                      {st.label}
                    </button>
                    <button onClick={() => openEditForm(ev)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 11, cursor: 'pointer' }}>수정</button>
                    <button onClick={() => handleDelete(ev.id)} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', color: '#F04452', cursor: 'pointer', display: 'flex' }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 일정 추가/수정 모달 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191F28' }}>{editId ? '일정 수정' : '일정 추가'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>날짜</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>채널</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CHANNELS.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, channel: c.value }))}
                      style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: form.channel === c.value ? c.color : '#F2F4F6',
                        color: form.channel === c.value ? 'white' : '#8B95A1' }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>제목 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: 롯데렌탈 에픽커넥트 소개 포스팅"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>대상 고객사</label>
                <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="">선택 안함</option>
                  <option value="전체">전체</option>
                  {customers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>상태</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(Object.entries(STATUS_META) as [CalendarStatus, typeof STATUS_META[CalendarStatus]][]).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))}
                      style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: form.status === k ? v.color : '#F2F4F6',
                        color: form.status === k ? 'white' : '#8B95A1' }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', display: 'block', marginBottom: 5 }}>메모</label>
                <textarea value={form.note} rows={2} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="추가 메모"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 13, color: '#191F28', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {editId && (
                <button onClick={() => { handleDelete(editId); setShowForm(false); }}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  삭제
                </button>
              )}
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #F2F4F6', background: 'white', color: '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={!form.title} className="btn-primary" style={{ flex: 2, justifyContent: 'center', opacity: !form.title ? 0.5 : 1 }}>
                <Check style={{ width: 14, height: 14 }} /> {editId ? '수정 완료' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

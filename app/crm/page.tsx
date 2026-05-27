'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Check, Phone, Mail, User, Calendar, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllCRM, getCRMNote, setCRMNote, type CRMNote, type ContactPerson } from '@/lib/crmStorage';
import { useDashboardData } from '@/lib/DataContext';

const EMPTY_CONTACT: ContactPerson = { name: '', phone: '', role: '' };

function ContactCard({
  contact, index, onChange, onDelete,
}: {
  contact: ContactPerson;
  index: number;
  onChange: (c: ContactPerson) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center', padding: '10px 12px', background: '#F8F9FA', borderRadius: 8, border: '1px solid #F2F4F6' }}>
      <div>
        <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600, marginBottom: 3 }}>이름</p>
        <input
          value={contact.name}
          onChange={e => onChange({ ...contact, name: e.target.value })}
          placeholder="홍길동"
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
        />
      </div>
      <div>
        <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600, marginBottom: 3 }}>전화번호</p>
        <input
          value={contact.phone}
          onChange={e => onChange({ ...contact, phone: e.target.value.replace(/[^0-9-]/g, '') })}
          placeholder="01012345678"
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
        />
      </div>
      <div>
        <p style={{ fontSize: 10, color: '#8B95A1', fontWeight: 600, marginBottom: 3 }}>직책</p>
        <input
          value={contact.role ?? ''}
          onChange={e => onChange({ ...contact, role: e.target.value })}
          placeholder="구매담당자"
          style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
        />
      </div>
      <button
        onClick={onDelete}
        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', color: '#F04452', cursor: 'pointer', display: 'flex', alignSelf: 'flex-end', marginBottom: 2 }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

function CustomerCRMCard({ customerName, onSaved }: { customerName: string; onSaved: () => void }) {
  const [note, setNote] = useState<CRMNote>(() => getCRMNote(customerName));
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasData = !!(note.lastContact || note.nextMeeting || note.memo || (note.contacts ?? []).length > 0);

  const save = () => {
    setCRMNote(customerName, note);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  };

  const addContact = () => setNote(n => ({ ...n, contacts: [...(n.contacts ?? []), { ...EMPTY_CONTACT }] }));
  const updateContact = (i: number, c: ContactPerson) =>
    setNote(n => ({ ...n, contacts: (n.contacts ?? []).map((x, j) => (j === i ? c : x)) }));
  const deleteContact = (i: number) =>
    setNote(n => ({ ...n, contacts: (n.contacts ?? []).filter((_, j) => j !== i) }));

  return (
    <div style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: hasData ? '#E6F2F2' : '#F2F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User style={{ width: 16, height: 16, color: hasData ? '#005957' : '#8B95A1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>{customerName}</p>
          <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>
            {(note.contacts ?? []).length > 0
              ? `담당자 ${note.contacts!.length}명`
              : '담당자 없음'}
            {note.nextMeeting ? ` · 다음 미팅 ${note.nextMeeting}` : ''}
          </p>
        </div>
        {hasData && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#005957', background: '#E6F2F2', padding: '3px 8px', borderRadius: 10 }}>
            등록됨
          </span>
        )}
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: '#8B95A1' }} />
          : <ChevronDown style={{ width: 16, height: 16, color: '#8B95A1' }} />}
      </div>

      {/* 펼쳐지는 편집 영역 */}
      {open && (
        <div style={{ borderTop: '1px solid #F2F4F6', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 담당자 목록 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone style={{ width: 12, height: 12 }} /> 담당자 연락처
              </p>
              <button
                onClick={addContact}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #005957', background: 'white', color: '#005957', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus style={{ width: 12, height: 12 }} /> 추가
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(note.contacts ?? []).map((c, i) => (
                <ContactCard key={i} contact={c} index={i} onChange={u => updateContact(i, u)} onDelete={() => deleteContact(i)} />
              ))}
              {(note.contacts ?? []).length === 0 && (
                <p style={{ fontSize: 12, color: '#B0B8C1', textAlign: 'center', padding: '12px 0' }}>담당자를 추가하면 SMS/카카오 발송 시 자동으로 불러옵니다</p>
              )}
            </div>
          </div>

          {/* 날짜 필드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Calendar style={{ width: 12, height: 12 }} /> 최근 컨택
              </p>
              <input
                type="date"
                value={note.lastContact}
                onChange={e => setNote(n => ({ ...n, lastContact: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Calendar style={{ width: 12, height: 12 }} /> 다음 미팅
              </p>
              <input
                type="date"
                value={note.nextMeeting}
                onChange={e => setNote(n => ({ ...n, nextMeeting: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <StickyNote style={{ width: 12, height: 12 }} /> 메모
            </p>
            <textarea
              value={note.memo}
              onChange={e => setNote(n => ({ ...n, memo: e.target.value }))}
              rows={3}
              placeholder="특이사항, 관심 품목, 협의 내용 등..."
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {/* 저장 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={save}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: saved ? '#059669' : '#005957', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
            >
              <Check style={{ width: 14, height: 14 }} />
              {saved ? '저장됨' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  const { data } = useDashboardData();
  const [allCRM, setAllCRM] = useState<Record<string, CRMNote>>({});
  const [search, setSearch] = useState('');
  const [rev, setRev] = useState(0);

  useEffect(() => { setAllCRM(getAllCRM()); }, [rev]);

  const customerList = useMemo(() => {
    const fromData = data?.customers ?? [];
    const fromCRM = Object.keys(allCRM);
    return [...new Set([...fromData, ...fromCRM])].sort();
  }, [data, allCRM]);

  const filtered = useMemo(() =>
    customerList.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [customerList, search],
  );

  const totalContacts = useMemo(() =>
    Object.values(allCRM).reduce((s, n) => s + (n.contacts?.length ?? 0), 0),
    [allCRM],
  );

  const upcomingMeetings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return Object.entries(allCRM)
      .filter(([, n]) => n.nextMeeting && n.nextMeeting >= today)
      .sort(([, a], [, b]) => a.nextMeeting.localeCompare(b.nextMeeting))
      .slice(0, 3);
  }, [allCRM]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <User style={{ width: 20, height: 20, color: '#005957' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2332', margin: 0 }}>CRM 연락처</h1>
        </div>
        <p style={{ fontSize: 13, color: '#8B95A1', margin: 0 }}>고객사별 담당자 연락처 · 미팅 일정 · 메모 관리</p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '등록 고객사', value: customerList.length, unit: '곳' },
          { label: '총 담당자', value: totalContacts, unit: '명' },
          { label: '예정 미팅', value: upcomingMeetings.length, unit: '건' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #F2F4F6', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginBottom: 6, letterSpacing: '0.3px' }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1A2332' }}>
              {s.value}<span style={{ fontSize: 13, fontWeight: 500, color: '#8B95A1', marginLeft: 2 }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 예정 미팅 배너 */}
      {upcomingMeetings.length > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar style={{ width: 16, height: 16, color: '#2563EB', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>예정 미팅: </span>
          <span style={{ fontSize: 13, color: '#2563EB' }}>
            {upcomingMeetings.map(([name, n]) => `${name} (${n.nextMeeting})`).join(' · ')}
          </span>
        </div>
      )}

      {/* 검색 */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="고객사 검색..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#005957')}
          onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
        />
      </div>

      {/* 고객사 목록 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B95A1' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>👤</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>고객사가 없습니다</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>대시보드에서 데이터를 업로드하면 고객사 목록이 자동으로 생성됩니다</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(name => (
            <CustomerCRMCard key={name} customerName={name} onSaved={() => setRev(r => r + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}

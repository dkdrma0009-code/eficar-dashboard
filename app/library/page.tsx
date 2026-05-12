'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Copy, Check, BookOpen, Filter } from 'lucide-react';
import { getLibrary, deleteLibraryItem, type LibraryItem, type LibraryContentType } from '@/lib/libraryStorage';

const TYPE_META: Record<LibraryContentType, { label: string; emoji: string; color: string; bg: string }> = {
  linkedin: { label: 'LinkedIn',   emoji: '💼', color: '#0A66C2', bg: '#EFF6FF' },
  kakao:    { label: '카카오톡',   emoji: '💬', color: '#B45309', bg: '#FFFBEB' },
  email:    { label: '이메일',     emoji: '📧', color: '#DC2626', bg: '#FEF2F2' },
  card:     { label: '성과 카드',  emoji: '📊', color: '#005957', bg: '#E6F2F2' },
  cardnews: { label: '카드뉴스',   emoji: '🃏', color: '#6366F1', bg: '#EEF2FF' },
};

const ALL_TYPES: LibraryContentType[] = ['linkedin', 'kakao', 'email', 'card', 'cardnews'];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<LibraryContentType | 'all'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setItems(getLibrary()); }, []);

  const filtered = useMemo(() => items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q) || item.customer.toLowerCase().includes(q);
    }
    return true;
  }), [items, search, filterType]);

  function handleDelete(id: string) {
    deleteLibraryItem(id);
    setItems(getLibrary());
  }

  function handleCopy(item: LibraryItem) {
    navigator.clipboard.writeText(item.content).then(() => {
      setCopied(item.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191F28' }}>콘텐츠 라이브러리</h1>
          <p style={{ fontSize: 14, color: '#8B95A1', marginTop: 6 }}>
            생성한 콘텐츠를 저장하고 재사용하세요 · 총 {items.length}개
          </p>
        </div>

        {/* 검색 + 필터 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#8B95A1' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="제목, 내용, 고객사 검색..."
              style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #F2F4F6', borderRadius: 8, fontSize: 14, color: '#191F28', fontFamily: 'inherit', background: 'white', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', ...ALL_TYPES] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: filterType === t ? '#005957' : 'white',
                  color: filterType === t ? 'white' : '#8B95A1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {t === 'all' ? '전체' : `${TYPE_META[t].emoji} ${TYPE_META[t].label}`}
              </button>
            ))}
          </div>
        </div>

        {/* 빈 상태 */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}><BookOpen style={{ width: 48, height: 48, color: '#D1D5DB', margin: '0 auto' }} /></p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>
              {search || filterType !== 'all' ? '검색 결과가 없습니다' : '저장된 콘텐츠가 없습니다'}
            </h3>
            <p style={{ fontSize: 13, color: '#8B95A1' }}>
              콘텐츠 생성기에서 생성 후 "라이브러리에 저장" 버튼을 눌러보세요
            </p>
          </div>
        )}

        {/* 콘텐츠 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map(item => {
            const meta = TYPE_META[item.type];
            return (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color }}>
                        {meta.emoji} {meta.label}
                      </span>
                      {item.customer && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#F2F4F6', color: '#8B95A1' }}>
                          {item.customer}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: '#8B95A1', flexShrink: 0, marginTop: 2 }}>{formatDate(item.createdAt)}</span>
                </div>

                {/* 내용 미리보기 */}
                <div style={{ flex: 1, padding: '12px 14px', background: '#F8F9FA', borderRadius: 8, border: '1px solid #F2F4F6' }}>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
                    {item.content}
                  </p>
                </div>

                {/* 태그 */}
                {item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {item.tags.map(tag => (
                      <span key={tag} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, background: '#E6F2F2', color: '#005957', fontWeight: 600 }}>#{tag}</span>
                    ))}
                  </div>
                )}

                {/* 액션 */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleCopy(item)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, border: `1px solid ${copied === item.id ? '#005957' : '#F2F4F6'}`,
                    background: copied === item.id ? '#E6F2F2' : 'white',
                    color: copied === item.id ? '#005957' : '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {copied === item.id ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
                    {copied === item.id ? '복사됨' : '복사'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #F2F4F6',
                    background: 'white', color: '#F04452', fontSize: 13, cursor: 'pointer',
                  }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

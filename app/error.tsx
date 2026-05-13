'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[에픽카] 페이지 오류:', error); }, [error]);

  return (
    <main style={{
      minHeight: 'calc(100vh - 56px)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: '#F8F9FA',
    }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>⚠️</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#191F28', marginBottom: 8 }}>
          페이지를 불러오는 중 오류가 발생했습니다
        </h2>
        <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 24, maxWidth: 400, lineHeight: 1.7 }}>
          {error.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={reset} style={{
            padding: '10px 24px', borderRadius: 8, background: '#005957',
            color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            다시 시도
          </button>
          <a href="/" style={{
            padding: '10px 24px', borderRadius: 8, background: 'white',
            color: '#8B95A1', border: '1px solid #E2E8F0', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
          }}>
            홈으로
          </a>
        </div>
      </div>
    </main>
  );
}

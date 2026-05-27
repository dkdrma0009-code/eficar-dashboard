'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Copy, Check, Sparkles, FileText, ExternalLink, Send } from 'lucide-react';
import type { ActivityItem } from '@/lib/activityStorage';

interface Props {
  customer: string;
  action: 'message' | 'proposal';
  growthRate: number;
  initialContent?: string;
  onClose: () => void;
  onGenerated: (item: ActivityItem) => void;
}

export default function QuickGenerateDrawer({ customer, action, growthRate, initialContent, onClose, onGenerated }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent ?? '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'kakao',
          customer,
          currentSales: '데이터 없음',
          prevGrowth: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
          isOngoing: false,
          isB2C: false,
          totalSales: '데이터 없음',
          savingsStr: '절감액 계산 중',
          topItem: '',
          monthsActive: 0,
          missing: [],
        }),
      });
      const data = await res.json();
      if (data.text) {
        setContent(data.text);
        onGenerated({
          id: `gen_${Date.now()}`,
          type: 'message',
          customer,
          description: `${customer} 카카오 메시지 생성`,
          content: data.text,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('QuickGenerate 오류:', e);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const goToFull = (path: string) => {
    router.push(path);
    close();
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          zIndex: 200, opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />

      {/* 드로어 */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'white', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
      }}>

        {/* 헤더 */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F2F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A1', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {action === 'message' ? '빠른 메시지 생성' : 'AI 제안서 생성'}
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A2332', margin: '0 0 4px' }}>{customer}</h3>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: growthRate >= 0 ? '#059669' : '#DC2626',
              }}>
                전월 대비 {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </span>
            </div>
            <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, lineHeight: 0 }}>
              <X style={{ width: 18, height: 18, color: '#8B95A1' }} />
            </button>
          </div>
        </div>

        {/* 본문 */}
        {action === 'message' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 12, overflow: 'auto' }}>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10,
                background: loading ? '#F1F5F9' : 'linear-gradient(135deg, #005957, #00A896)',
                color: loading ? '#8B95A1' : 'white',
                border: 'none', cursor: loading ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'opacity 0.15s',
              }}
            >
              <Sparkles style={{ width: 15, height: 15 }} />
              {loading ? 'AI 생성 중...' : 'AI 메시지 자동 생성'}
            </button>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="여기에 메시지를 작성하거나 위 버튼으로 AI 생성하세요..."
              style={{
                flex: 1, minHeight: 220, borderRadius: 10,
                border: '1px solid #E2E8F0', padding: '12px 14px',
                fontSize: 13, lineHeight: 1.7, color: '#1A2332',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = '#005957')}
              onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={copy}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0',
                  background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#4A5568',
                }}
              >
                {copied
                  ? <><Check style={{ width: 14, height: 14, color: '#059669' }} /> 복사됨</>
                  : <><Copy style={{ width: 14, height: 14 }} /> 복사</>}
              </button>
              <button
                onClick={() => goToFull(`/content?customer=${encodeURIComponent(customer)}`)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 0', borderRadius: 8, border: 'none',
                  background: '#005957', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white',
                }}
              >
                <ExternalLink style={{ width: 14, height: 14 }} />
                전체 편집기로
              </button>
            </div>

            <button
              onClick={() => goToFull(`/content?customer=${encodeURIComponent(customer)}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 0', borderRadius: 8, border: '1px solid #E2E8F0',
                background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8B95A1',
              }}
            >
              <Send style={{ width: 12, height: 12 }} />
              SMS / 카카오 발송하기
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, #005957, #00A896)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,89,87,0.25)',
            }}>
              <FileText style={{ width: 30, height: 30, color: 'white' }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1A2332', margin: '0 0 8px' }}>{customer} 맞춤 제안서</p>
              <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.6, margin: 0 }}>
                고객사 실적 데이터를 분석해<br />AI가 제안서를 자동으로 작성합니다.
              </p>
            </div>
            <button
              onClick={() => goToFull(`/proposal?customer=${encodeURIComponent(customer)}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '13px 32px', borderRadius: 12,
                background: 'linear-gradient(135deg, #005957, #00A896)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(0,89,87,0.3)',
              }}
            >
              <Sparkles style={{ width: 16, height: 16 }} />
              AI 제안서 생성하기
            </button>
          </div>
        )}
      </div>
    </>
  );
}

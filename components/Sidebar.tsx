'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboardData } from '@/lib/DataContext';
import { computeViewData } from '@/lib/dataUtils';
import { useMemo } from 'react';
import {
  Zap, LayoutDashboard, Users, FileText, Sparkles,
  Image, BarChart2, Send, Calendar, BookOpen,
  GitCompare, Upload,
} from 'lucide-react';

const SECTIONS = [
  {
    label: '분석',
    items: [
      { href: '/',          label: 'AI Studio',    icon: Zap,            exact: true, alert: true },
      { href: '/dashboard', label: '매출 대시보드', icon: LayoutDashboard },
    ],
  },
  {
    label: 'AI 생성',
    items: [
      { href: '/proposal',   label: 'AI 제안서',    icon: FileText },
      { href: '/content',    label: '콘텐츠 생성',  icon: Sparkles },
      { href: '/cardnews',   label: '카드뉴스',     icon: Image },
      { href: '/targeting',  label: '타겟 메시지',  icon: Users },
      { href: '/report',     label: '월간 보고서',  icon: BarChart2 },
    ],
  },
  {
    label: '관리',
    items: [
      { href: '/campaigns', label: '캠페인',        icon: Send },
      { href: '/calendar',  label: '콘텐츠 캘린더', icon: Calendar },
      { href: '/library',   label: '라이브러리',    icon: BookOpen },
    ],
  },
  {
    label: '도구',
    items: [
      { href: '/compare', label: '고객사 비교', icon: GitCompare },
    ],
  },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, setData, setFileName, fileName } = useDashboardData();

  const alertCount = useMemo(() => {
    if (!data) return 0;
    const vd = computeViewData(data.records, data.currentMonth, data.customers, data.latestMonth);
    return vd.customerStats.filter(c => c.growthRate < -20 || c.grade === 'danger' || c.grade === 'warning').length;
  }, [data]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <aside style={{
      width: 232, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: 'white', borderRight: '1px solid #F2F4F6',
      display: 'flex', flexDirection: 'column', zIndex: 30,
    }}>

      {/* 로고 */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #F2F4F6' }}>
        <button
          onClick={() => { setData(null); setFileName(''); router.push('/'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #005957 0%, #007A77 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,89,87,0.25)',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>∞</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#191F28', lineHeight: 1.3 }}>에픽카</p>
            <p style={{ fontSize: 11, color: '#8B95A1', lineHeight: 1.3, fontWeight: 500 }}>AI 마케팅 시스템</p>
          </div>
        </button>
      </div>

      {/* 네비게이션 */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 18 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: '#B0B8C1',
              letterSpacing: '0.7px', textTransform: 'uppercase',
              padding: '0 8px', marginBottom: 3,
            }}>
              {section.label}
            </p>
            {section.items.map(item => {
              const active = isActive(item.href, 'exact' in item ? item.exact : undefined);
              const Icon = item.icon;
              const showAlert = 'alert' in item && item.alert && alertCount > 0;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 7, textDecoration: 'none',
                  background: active ? '#E6F2F2' : 'transparent',
                  color: active ? '#005957' : '#4A5568',
                  fontWeight: active ? 700 : 500, fontSize: 13,
                  marginBottom: 1, transition: 'background 0.1s',
                }}>
                  <Icon style={{ width: 14, height: 14, flexShrink: 0, opacity: active ? 1 : 0.65 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {showAlert && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: '#FEE2E2', color: '#DC2626',
                      borderRadius: 10, padding: '1px 6px', lineHeight: '16px',
                    }}>
                      {alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 파일 상태 */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #F2F4F6' }}>
        {data ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
              <span style={{
                fontSize: 11, color: '#4A5568', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {fileName || '데이터 로드됨'}
              </span>
            </div>
            <button
              onClick={() => { setData(null); setFileName(''); router.push('/'); }}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 7,
                border: '1px solid #F2F4F6', background: 'white',
                color: '#8B95A1', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <Upload style={{ width: 11, height: 11 }} /> 새 파일 업로드
            </button>
          </>
        ) : (
          <div style={{ padding: '4px 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 500 }}>데이터 없음</span>
            </div>
            <p style={{ fontSize: 11, color: '#B0B8C1', lineHeight: 1.5 }}>
              AI Studio에서 엑셀 파일을<br />업로드해주세요
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

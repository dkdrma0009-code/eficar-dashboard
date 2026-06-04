'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboardData } from '@/lib/DataContext';
import { computeViewData } from '@/lib/dataUtils';
import { getCampaigns } from '@/lib/campaignStorage';
import { useMemo, useEffect, useState } from 'react';
import {
  Zap, LayoutDashboard, Users, FileText, Sparkles,
  Image, BarChart2, Send, Calendar, BookOpen,
  GitCompare, Upload, Newspaper, History, Contact, Bell, Clock,
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
      { href: '/flyer',      label: '안내문 생성',  icon: Newspaper },
      { href: '/targeting',  label: '타겟 메시지',  icon: Users },
      { href: '/promo',      label: '정비소 프로모', icon: Newspaper },
      { href: '/report',     label: '월간 보고서',  icon: BarChart2 },
    ],
  },
  {
    label: '관리',
    items: [
      { href: '/campaigns', label: '캠페인',        icon: Send },
      { href: '/history',   label: '발송 이력',     icon: History },
      { href: '/schedule',  label: '예약 발송',     icon: Clock },
      { href: '/crm',       label: 'CRM 연락처',    icon: Contact },
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

  const [scheduledToday, setScheduledToday] = useState<string[]>([]);
  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dismissed = sessionStorage.getItem('sched-dismissed') === today;
    if (dismissed) { setDismissedToday(true); return; }
    const records = getCampaigns();
    const todayItems = records.filter(r => r.scheduledDate === today).map(r => r.customer);
    setScheduledToday(todayItems);
  }, []);

  const dismissScheduled = () => {
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem('sched-dismissed', today);
    setDismissedToday(true);
  };

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
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #F2F4F6' }}>
        <button
          onClick={() => { setData(null); setFileName(''); router.push('/'); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <img src="/eficar_logo.png" alt="에픽카" style={{ height: 22, width: 'auto', display: 'block' }} />
          <span style={{ fontSize: 10, color: '#8B95A1', fontWeight: 500 }}>AI 마케팅 시스템</span>
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

      {/* 예약 발송 알림 */}
      {scheduledToday.length > 0 && !dismissedToday && (
        <div style={{ margin: '0 10px 8px', padding: '10px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Bell style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', margin: '0 0 2px' }}>오늘 예약 발송 {scheduledToday.length}건</p>
              <p style={{ fontSize: 11, color: '#3B82F6', margin: 0, lineHeight: 1.4 }}>
                {[...new Set(scheduledToday)].slice(0, 2).join(', ')}{scheduledToday.length > 2 ? ` 외 ${scheduledToday.length - 2}건` : ''}
              </p>
            </div>
            <button onClick={dismissScheduled} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', padding: 0, lineHeight: 0 }}>
              <span style={{ fontSize: 14 }}>×</span>
            </button>
          </div>
          <Link href="/campaigns" style={{ display: 'block', marginTop: 6, fontSize: 11, fontWeight: 700, color: '#2563EB', textDecoration: 'none', textAlign: 'center', padding: '4px 0', background: 'white', borderRadius: 6 }}>
            캠페인 확인 →
          </Link>
        </div>
      )}

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

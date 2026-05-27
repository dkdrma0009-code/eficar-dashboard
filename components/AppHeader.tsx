'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboardData } from '@/lib/DataContext';

const NAV = [
  { href: '/',                    label: '대시보드' },
  { href: '/intelligence',        label: '🧠 Intelligence' },
  { href: '/operations',          label: '⚙️ Operations' },
  { href: '/collaborate',         label: '🤝 Collaborate' },
  { href: '/adaptive',            label: '📈 Adaptive' },
  { href: '/executive',           label: '🎯 Executive' },
  { href: '/platform',            label: '🌐 Platform' },
  { href: '/integrations',        label: '🔌 Integrations' },
  { href: '/content',             label: '콘텐츠 생성' },
  { href: '/cardnews',            label: '카드뉴스' },
  { href: '/targeting',           label: '🎯 타겟 메시지' },
  { href: '/library',             label: '라이브러리' },
  { href: '/calendar',            label: '캘린더' },
  { href: '/campaigns',           label: '캠페인' },
  { href: '/social-intelligence', label: '📊 소셜 분석' },
  { href: '/proposal',            label: '📋 AI 제안서' },
  { href: '/report',              label: '보고서' },
  { href: '/compare',             label: '비교' },
];

export function EficarLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img src="/eficar_logo.png" alt="에픽카" style={{ height: 26, width: 'auto' }} />
    </div>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, setData, setFileName, fileName } = useDashboardData();

  return (
    <header style={{
      background: 'white', borderBottom: '1px solid #F2F4F6',
      position: 'sticky', top: 0, zIndex: 40,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => { setData(null); setFileName(''); router.push('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <EficarLogo />
            <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>영업 대시보드</span>
          </button>

          <nav style={{ display: 'flex', gap: 2 }}>
            {NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: active ? '#E6F2F2' : 'transparent',
                  color: active ? '#005957' : '#8B95A1',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {data && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#8B95A1', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
            <button onClick={() => { setData(null); setFileName(''); }}
              className="btn-outline" style={{ height: 32, fontSize: 12 }}>
              새 파일 업로드
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

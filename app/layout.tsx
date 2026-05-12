import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: '에픽카 마케팅 대시보드',
  description: '에픽카 매출 분석 대시보드',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#F8F9FA' }}>
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}

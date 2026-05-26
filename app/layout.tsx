import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: '에픽카 AI 마케팅 시스템',
  description: '에픽카 마케터를 위한 AI 기반 운영 시스템',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#F8F9FA', margin: 0 }}>
        <Providers>
          <ErrorBoundary>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
              <Sidebar />
              <div style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
                {children}
              </div>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}

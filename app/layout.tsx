import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '에픽카 마케팅 대시보드',
  description: '에픽카 매출 분석 대시보드',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}

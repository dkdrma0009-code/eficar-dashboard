'use client';
import { DataProvider } from '@/lib/DataContext';
export default function Providers({ children }: { children: React.ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

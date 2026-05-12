'use client';
import { useEffect } from 'react';
import { DataProvider } from '@/lib/DataContext';
import { pullFromSupabase } from '@/lib/syncManager';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    pullFromSupabase().catch(console.warn);
  }, []);
  return <DataProvider>{children}</DataProvider>;
}

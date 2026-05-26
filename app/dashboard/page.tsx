'use client';

import { useDashboardData } from '@/lib/DataContext';
import Dashboard from '@/components/Dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data } = useDashboardData();
  const router = useRouter();

  useEffect(() => {
    if (!data) router.replace('/');
  }, [data, router]);

  if (!data) return null;

  return <Dashboard data={data} />;
}

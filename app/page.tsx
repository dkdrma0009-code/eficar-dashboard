'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { parseExcelFile } from '@/lib/parseExcel';
import { buildDashboardData } from '@/lib/dataUtils';
import type { DashboardData } from '@/lib/types';
import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const records = await parseExcelFile(file);
      if (records.length === 0) throw new Error('데이터를 찾을 수 없습니다. 컬럼명을 확인해주세요.');
      const dashboardData = buildDashboardData(records);
      setData(dashboardData);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setData(null);
    setFileName('');
    setError(null);
  }, []);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/sample-data.xlsx');
      const blob = await res.blob();
      const file = new File([blob], 'sample-data.xlsx', { type: blob.type });
      const records = await parseExcelFile(file);
      setData(buildDashboardData(records));
      setFileName('sample-data.xlsx (샘플)');
    } catch (err) {
      setError(err instanceof Error ? err.message : '샘플 데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1D9E75' }}>
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-gray-900 text-base hidden sm:block">에픽카</span>
            </div>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#F0FDF9', color: '#1D9E75' }}
              >
                대시보드
              </Link>
              <Link
                href="/calculator"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                절감액 계산기
              </Link>
            </nav>
          </div>
          {data && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block truncate max-w-xs">{fileName}</span>
              <button
                onClick={handleReset}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                새 파일 업로드
              </button>
            </div>
          )}
        </div>
      </header>

      {!data ? (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">매출 데이터 분석</h1>
            <p className="text-gray-500">엑셀 파일을 업로드하면 즉시 대시보드가 생성됩니다</p>
            <button
              onClick={loadSample}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1D9E75' }}
            >
              샘플 데이터로 미리보기
            </button>
          </div>
          <FileUpload onFile={handleFile} loading={loading} error={error} />
        </div>
      ) : (
        <Dashboard data={data} />
      )}
    </main>
  );
}

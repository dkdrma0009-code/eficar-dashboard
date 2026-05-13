'use client';

import { useState, useCallback } from 'react';
import { parseExcelFile } from '@/lib/parseExcel';
import { buildDashboardData } from '@/lib/dataUtils';
import { useDashboardData } from '@/lib/DataContext';
import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { data, setData, setFileName } = useDashboardData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const records = await parseExcelFile(file);
      if (records.length === 0) throw new Error('데이터를 찾을 수 없습니다. 컬럼명을 확인해주세요.');
      setData(buildDashboardData(records));
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [setData, setFileName]);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/sample-data.xlsx');
      if (!res.ok) throw new Error('샘플 파일을 불러올 수 없습니다');
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
  }, [setData, setFileName]);

  if (!data) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#191F28', marginBottom: 12 }}>
              매출 데이터 분석
            </h1>
            <p style={{ fontSize: 15, color: '#8B95A1' }}>
              엑셀 파일을 업로드하면 즉시 대시보드가 생성됩니다
            </p>
            <button onClick={loadSample} disabled={loading} className="btn-primary" style={{ marginTop: 20, opacity: loading ? 0.5 : 1 }}>
              샘플 데이터로 미리보기
            </button>
          </div>
          <FileUpload onFile={handleFile} loading={loading} error={error} />
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', background: '#F8F9FA' }}>
      <Dashboard data={data} />
    </main>
  );
}

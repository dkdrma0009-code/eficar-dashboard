'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Download } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export default function FileUpload({ onFile, loading, error }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) onFile(file);
  }, [onFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <label
        htmlFor="file-input"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: 240, borderRadius: 16, border: `2px dashed ${dragging ? '#005957' : '#E2E8F0'}`,
          cursor: loading ? 'default' : 'pointer', pointerEvents: loading ? 'none' : 'auto',
          opacity: loading ? 0.7 : 1,
          background: dragging ? '#E6F2F2' : 'white',
          transition: 'all 0.2s',
        }}
      >
        <input id="file-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={handleChange} disabled={loading} />
        {loading ? (
          <>
            <Loader2 style={{ width: 48, height: 48, color: '#005957', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, fontWeight: 600, color: '#8B95A1' }}>파일 분석 중...</p>
          </>
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#E6F2F2',
            }}>
              <Upload style={{ width: 32, height: 32, color: '#005957' }} />
            </div>
            <p style={{ marginTop: 16, fontSize: 16, fontWeight: 700, color: '#191F28' }}>
              엑셀 파일을 드래그하거나 클릭하세요
            </p>
            <p style={{ marginTop: 6, fontSize: 13, color: '#8B95A1' }}>.xlsx, .xls 파일 지원</p>
          </>
        )}
      </label>

      {error && (
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: 16, background: '#FFF0F1', border: '1px solid #FFD0D3', borderRadius: 12,
        }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#F04452', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F04452' }}>파일 처리 오류</p>
            <p style={{ fontSize: 13, color: '#F04452', marginTop: 2, opacity: 0.8 }}>{error}</p>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20, padding: '18px 20px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <FileSpreadsheet style={{ width: 18, height: 18, color: '#005957' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>필요한 컬럼 구조</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['판매일자', '서비스유형', '차량구분', '부품유형', '품목명', '판매금액'].map(col => (
            <div key={col} className="flex items-center gap-2" style={{ fontSize: 13, color: '#8B95A1' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#005957', flexShrink: 0 }} />
              {col}
            </div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: '#8B95A1' }}>
          판매일자는 2026-01 또는 2026-01-15 형식을 지원합니다
        </p>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/sample-data.xlsx" download
          className="flex items-center justify-center gap-2"
          style={{ fontSize: 13, fontWeight: 600, color: '#005957', textDecoration: 'none', display: 'inline-flex' }}>
          <Download style={{ width: 14, height: 14 }} />
          샘플 데이터 다운로드 (11개월 · 7개 고객사)
        </a>
      </div>
    </div>
  );
}

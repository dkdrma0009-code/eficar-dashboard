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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        onFile(file);
      }
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div className="max-w-xl mx-auto">
      <label
        htmlFor="file-input"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${dragging
            ? 'border-brand bg-brand-50 scale-[1.01]'
            : 'border-gray-300 bg-white hover:border-brand hover:bg-brand-50'
          }
          ${loading ? 'pointer-events-none opacity-60' : ''}
        `}
        style={dragging ? { borderColor: '#1D9E75', backgroundColor: '#E8F7F2' } : {}}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          {loading ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#1D9E75' }} />
              <p className="text-gray-600 font-medium">파일 분석 중...</p>
            </>
          ) : (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#E8F7F2' }}
              >
                <Upload className="w-8 h-8" style={{ color: '#1D9E75' }} />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-lg">
                  엑셀 파일을 드래그하거나 클릭하세요
                </p>
                <p className="text-gray-400 text-sm mt-1">.xlsx, .xls 파일 지원</p>
              </div>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium text-sm">파일 처리 오류</p>
            <p className="text-red-600 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-5 h-5" style={{ color: '#1D9E75' }} />
          <span className="font-semibold text-gray-700 text-sm">필요한 컬럼 구조</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['판매일자', '서비스유형', '차량구분', '부품유형', '품목명', '판매금액'].map(col => (
            <div key={col} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#1D9E75' }} />
              {col}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">판매일자는 2026-01 또는 2026-01-15 형식을 지원합니다</p>
      </div>

      <div className="mt-4 text-center">
        <a
          href="/sample-data.xlsx"
          download
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: '#1D9E75' }}
        >
          <Download className="w-4 h-4" />
          샘플 데이터 다운로드 (11개월 · 7개 고객사)
        </a>
      </div>
    </div>
  );
}

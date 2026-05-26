'use client';

import { useState } from 'react';
import type { CardFormInput } from '../types';

export interface KpiPreset {
  metric1?: string;
  metric2?: string;
  metric3?: string;
  targetCustomer?: string;
}

interface CardFormProps {
  onSubmit: (input: CardFormInput) => void;
  loading: boolean;
  kpiPreset?: KpiPreset;
}

export default function CardForm({ onSubmit, loading, kpiPreset }: CardFormProps) {
  const [topic, setTopic] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [metric1, setMetric1] = useState('');
  const [metric2, setMetric2] = useState('');
  const [metric3, setMetric3] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const [cardCount, setCardCount] = useState(7);

  function applyPreset() {
    if (!kpiPreset) return;
    if (kpiPreset.metric1) setMetric1(kpiPreset.metric1);
    if (kpiPreset.metric2) setMetric2(kpiPreset.metric2);
    if (kpiPreset.metric3) setMetric3(kpiPreset.metric3);
    if (kpiPreset.targetCustomer) setTargetCustomer(kpiPreset.targetCustomer);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit({
      topic: topic.trim(),
      targetCustomer: targetCustomer.trim() || undefined,
      metric1: metric1.trim() || undefined,
      metric2: metric2.trim() || undefined,
      metric3: metric3.trim() || undefined,
      keyMessage: keyMessage.trim() || undefined,
      cardCount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* KPI Preset banner */}
      {kpiPreset && (
        <div className="flex items-center justify-between bg-[#E6F2F2] border border-[#00B386]/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[#005957] text-lg">📊</span>
            <div>
              <div className="text-sm font-semibold text-[#005957]">대시보드 KPI 데이터 연동 가능</div>
              <div className="text-xs text-[#005957]/70">현재 업로드된 엑셀 기준 수치를 자동으로 채웁니다</div>
            </div>
          </div>
          <button
            type="button"
            onClick={applyPreset}
            className="text-xs font-bold text-white bg-[#005957] hover:bg-[#004745] px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            불러오기
          </button>
        </div>
      )}

      {/* Topic */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          주제 / 목적 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="예: 에픽카 대체부품 도입 후 렌터카 원가 절감 사례"
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] focus:border-transparent bg-white"
        />
      </div>

      {/* Target customer */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          대상 고객사 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <input
          type="text"
          value={targetCustomer}
          onChange={e => setTargetCustomer(e.target.value)}
          placeholder="예: SK렌터카, 롯데렌탈, 삼성화재"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] focus:border-transparent bg-white"
        />
      </div>

      {/* Metrics */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          강조 수치 <span className="text-gray-400 font-normal">(선택, 최대 3개)</span>
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={metric1}
            onChange={e => setMetric1(e.target.value)}
            placeholder="예: 매출 850% 성장"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] focus:border-transparent bg-white"
          />
          <input
            type="text"
            value={metric2}
            onChange={e => setMetric2(e.target.value)}
            placeholder="예: 1만대당 연간 1.6억 절감"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] focus:border-transparent bg-white"
          />
          <input
            type="text"
            value={metric3}
            onChange={e => setMetric3(e.target.value)}
            placeholder="예: 그린카 업무 90% 절감"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Key message */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          핵심 메시지 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <textarea
          value={keyMessage}
          onChange={e => setKeyMessage(e.target.value)}
          placeholder="예: OEM 부품 의존을 탈피해 대체부품 비중을 높이면 연간 수억 원의 원가를 절감할 수 있다"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* Card count */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          카드 장수: <span className="text-[#005957] font-bold">{cardCount}장</span>
        </label>
        <input
          type="range"
          min={3}
          max={12}
          value={cardCount}
          onChange={e => setCardCount(Number(e.target.value))}
          className="w-full accent-[#005957]"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>3장</span>
          <span>12장</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className="w-full bg-[#005957] text-white rounded-xl py-3.5 font-bold text-base hover:bg-[#004745] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI 생성 중...
          </>
        ) : (
          '카드뉴스 생성'
        )}
      </button>
    </form>
  );
}

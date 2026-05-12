'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Download, FileText, Loader2, RotateCcw } from 'lucide-react';

const BRAND = '#005957';
const BRAND_LIGHT = '#E6F2F2';
const CONTACT_EMAIL = 'info@eficar.co.kr';
const CONTACT_PHONE = '+82 10-8958-8601';

interface Param {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  format: (v: number) => string;
  parse: (s: string) => number;
}

const PARAMS: Param[] = [
  {
    id: 'vehicles', label: '보유 차량 대수', unit: '대',
    min: 100, max: 500000, step: 100, defaultValue: 10000,
    format: v => v.toLocaleString(),
    parse: s => Math.round(parseFloat(s.replace(/,/g, '')) || 0),
  },
  {
    id: 'accidentRate', label: '연간 사고율', unit: '%',
    min: 10, max: 50, step: 0.1, defaultValue: 30,
    format: v => v.toFixed(1),
    parse: s => parseFloat(s) || 0,
  },
  {
    id: 'exchangeRate', label: '부품별 교환율', unit: '%',
    min: 5, max: 40, step: 0.1, defaultValue: 21.9,
    format: v => v.toFixed(1),
    parse: s => parseFloat(s) || 0,
  },
  {
    id: 'savingsPerPart', label: '부품당 평균 절감액', unit: '원',
    min: 50000, max: 1000000, step: 10000, defaultValue: 250000,
    format: v => v.toLocaleString(),
    parse: s => Math.round(parseFloat(s.replace(/,/g, '')) || 0),
  },
  {
    id: 'supplyRate', label: '에픽카 공급률', unit: '%',
    min: 30, max: 100, step: 1, defaultValue: 85,
    format: v => v.toFixed(0),
    parse: s => parseFloat(s) || 0,
  },
];

function formatKRW(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

function formatKRWFull(n: number): string {
  return `${Math.round(n).toLocaleString()}원`;
}

interface SliderInputProps {
  param: Param;
  value: number;
  onChange: (v: number) => void;
}

function SliderInput({ param, value, onChange }: SliderInputProps) {
  const [inputStr, setInputStr] = useState('');
  const [editing, setEditing] = useState(false);

  const pct = ((value - param.min) / (param.max - param.min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{param.label}</label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editing ? inputStr : param.format(value)}
            onFocus={() => { setEditing(true); setInputStr(param.format(value)); }}
            onChange={e => setInputStr(e.target.value)}
            onBlur={() => {
              setEditing(false);
              const parsed = param.parse(inputStr);
              if (!isNaN(parsed)) {
                onChange(Math.min(param.max, Math.max(param.min, parsed)));
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-24 text-right text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:border-transparent tabular-nums"
            style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
          />
          <span className="text-sm text-gray-400 w-5">{param.unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, ${BRAND} ${pct}%, #E5E7EB ${pct}%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>{param.format(param.min)}{param.unit}</span>
        <span>{param.format(param.max)}{param.unit}</span>
      </div>
    </div>
  );
}

function CalcLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 15, lineHeight: 1 }}>∞</span>
      </div>
      <span style={{ fontSize: 17, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>에픽카</span>
    </div>
  );
}

export default function CalculatorPage() {
  const [vehicles, setVehicles] = useState(10000);
  const [accidentRate, setAccidentRate] = useState(30);
  const [exchangeRate, setExchangeRate] = useState(21.9);
  const [savingsPerPart, setSavingsPerPart] = useState(250000);
  const [supplyRate, setSupplyRate] = useState(85);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // 핵심 계산
  const calc = useMemo(() => {
    const accidentVehicles = Math.round(vehicles * accidentRate / 100);
    const exchangeCount = Math.round(accidentVehicles * exchangeRate / 100);
    const eficarCount = Math.round(exchangeCount * supplyRate / 100);
    const annual = Math.round(eficarCount * savingsPerPart);
    return {
      accidentVehicles,
      exchangeCount,
      eficarCount,
      annual,
      monthly: Math.round(annual / 12),
      perVehicle: vehicles > 0 ? Math.round(annual / vehicles) : 0,
    };
  }, [vehicles, accidentRate, exchangeRate, savingsPerPart, supplyRate]);

  function resetDefaults() {
    setVehicles(10000);
    setAccidentRate(30);
    setExchangeRate(21.9);
    setSavingsPerPart(250000);
    setSupplyRate(85);
  }

  const paramSetters: Record<string, (v: number) => void> = {
    vehicles: setVehicles,
    accidentRate: setAccidentRate,
    exchangeRate: setExchangeRate,
    savingsPerPart: setSavingsPerPart,
    supplyRate: setSupplyRate,
  };

  const paramValues: Record<string, number> = {
    vehicles, accidentRate, exchangeRate, savingsPerPart, supplyRate,
  };

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayFile = new Date().toISOString().slice(0, 10);

  async function exportPNG() {
    if (!resultRef.current) return;
    setExporting('png');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `eficar-calculator-${todayFile}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { alert('이미지 저장에 실패했습니다.'); }
    finally { setExporting(null); }
  }

  async function exportPDF() {
    if (!resultRef.current) return;
    setExporting('pdf');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');
      const canvasAspect = canvas.height / canvas.width;
      const renderedH = pdfW * canvasAspect;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, Math.min(renderedH, pdfH));
      pdf.save(`eficar-proposal-${todayFile}.pdf`);
    } catch { alert('PDF 저장에 실패했습니다.'); }
    finally { setExporting(null); }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND }}>
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-gray-900 text-base hidden sm:block">에픽카</span>
            </div>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                대시보드
              </Link>
              <Link
                href="/calculator"
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#F0FDF9', color: BRAND }}
              >
                절감액 계산기
              </Link>
            </nav>
          </div>
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            기본값으로
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">연간 절감액 계산기</h1>
          <p className="text-gray-500 mt-1 text-sm">
            차량 규모에 맞는 에픽카 도입 효과를 즉시 계산해 보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* 좌측: 입력 슬라이더 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-7">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">입력 변수</h2>
            {PARAMS.map(p => (
              <SliderInput
                key={p.id}
                param={p}
                value={paramValues[p.id]}
                onChange={paramSetters[p.id]}
              />
            ))}
          </div>

          {/* 우측: 결과 */}
          <div className="lg:col-span-3 space-y-5">

            {/* 결과 카드 3개 */}
            <div ref={resultRef} className="space-y-5">
              {/* PDF/PNG 캡처 영역 - 헤더 포함 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* 캡처용 헤더 */}
                <div
                  className="px-6 py-4"
                  style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #059669 100%)` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-white">
                      <CalcLogo />
                      <div className="text-sm opacity-85 mt-0.5">연간 절감액 계산 결과</div>
                    </div>
                    <div className="text-right text-white">
                      <div className="text-xs opacity-75">{today} 기준</div>
                      <div className="text-xs opacity-60 mt-0.5">{vehicles.toLocaleString()}대 차량 기준</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* 주요 결과 3개 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      className="rounded-2xl p-5 text-center"
                      style={{ background: `linear-gradient(135deg, ${BRAND}15, ${BRAND}08)`, border: `1.5px solid ${BRAND}30` }}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-2">연간 예상 절감액</p>
                      <p className="text-3xl font-black tabular-nums" style={{ color: BRAND }}>
                        {formatKRW(calc.annual)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatKRWFull(calc.annual)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">월간 예상 절감액</p>
                      <p className="text-2xl font-black text-gray-800 tabular-nums">{formatKRW(calc.monthly)}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatKRWFull(calc.monthly)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">1대당 연간 절감액</p>
                      <p className="text-2xl font-black text-gray-800 tabular-nums">{formatKRW(calc.perVehicle)}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatKRWFull(calc.perVehicle)}</p>
                    </div>
                  </div>

                  {/* 계산 근거 테이블 */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">계산 근거</h3>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">항목</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">수치</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">산출 근거</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[
                            {
                              label: '사고 발생 차량 수',
                              value: `${calc.accidentVehicles.toLocaleString()}대`,
                              basis: `${vehicles.toLocaleString()}대 × ${accidentRate}%`,
                            },
                            {
                              label: '대체부품 교환 건수',
                              value: `${calc.exchangeCount.toLocaleString()}건`,
                              basis: `사고 ${calc.accidentVehicles.toLocaleString()}대 × ${exchangeRate}%`,
                            },
                            {
                              label: '에픽카 공급 건수',
                              value: `${calc.eficarCount.toLocaleString()}건`,
                              basis: `교환 ${calc.exchangeCount.toLocaleString()}건 × ${supplyRate}%`,
                            },
                            {
                              label: '건당 평균 절감액',
                              value: formatKRWFull(savingsPerPart),
                              basis: 'OEM 대비 절감 단가',
                            },
                            {
                              label: '연간 총 절감액',
                              value: formatKRW(calc.annual),
                              basis: `${calc.eficarCount.toLocaleString()}건 × ${formatKRW(savingsPerPart)}`,
                              highlight: true,
                            },
                          ].map(row => (
                            <tr
                              key={row.label}
                              className={row.highlight ? 'bg-green-50' : 'hover:bg-gray-50'}
                            >
                              <td className={`px-4 py-2.5 ${row.highlight ? 'font-semibold text-green-800' : 'text-gray-700'}`}>
                                {row.label}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${row.highlight ? 'text-green-700' : 'text-gray-900'}`}>
                                {row.value}
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs text-gray-400 tabular-nums">
                                {row.basis}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SK렌터카 검증 케이스 */}
                  <div
                    className="rounded-xl p-4 flex items-start gap-3"
                    style={{ backgroundColor: '#F0FDF9', border: `1px solid ${BRAND_LIGHT}` }}
                  >
                    <span className="text-lg mt-0.5">✓</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: BRAND }}>
                        SK렌터카 실제 사례
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        195,134대 적용 시 연간 <strong>32.8억원</strong> 절감 달성
                      </p>
                    </div>
                  </div>

                  {/* 연락처 */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      본 계산 결과는 추정치이며 실제 수치는 차이가 있을 수 있습니다
                    </p>
                    <p className="text-xs text-gray-400 text-right ml-4 flex-shrink-0">
                      {CONTACT_EMAIL}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 내보내기 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={exportPNG}
                disabled={exporting !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-50"
              >
                {exporting === 'png'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
                결과 이미지 저장 (PNG)
              </button>
              <button
                onClick={exportPDF}
                disabled={exporting !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                {exporting === 'pdf'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <FileText className="w-4 h-4" />}
                제안서 PDF 저장 (A4)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 슬라이더 스타일 */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${BRAND};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          margin-top: -8px;
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${BRAND};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        input[type='range']::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 9999px;
        }
        input[type='range']::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          background: #E5E7EB;
        }
      `}</style>
    </main>
  );
}

'use client';

import { useState } from 'react';
import type { GeneratedCard, CardRatio } from '../types';
import { RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface ExportBarProps {
  cards: GeneratedCard[];
  ratio: CardRatio;
  topic: string;
}

type ExportFormat = 'PNG' | 'JPG' | 'PDF' | 'PPT' | 'ZIP' | 'IG';

interface IgPost {
  postId: string;
  permalink: string;
  caption: string;
  topic: string;
  uploadedAt: string;
  cardCount: number;
}

export default function ExportBar({ cards, ratio, topic }: ExportBarProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [igModal, setIgModal] = useState(false);
  const [igCaption, setIgCaption] = useState('');
  const [igProgress, setIgProgress] = useState('');
  const [igResult, setIgResult] = useState<{ permalink: string } | null>(null);

  const cardWidth = CARD_WIDTH;
  const cardHeight = Math.round(cardWidth * RATIO_HEIGHT[ratio]);

  async function captureCard(index: number): Promise<HTMLCanvasElement> {
    const { default: html2canvas } = await import('html2canvas');
    const el = document.getElementById(`card-export-${index}`);
    if (!el) throw new Error(`Card element not found: ${index}`);
    return html2canvas(el, {
      width: cardWidth,
      height: cardHeight,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });
  }

  async function exportPNG() {
    setExporting('PNG');
    try {
      for (let i = 0; i < cards.length; i++) {
        const canvas = await captureCard(i);
        const link = document.createElement('a');
        link.download = `eficar-card-${i + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } finally { setExporting(null); }
  }

  async function exportJPG() {
    setExporting('JPG');
    try {
      for (let i = 0; i < cards.length; i++) {
        const canvas = await captureCard(i);
        const link = document.createElement('a');
        link.download = `eficar-card-${i + 1}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.click();
      }
    } finally { setExporting(null); }
  }

  async function exportPDF() {
    setExporting('PDF');
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: cardWidth > cardHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [cardWidth, cardHeight],
      });
      for (let i = 0; i < cards.length; i++) {
        if (i > 0) pdf.addPage([cardWidth, cardHeight]);
        const canvas = await captureCard(i);
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, cardWidth, cardHeight);
      }
      pdf.save(`eficar-cardnews-${topic.slice(0, 20)}.pdf`);
    } finally { setExporting(null); }
  }

  async function exportPPT() {
    setExporting('PPT');
    try {
      const pptxgenjs = await import('pptxgenjs');
      const PptxGenJS = pptxgenjs.default;
      const pptx = new PptxGenJS();
      const inchW = cardWidth / 96;
      const inchH = cardHeight / 96;
      pptx.defineLayout({ name: 'CUSTOM', width: inchW, height: inchH });
      pptx.layout = 'CUSTOM';
      for (let i = 0; i < cards.length; i++) {
        const canvas = await captureCard(i);
        const slide = pptx.addSlide();
        slide.addImage({ data: canvas.toDataURL('image/jpeg', 0.95), x: 0, y: 0, w: inchW, h: inchH });
      }
      await pptx.writeFile({ fileName: `eficar-cardnews-${topic.slice(0, 20)}.pptx` });
    } finally { setExporting(null); }
  }

  async function exportZIP() {
    setExporting('ZIP');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder('eficar-cardnews')!;
      for (let i = 0; i < cards.length; i++) {
        const canvas = await captureCard(i);
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        folder.file(`card-${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `eficar-cardnews-${topic.slice(0, 20)}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } finally { setExporting(null); }
  }

  async function uploadToInstagram() {
    setExporting('IG');
    setIgResult(null);
    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < cards.length; i++) {
        setIgProgress(`이미지 캡처 중... (${i + 1}/${cards.length})`);
        const canvas = await captureCard(i);
        const base64 = canvas.toDataURL('image/png');
        setIgProgress(`업로드 중... (${i + 1}/${cards.length})`);
        const res = await fetch('/api/instagram/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, filename: `${Date.now()}-card-${i + 1}.png` }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? '이미지 업로드 실패');
        imageUrls.push(data.url!);
      }
      setIgProgress('인스타그램에 게시 중...');
      const res = await fetch('/api/instagram/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls, caption: igCaption }),
      });
      const data = await res.json() as { postId?: string; permalink?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? '게시 실패');

      const posts: IgPost[] = JSON.parse(localStorage.getItem('eficar-ig-posts') ?? '[]');
      posts.unshift({
        postId: data.postId!,
        permalink: data.permalink!,
        caption: igCaption,
        topic,
        uploadedAt: new Date().toISOString(),
        cardCount: cards.length,
      });
      localStorage.setItem('eficar-ig-posts', JSON.stringify(posts));
      setIgResult({ permalink: data.permalink! });
      setIgProgress('');
    } catch (e) {
      setIgProgress(`❌ ${e instanceof Error ? e.message : '업로드 실패'}`);
    } finally {
      setExporting(null);
    }
  }

  const BUTTONS: { format: ExportFormat; label: string; action: () => void; color: string }[] = [
    { format: 'PNG', label: 'PNG', action: exportPNG, color: 'bg-gray-800 hover:bg-gray-700' },
    { format: 'JPG', label: 'JPG', action: exportJPG, color: 'bg-gray-600 hover:bg-gray-500' },
    { format: 'PDF', label: 'PDF', action: exportPDF, color: 'bg-red-600 hover:bg-red-500' },
    { format: 'PPT', label: 'PPT', action: exportPPT, color: 'bg-orange-600 hover:bg-orange-500' },
    { format: 'ZIP', label: 'ZIP', action: exportZIP, color: 'bg-[#005957] hover:bg-[#004745]' },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {BUTTONS.map(({ format, label, action, color }) => (
          <button
            key={format}
            onClick={action}
            disabled={exporting !== null}
            className={`${color} text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {exporting === format ? (
              <><span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{label}...</>
            ) : (
              <><span>↓</span>{label}</>
            )}
          </button>
        ))}

        <button
          onClick={() => { setIgModal(true); setIgResult(null); setIgProgress(''); }}
          disabled={exporting !== null}
          className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          📸 인스타 업로드
        </button>
      </div>

      {igModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) setIgModal(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">인스타그램 업로드</h3>
              <button onClick={() => setIgModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5">카드 {cards.length}장 · {ratio} 비율</p>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">캡션</label>
              <textarea
                value={igCaption}
                onChange={e => setIgCaption(e.target.value)}
                rows={4}
                placeholder={`에픽카 카드뉴스 캡션을 입력하세요.\n\n#에픽카 #대체부품 #렌터카 #원가절감`}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{igCaption.length}/2200자</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['#에픽카', '#대체부품', '#렌터카', '#원가절감', '#헤드램프', '#자동차부품'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setIgCaption(p => p ? `${p} ${tag}` : tag)}
                  className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors"
                >{tag}</button>
              ))}
            </div>
            {igProgress && (
              <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${igProgress.startsWith('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {!igProgress.startsWith('❌') && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />}
                {igProgress}
              </div>
            )}
            {igResult && (
              <div className="mb-3 p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm font-bold text-green-700 mb-1">업로드 완료!</p>
                <a href={igResult.permalink} target="_blank" rel="noreferrer" className="text-xs text-green-600 underline">인스타에서 확인하세요 →</a>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setIgModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">취소</button>
              <button
                onClick={uploadToInstagram}
                disabled={exporting === 'IG' || !!igResult}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {exporting === 'IG' ? '업로드 중...' : igResult ? '완료' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

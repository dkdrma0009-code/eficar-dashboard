'use client';

import { useState } from 'react';
import type { CardItem, CardRatio } from '../types';
import { RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface ExportBarProps {
  cards: CardItem[];
  ratio: CardRatio;
  topic: string;
}

type ExportFormat = 'PNG' | 'JPG' | 'PDF' | 'PPT' | 'ZIP';

export default function ExportBar({ cards, ratio, topic }: ExportBarProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

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
    } finally {
      setExporting(null);
    }
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
    } finally {
      setExporting(null);
    }
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
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, cardWidth, cardHeight);
      }

      pdf.save(`eficar-cardnews-${topic.slice(0, 20)}.pdf`);
    } finally {
      setExporting(null);
    }
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
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const slide = pptx.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: inchW, h: inchH });
      }

      await pptx.writeFile({ fileName: `eficar-cardnews-${topic.slice(0, 20)}.pptx` });
    } finally {
      setExporting(null);
    }
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
    <div className="flex flex-wrap gap-2">
      {BUTTONS.map(({ format, label, action, color }) => (
        <button
          key={format}
          onClick={action}
          disabled={exporting !== null}
          className={`${color} text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {exporting === format ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {label}...
            </>
          ) : (
            <>
              <span>↓</span>
              {label}
            </>
          )}
        </button>
      ))}
    </div>
  );
}

'use client';

import type { BigNumberData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: BigNumberData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function BigNumberLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.072;
  const fs = (r: number) => cardWidth * r;

  const numLen = String(data.number ?? '').length;
  const numSize = numLen <= 3 ? fs(0.26) : numLen <= 5 ? fs(0.20) : fs(0.15);

  return (
    <div style={{
      width: cardWidth, height: cardHeight,
      background: '#FFFFFF',
      fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
      position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: PALETTE.accent }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: p, right: p, opacity: 0.5 }}>
        <img src="/eficar_logo.png" alt="에픽카" style={{ height: fs(0.040), width: 'auto' }} />
      </div>

      {/* Headline */}
      {data.desc && (
        <div style={{
          position: 'absolute', top: p * 1.1, left: p, right: p * 3.5,
          fontSize: fs(0.036), fontWeight: 900,
          color: '#191F28', lineHeight: 1.3, letterSpacing: '-0.02em',
        }}>
          {data.desc}
        </div>
      )}

      {/* KPI tile */}
      <div style={{
        position: 'absolute',
        left: p, right: p,
        top: '50%', transform: 'translateY(-50%)',
        background: '#E8F5F2',
        borderRadius: fs(0.028),
        padding: `${fs(0.04)}px ${fs(0.04)}px`,
        border: `1px solid rgba(0,89,87,0.12)`,
      }}>
        {/* Bracket tag */}
        {data.tag && (
          <div style={{
            fontSize: fs(0.018), fontWeight: 700,
            color: PALETTE.accent, marginBottom: fs(0.012),
            letterSpacing: '0.02em',
          }}>
            [{data.tag}]
          </div>
        )}

        {/* Giant number */}
        <div style={{
          fontSize: numSize, fontWeight: 900,
          color: PALETTE.accent, lineHeight: 0.9,
          letterSpacing: '-0.04em',
          display: 'flex', alignItems: 'baseline', gap: fs(0.012),
        }}>
          {data.number}
          {data.unit && (
            <span style={{
              fontSize: numSize * 0.4, fontWeight: 800,
              color: PALETTE.accent, letterSpacing: '-0.02em',
            }}>
              {data.unit}
            </span>
          )}
        </div>
      </div>

      {/* Footer logo */}
      <div style={{ position: 'absolute', bottom: p, left: p, opacity: 0.3 }}>
        <img src="/eficar_logo.png" alt="에픽카" style={{ height: fs(0.034), width: 'auto' }} />
      </div>
    </div>
  );
}

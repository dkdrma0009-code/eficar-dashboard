'use client';

import type { CoverData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: CoverData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function CoverLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.072;
  const fs = (r: number) => cardWidth * r;

  // Split layout: left white (60%) + right green (40%)
  const splitX = cardWidth * 0.6;

  return (
    <div style={{
      width: cardWidth, height: cardHeight,
      background: '#FFFFFF',
      fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
      position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Right green panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: cardWidth * 0.42,
        background: `linear-gradient(145deg, ${PALETTE.accent} 0%, #007A77 100%)`,
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -cardWidth * 0.1, right: -cardWidth * 0.08,
          width: cardWidth * 0.35, height: cardWidth * 0.35,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -cardWidth * 0.08, left: -cardWidth * 0.06,
          width: cardWidth * 0.28, height: cardWidth * 0.28,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }} />

        {/* Highlight box on green panel */}
        {data.highlight && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: fs(0.016), fontWeight: 700,
              color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em',
              marginBottom: fs(0.012),
            }}>
              핵심 성과
            </div>
            <div style={{
              fontSize: fs(0.062), fontWeight: 900,
              color: '#FFFFFF', lineHeight: 0.9,
              letterSpacing: '-0.03em',
            }}>
              {data.highlight}
            </div>
          </div>
        )}
      </div>

      {/* Left white content */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: splitX,
        padding: `${p}px`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {/* Logo + badge */}
        <div>
          <img src="/eficar_logo.png" alt="에픽카" style={{ height: fs(0.05), width: 'auto' }} />
          {data.badge && (
            <div style={{
              display: 'inline-block',
              marginTop: fs(0.018),
              background: '#E8F5F2',
              border: `1px solid rgba(0,89,87,0.2)`,
              borderRadius: 100,
              padding: `${fs(0.007)}px ${fs(0.018)}px`,
              fontSize: fs(0.016), fontWeight: 700,
              color: PALETTE.accent,
            }}>
              {data.badge}
            </div>
          )}
        </div>

        {/* Headline */}
        <div>
          <div style={{
            width: fs(0.06), height: 3,
            background: PALETTE.accent, borderRadius: 2,
            marginBottom: fs(0.018),
          }} />
          <div style={{
            fontSize: fs(0.054), fontWeight: 900,
            color: '#191F28', lineHeight: 1.2,
            letterSpacing: '-0.025em', whiteSpace: 'pre-wrap',
          }}>
            {data.headline}
          </div>
          {data.subheadline && (
            <div style={{
              fontSize: fs(0.022), fontWeight: 500,
              color: PALETTE.subtext, marginTop: fs(0.016), lineHeight: 1.4,
            }}>
              {data.subheadline}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{
          fontSize: fs(0.014), color: PALETTE.subtext,
          fontWeight: 600, letterSpacing: '0.04em',
        }}>
          eficar.co.kr
        </div>
      </div>
    </div>
  );
}

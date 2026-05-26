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
  const p = cardWidth * 0.07;
  const fs = (r: number) => cardWidth * r;

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        background: `linear-gradient(145deg, #002E2D 0%, ${PALETTE.accent} 50%, #007A77 100%)`,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: -cardWidth * 0.2,
          right: -cardWidth * 0.1,
          width: cardWidth * 0.55,
          height: cardWidth * 0.55,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -cardWidth * 0.15,
          left: -cardWidth * 0.08,
          width: cardWidth * 0.45,
          height: cardWidth * 0.45,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${PALETTE.accentBright}, transparent)`,
        }}
      />

      {/* Header: Logo + Badge */}
      <div
        style={{
          position: 'absolute',
          top: p,
          left: p,
          right: p,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(0.018) }}>
          <div
            style={{
              width: fs(0.055),
              height: fs(0.055),
              borderRadius: fs(0.015),
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: PALETTE.white, fontWeight: 900, fontSize: fs(0.034), lineHeight: 1 }}>∞</span>
          </div>
          <span style={{ color: PALETTE.white, fontWeight: 800, fontSize: fs(0.038), letterSpacing: '-0.02em' }}>
            에픽카
          </span>
        </div>

        {/* Badge */}
        {data.badge && (
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 100,
              padding: `${fs(0.012)}px ${fs(0.026)}px`,
              fontSize: fs(0.020),
              color: PALETTE.white,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {data.badge}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'absolute',
          left: p,
          right: p,
          top: cardHeight * 0.22,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: fs(0.1),
            height: 3,
            background: PALETTE.accentBright,
            borderRadius: 2,
            marginBottom: fs(0.025),
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontSize: fs(0.075),
            fontWeight: 900,
            color: PALETTE.white,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            whiteSpace: 'pre-wrap',
            marginBottom: fs(0.02),
          }}
        >
          {data.headline}
        </div>

        {/* Subheadline */}
        {data.subheadline && (
          <div
            style={{
              fontSize: fs(0.026),
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.4,
              marginTop: fs(0.015),
            }}
          >
            {data.subheadline}
          </div>
        )}
      </div>

      {/* Highlight */}
      {data.highlight && (
        <div
          style={{
            position: 'absolute',
            bottom: p,
            left: p,
            right: p,
            display: 'flex',
            alignItems: 'center',
            gap: fs(0.018),
          }}
        >
          <div
            style={{
              background: 'rgba(0,179,134,0.25)',
              border: `1px solid ${PALETTE.accentBright}`,
              borderRadius: fs(0.015),
              padding: `${fs(0.018)}px ${fs(0.028)}px`,
            }}
          >
            <div style={{ fontSize: fs(0.016), color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: fs(0.005) }}>
              핵심 성과
            </div>
            <div
              style={{
                fontSize: fs(0.052),
                fontWeight: 900,
                color: PALETTE.accentBright,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {data.highlight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

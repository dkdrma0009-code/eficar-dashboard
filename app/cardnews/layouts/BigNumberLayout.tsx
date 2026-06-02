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
  const p = cardWidth * 0.075;
  const fs = (r: number) => cardWidth * r;

  // Font size: large for short numbers, smaller for longer ones
  const numLen = String(data.number ?? '').length;
  const numSize = numLen <= 3 ? fs(0.28) : numLen <= 5 ? fs(0.22) : fs(0.16);

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        background: '#0F1923',
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Atmospheric glow — behind number */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '-15%',
          width: cardWidth * 0.9,
          height: cardWidth * 0.9,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(0,179,134,0.11) 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Ghost number — huge faded overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: -cardWidth * 0.06,
          transform: 'translateY(-50%)',
          fontSize: cardWidth * 0.72,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.03)',
          lineHeight: 1,
          letterSpacing: '-0.06em',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {data.number}
      </div>

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

      {/* Logo + tag row */}
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
        <div style={{ opacity: 0.55 }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: fs(0.040), width: 'auto' }} />
        </div>
        {data.tag && (
          <div
            style={{
              background: 'rgba(0,179,134,0.18)',
              border: '1px solid rgba(0,179,134,0.28)',
              borderRadius: 100,
              padding: `${fs(0.008)}px ${fs(0.020)}px`,
              fontSize: fs(0.016),
              color: PALETTE.accentBright,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            {data.tag}
          </div>
        )}
      </div>

      {/* Giant Number — left-anchored, ~40% from top */}
      <div
        style={{
          position: 'absolute',
          left: p,
          top: cardHeight * 0.34,
        }}
      >
        <div
          style={{
            fontSize: numSize,
            fontWeight: 900,
            color: PALETTE.white,
            lineHeight: 0.84,
            letterSpacing: '-0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {data.number}
          {data.unit && (
            <span
              style={{
                fontSize: numSize * 0.38,
                fontWeight: 800,
                color: PALETTE.accentBright,
                marginLeft: fs(0.018),
                letterSpacing: '-0.02em',
              }}
            >
              {data.unit}
            </span>
          )}
        </div>
      </div>

      {/* Thin rule + desc — bottom */}
      {data.desc && (
        <div
          style={{
            position: 'absolute',
            bottom: p,
            left: p,
            right: p,
          }}
        >
          <div
            style={{
              width: fs(0.10),
              height: 1.5,
              background: PALETTE.accentBright,
              borderRadius: 2,
              marginBottom: fs(0.018),
              opacity: 0.6,
            }}
          />
          <div
            style={{
              fontSize: fs(0.026),
              fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.5,
            }}
          >
            {data.desc}
          </div>
        </div>
      )}
    </div>
  );
}

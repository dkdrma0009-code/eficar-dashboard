'use client';

import type { QuoteData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: QuoteData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function QuoteLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.08;
  const fs = (r: number) => cardWidth * r;

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        background: PALETTE.dark,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: -cardWidth * 0.15,
          left: -cardWidth * 0.1,
          width: cardWidth * 0.5,
          height: cardWidth * 0.5,
          borderRadius: '50%',
          background: 'rgba(0,89,87,0.15)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -cardWidth * 0.1,
          right: -cardWidth * 0.08,
          width: cardWidth * 0.4,
          height: cardWidth * 0.4,
          borderRadius: '50%',
          background: 'rgba(0,179,134,0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo top-right */}
      <div
        style={{
          position: 'absolute',
          top: p,
          right: p,
          display: 'flex',
          alignItems: 'center',
          gap: fs(0.012),
          opacity: 0.4,
        }}
      >
        <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: fs(0.038), width: 'auto' }} />
      </div>

      {/* Quote mark */}
      <div
        style={{
          position: 'absolute',
          top: p * 0.8,
          left: p,
          fontSize: fs(0.22),
          fontWeight: 900,
          color: PALETTE.accent,
          lineHeight: 1,
          opacity: 0.6,
          fontFamily: 'Georgia, serif',
        }}
      >
        &ldquo;
      </div>

      {/* Content area */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: `0 ${p * 1.2}px`,
          textAlign: 'center' as const,
        }}
      >
        {/* Context tag */}
        {data.context && (
          <div
            style={{
              display: 'inline-block',
              background: `rgba(0,89,87,0.3)`,
              border: `1px solid rgba(0,179,134,0.3)`,
              borderRadius: 100,
              padding: `${fs(0.008)}px ${fs(0.022)}px`,
              fontSize: fs(0.018),
              color: PALETTE.accentBright,
              fontWeight: 700,
              marginBottom: fs(0.03),
              letterSpacing: '0.06em',
            }}
          >
            {data.context}
          </div>
        )}

        {/* Quote text */}
        <div
          style={{
            fontSize: fs(0.042),
            fontWeight: 800,
            color: PALETTE.white,
            lineHeight: 1.45,
            letterSpacing: '-0.02em',
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.quote}
        </div>

        {/* Divider */}
        <div
          style={{
            width: fs(0.06),
            height: 2,
            background: PALETTE.accentBright,
            borderRadius: 2,
            margin: `${fs(0.028)}px auto`,
          }}
        />

        {/* Attribution */}
        {data.attribution && (
          <div
            style={{
              fontSize: fs(0.022),
              fontWeight: 600,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.02em',
            }}
          >
            {data.attribution}
          </div>
        )}
      </div>

      {/* Bottom closing quote */}
      <div
        style={{
          position: 'absolute',
          bottom: p * 0.5,
          right: p,
          fontSize: fs(0.22),
          fontWeight: 900,
          color: PALETTE.accent,
          lineHeight: 1,
          opacity: 0.3,
          fontFamily: 'Georgia, serif',
          transform: 'rotate(180deg)',
        }}
      >
        &ldquo;
      </div>
    </div>
  );
}

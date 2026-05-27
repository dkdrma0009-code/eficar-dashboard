'use client';

import type { CTAData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: CTAData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function CTALayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
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
          top: -cardWidth * 0.18,
          right: -cardWidth * 0.12,
          width: cardWidth * 0.55,
          height: cardWidth * 0.55,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -cardWidth * 0.12,
          left: -cardWidth * 0.08,
          width: cardWidth * 0.44,
          height: cardWidth * 0.44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: cardHeight * 0.3,
          right: cardWidth * 0.1,
          width: cardWidth * 0.18,
          height: cardWidth * 0.18,
          borderRadius: '50%',
          background: 'rgba(0,229,176,0.12)',
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

      {/* Logo + subheadline */}
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: fs(0.052), width: 'auto' }} />
        </div>

        {data.subheadline && (
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 100,
              padding: `${fs(0.010)}px ${fs(0.022)}px`,
              fontSize: fs(0.018),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.06em',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {data.subheadline}
          </div>
        )}
      </div>

      {/* Main headline */}
      <div
        style={{
          position: 'absolute',
          left: p,
          right: p,
          top: cardHeight * 0.3,
        }}
      >
        <div
          style={{
            fontSize: fs(0.068),
            fontWeight: 900,
            color: PALETTE.white,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.headline}
        </div>
        <div
          style={{
            width: fs(0.08),
            height: 2,
            background: 'rgba(255,255,255,0.35)',
            borderRadius: 2,
            marginTop: fs(0.022),
          }}
        />
      </div>

      {/* Contact boxes */}
      <div
        style={{
          position: 'absolute',
          bottom: p,
          left: p,
          right: p,
          display: 'flex',
          gap: fs(0.018),
        }}
      >
        {data.contact1 && (
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.14)',
              borderRadius: fs(0.018),
              border: '1px solid rgba(255,255,255,0.2)',
              padding: `${fs(0.020)}px ${fs(0.018)}px`,
            }}
          >
            <div
              style={{
                fontSize: fs(0.013),
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase' as const,
                marginBottom: fs(0.007),
              }}
            >
              이메일
            </div>
            <div
              style={{
                fontSize: fs(0.020),
                fontWeight: 700,
                color: PALETTE.white,
                letterSpacing: '-0.01em',
              }}
            >
              {data.contact1}
            </div>
          </div>
        )}
        {data.contact2 && (
          <div
            style={{
              flex: 1,
              background: 'rgba(0,229,176,0.18)',
              borderRadius: fs(0.018),
              border: '1px solid rgba(0,229,176,0.3)',
              padding: `${fs(0.020)}px ${fs(0.018)}px`,
            }}
          >
            <div
              style={{
                fontSize: fs(0.013),
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase' as const,
                marginBottom: fs(0.007),
              }}
            >
              전화
            </div>
            <div
              style={{
                fontSize: fs(0.020),
                fontWeight: 700,
                color: PALETTE.white,
                letterSpacing: '-0.01em',
              }}
            >
              {data.contact2}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import type { ListData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

const BULLETS = ['①', '②', '③', '④'];

interface Props {
  data: ListData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function ListLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.07;
  const fs = (r: number) => cardWidth * r;
  const items = data.items.slice(0, 4);

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        background: PALETTE.white,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentBright})`,
        }}
      />

      {/* Background decorative element */}
      <div
        style={{
          position: 'absolute',
          bottom: -cardWidth * 0.05,
          right: -cardWidth * 0.05,
          width: cardWidth * 0.3,
          height: cardWidth * 0.3,
          borderRadius: '50%',
          background: 'rgba(0,89,87,0.05)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: p,
          right: p,
          display: 'flex',
          alignItems: 'center',
          gap: fs(0.012),
          opacity: 0.5,
        }}
      >
        <div
          style={{
            width: fs(0.038),
            height: fs(0.038),
            borderRadius: fs(0.010),
            background: PALETTE.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: PALETTE.white, fontWeight: 900, fontSize: fs(0.024), lineHeight: 1 }}>∞</span>
        </div>
        <span style={{ color: PALETTE.dark, fontWeight: 800, fontSize: fs(0.026) }}>에픽카</span>
      </div>

      {/* Headline */}
      <div
        style={{
          position: 'absolute',
          top: p * 1.2,
          left: p,
          right: p * 3,
        }}
      >
        <div
          style={{
            fontSize: fs(0.042),
            fontWeight: 900,
            color: PALETTE.accent,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.headline}
        </div>
        <div
          style={{
            width: fs(0.06),
            height: 3,
            background: PALETTE.accentBright,
            borderRadius: 2,
            marginTop: fs(0.018),
          }}
        />
      </div>

      {/* List items */}
      <div
        style={{
          position: 'absolute',
          left: p,
          right: p,
          top: cardHeight * 0.28,
          bottom: p,
          display: 'flex',
          flexDirection: 'column',
          gap: fs(0.018),
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: fs(0.022),
              background: i % 2 === 0 ? 'rgba(0,89,87,0.04)' : PALETTE.lightBg,
              borderRadius: fs(0.018),
              padding: `${fs(0.022)}px ${fs(0.026)}px`,
              border: i === 0 ? `1px solid rgba(0,89,87,0.15)` : `1px solid ${PALETTE.border}`,
            }}
          >
            <span
              style={{
                fontSize: fs(0.034),
                fontWeight: 900,
                color: PALETTE.accent,
                lineHeight: 1,
                flexShrink: 0,
                marginTop: fs(0.002),
              }}
            >
              {BULLETS[i]}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: fs(0.026),
                  fontWeight: 800,
                  color: PALETTE.dark,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                  marginBottom: item.desc ? fs(0.006) : 0,
                }}
              >
                {item.title}
              </div>
              {item.desc && (
                <div
                  style={{
                    fontSize: fs(0.020),
                    fontWeight: 400,
                    color: PALETTE.subtext,
                    lineHeight: 1.45,
                  }}
                >
                  {item.desc}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

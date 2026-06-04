'use client';

import type { ListData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: ListData;
  ratio: CardRatio;
  cardWidth?: number;
}

const NUM_COLORS = ['#005957', '#007A77', '#009E8E', '#00B386'];

export default function ListLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.07;
  const fs = (r: number) => cardWidth * r;
  const items = data.items.slice(0, 4);
  const itemH = (cardHeight - p * 2 - fs(0.13)) / Math.max(items.length, 1);

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
      {/* Top gradient header band */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: cardHeight * 0.185,
          background: `linear-gradient(135deg, #002E2D 0%, ${PALETTE.accent} 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -cardWidth * 0.04,
          right: -cardWidth * 0.04,
          width: cardWidth * 0.22,
          height: cardWidth * 0.22,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: p * 0.85,
          left: p,
          right: p,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: fs(0.012),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              marginBottom: fs(0.005),
            }}
          >
            핵심 포인트
          </div>
          <div
            style={{
              fontSize: fs(0.032),
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              whiteSpace: 'pre-wrap',
            }}
          >
            {data.headline}
          </div>
        </div>
        <div style={{ opacity: 0.7 }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: fs(0.042), width: 'auto' }} />
        </div>
      </div>

      {/* List items */}
      <div
        style={{
          position: 'absolute',
          top: cardHeight * 0.20,
          left: p,
          right: p,
          bottom: p * 0.8,
          display: 'flex',
          flexDirection: 'column',
          gap: fs(0.018),
        }}
      >
        {items.map((item, i) => {
          const color = NUM_COLORS[i] ?? PALETTE.accent;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: fs(0.026),
                background: '#F8FAFC',
                borderRadius: fs(0.018),
                border: `1px solid #EDF1F7`,
                padding: `${fs(0.018)}px ${fs(0.026)}px`,
                borderLeft: `4px solid ${color}`,
                maxHeight: itemH,
              }}
            >
              {/* Number */}
              <div
                style={{
                  fontSize: fs(0.040),
                  fontWeight: 900,
                  color: color,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  flexShrink: 0,
                  width: fs(0.042),
                  textAlign: 'right' as const,
                }}
              >
                {i + 1}
              </div>

              {/* Divider */}
              <div style={{ width: 1, alignSelf: 'stretch', background: '#E2E8F0', flexShrink: 0 }} />

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: fs(0.026),
                    fontWeight: 800,
                    color: PALETTE.dark,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    marginBottom: item.desc ? fs(0.005) : 0,
                  }}
                >
                  {item.title}
                </div>
                {item.desc && (
                  <div
                    style={{
                      fontSize: fs(0.019),
                      fontWeight: 400,
                      color: PALETTE.subtext,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.desc}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

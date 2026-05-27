'use client';

import type { CustomerCaseData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

const ACCENT_COLORS = ['#005957', '#007A77', '#009E8E', '#00B386'];

interface Props {
  data: CustomerCaseData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function CustomerCaseLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.065;
  const fs = (r: number) => cardWidth * r;
  const cases = data.cases.slice(0, 4);

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
      {/* Dark header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: cardHeight * 0.20,
          background: `linear-gradient(135deg, #002E2D 0%, ${PALETTE.accent} 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -cardWidth * 0.06,
          right: -cardWidth * 0.05,
          width: cardWidth * 0.30,
          height: cardWidth * 0.30,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
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
              fontSize: fs(0.013),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              marginBottom: fs(0.006),
            }}
          >
            파트너사 실적
          </div>
          <div
            style={{
              fontSize: fs(0.034),
              fontWeight: 900,
              color: PALETTE.white,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {data.headline}
          </div>
        </div>
        <div style={{ opacity: 0.85 }}>
          <img src="/eficar_logo_white.png" alt="에픽카" style={{ height: fs(0.044), width: 'auto' }} />
        </div>
      </div>

      {/* Case rows */}
      <div
        style={{
          position: 'absolute',
          top: cardHeight * 0.22,
          left: p,
          right: p,
          bottom: p,
        }}
      >
        {cases.map((c, i) => {
          const rowH = (cardHeight * 0.72) / Math.max(cases.length, 1);
          const color = ACCENT_COLORS[i] ?? PALETTE.accent;
          return (
            <div
              key={i}
              style={{
                height: rowH,
                display: 'flex',
                alignItems: 'center',
                borderBottom: i < cases.length - 1 ? `1px solid ${PALETTE.border}` : 'none',
                gap: fs(0.022),
              }}
            >
              {/* Rank badge */}
              <div
                style={{
                  width: fs(0.048),
                  height: fs(0.048),
                  borderRadius: fs(0.013),
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: fs(0.022), fontWeight: 900, color: PALETTE.white, lineHeight: 1 }}>
                  {i + 1}
                </span>
              </div>

              {/* Company + metric */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: fs(0.024),
                    fontWeight: 800,
                    color: PALETTE.dark,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: fs(0.016),
                    color: PALETTE.subtext,
                    marginTop: fs(0.003),
                    fontWeight: 500,
                  }}
                >
                  {c.metric}
                </div>
              </div>

              {/* Number + unit */}
              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: fs(0.048),
                    fontWeight: 900,
                    color: color,
                    lineHeight: 0.9,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {c.number}
                </div>
                {c.unit && (
                  <div
                    style={{
                      fontSize: fs(0.014),
                      color: '#B0B8C1',
                      marginTop: fs(0.005),
                      fontWeight: 500,
                    }}
                  >
                    {c.unit}
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

'use client';

import type { BeforeAfterData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: BeforeAfterData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function BeforeAfterLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.065;
  const fs = (r: number) => cardWidth * r;
  const rows = data.rows.slice(0, 4);
  const headerA = data.headerA ?? 'OEM 부품';
  const headerB = data.headerB ?? '에픽카';

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
      {/* Dark header band */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: cardHeight * 0.22,
          background: `linear-gradient(135deg, #002E2D 0%, ${PALETTE.accent} 100%)`,
        }}
      />

      {/* Decorative circle */}
      <div
        style={{
          position: 'absolute',
          top: -cardWidth * 0.05,
          right: -cardWidth * 0.04,
          width: cardWidth * 0.26,
          height: cardWidth * 0.26,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }}
      />

      {/* Header content */}
      <div
        style={{
          position: 'absolute',
          top: p * 0.9,
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
              fontSize: fs(0.014),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              marginBottom: fs(0.006),
            }}
          >
            비교 분석
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
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(0.012), opacity: 0.8 }}>
          <div
            style={{
              width: fs(0.042),
              height: fs(0.042),
              borderRadius: fs(0.012),
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: PALETTE.white, fontWeight: 900, fontSize: fs(0.026), lineHeight: 1 }}>∞</span>
          </div>
          <span style={{ color: PALETTE.white, fontWeight: 800, fontSize: fs(0.028) }}>에픽카</span>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          position: 'absolute',
          top: cardHeight * 0.225,
          left: p,
          right: p,
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          paddingBottom: fs(0.014),
          borderBottom: `2px solid ${PALETTE.border}`,
        }}
      >
        <div />
        <div
          style={{
            fontSize: fs(0.016),
            fontWeight: 700,
            color: PALETTE.subtext,
            textAlign: 'center' as const,
            letterSpacing: '0.05em',
          }}
        >
          {headerA}
        </div>
        <div style={{ textAlign: 'center' as const }}>
          <div
            style={{
              display: 'inline-block',
              background: PALETTE.accent,
              borderRadius: 100,
              padding: `${fs(0.006)}px ${fs(0.018)}px`,
              fontSize: fs(0.015),
              fontWeight: 700,
              color: PALETTE.white,
            }}
          >
            {headerB}
          </div>
        </div>
      </div>

      {/* Rows */}
      <div
        style={{
          position: 'absolute',
          left: p,
          right: p,
          top: cardHeight * 0.32,
          bottom: p,
        }}
      >
        {rows.map((row, i) => {
          const rowH = (cardHeight * 0.64) / Math.max(rows.length, 1);
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr',
                height: rowH,
                alignItems: 'center',
                borderBottom: i < rows.length - 1 ? `1px solid ${PALETTE.border}` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: fs(0.022),
                  fontWeight: 600,
                  color: PALETTE.dark,
                  letterSpacing: '-0.01em',
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontSize: fs(0.020),
                  fontWeight: 500,
                  color: PALETTE.subtext,
                  textAlign: 'center' as const,
                }}
              >
                {row.a}
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(0,89,87,0.08)',
                    borderRadius: fs(0.010),
                    padding: `${fs(0.007)}px ${fs(0.016)}px`,
                    fontSize: fs(0.020),
                    fontWeight: 800,
                    color: PALETTE.accent,
                  }}
                >
                  {row.b}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

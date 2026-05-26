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
  const p = cardWidth * 0.08;
  const fs = (r: number) => cardWidth * r;

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        background: PALETTE.lightBg,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: fs(0.012),
          background: `linear-gradient(180deg, ${PALETTE.accent} 0%, ${PALETTE.accentBright} 100%)`,
        }}
      />

      {/* Top right decorative circle */}
      <div
        style={{
          position: 'absolute',
          top: -cardWidth * 0.1,
          right: -cardWidth * 0.08,
          width: cardWidth * 0.35,
          height: cardWidth * 0.35,
          borderRadius: '50%',
          background: 'rgba(0,89,87,0.06)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: p,
          left: p * 1.3,
          display: 'flex',
          alignItems: 'center',
          gap: fs(0.014),
        }}
      >
        <div
          style={{
            width: fs(0.044),
            height: fs(0.044),
            borderRadius: fs(0.012),
            background: PALETTE.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: PALETTE.white, fontWeight: 900, fontSize: fs(0.028), lineHeight: 1 }}>∞</span>
        </div>
        <span
          style={{
            color: PALETTE.dark,
            fontWeight: 800,
            fontSize: fs(0.030),
            letterSpacing: '-0.02em',
          }}
        >
          에픽카
        </span>
      </div>

      {/* Tag */}
      {data.tag && (
        <div
          style={{
            position: 'absolute',
            top: cardHeight * 0.22,
            left: p * 1.3,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: `rgba(0,89,87,0.1)`,
              borderRadius: 100,
              padding: `${fs(0.008)}px ${fs(0.022)}px`,
              fontSize: fs(0.020),
              color: PALETTE.accent,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {data.tag}
          </div>
        </div>
      )}

      {/* Giant Number */}
      <div
        style={{
          position: 'absolute',
          left: p * 1.3,
          right: p,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <div
          style={{
            fontSize: fs(0.2),
            fontWeight: 900,
            color: PALETTE.dark,
            lineHeight: 0.85,
            letterSpacing: '-0.05em',
          }}
        >
          {data.number}
          {data.unit && (
            <span
              style={{
                fontSize: fs(0.07),
                fontWeight: 800,
                color: PALETTE.accent,
                marginLeft: fs(0.015),
              }}
            >
              {data.unit}
            </span>
          )}
        </div>
      </div>

      {/* Desc */}
      {data.desc && (
        <div
          style={{
            position: 'absolute',
            bottom: p,
            left: p * 1.3,
            right: p,
          }}
        >
          <div
            style={{
              width: fs(0.08),
              height: 2,
              background: PALETTE.accentBright,
              borderRadius: 2,
              marginBottom: fs(0.015),
            }}
          />
          <div
            style={{
              fontSize: fs(0.026),
              fontWeight: 500,
              color: PALETTE.subtext,
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

'use client';

import type { TimelineData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: TimelineData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function TimelineLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.07;
  const fs = (r: number) => cardWidth * r;
  const steps = data.steps.slice(0, 4);

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        background: '#F7F9FC',
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Left accent strip */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: fs(0.012),
          background: `linear-gradient(180deg, ${PALETTE.accent}, ${PALETTE.accentBright})`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: p,
          right: p,
          opacity: 0.35,
        }}
      >
        <img src="/eficar_logo.png" alt="에픽카" style={{ height: fs(0.038), width: 'auto' }} />
      </div>

      {/* Headline */}
      <div style={{ position: 'absolute', top: p, left: p * 1.4, right: p * 2.5 }}>
        <div
          style={{
            fontSize: fs(0.036),
            fontWeight: 900,
            color: PALETTE.dark,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.headline}
        </div>
        <div
          style={{
            width: fs(0.05),
            height: 3,
            background: PALETTE.accent,
            borderRadius: 2,
            marginTop: fs(0.012),
          }}
        />
      </div>

      {/* Steps */}
      <div
        style={{
          position: 'absolute',
          left: p * 1.4,
          right: p,
          top: cardHeight * 0.26,
          bottom: p,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const isFilled = i === 0;
          const stepH = (cardHeight * 0.68) / Math.max(steps.length, 1);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: fs(0.022),
                height: stepH,
              }}
            >
              {/* Circle + line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: fs(0.05),
                }}
              >
                <div
                  style={{
                    width: fs(0.048),
                    height: fs(0.048),
                    borderRadius: '50%',
                    background: isFilled ? PALETTE.accent : '#FFFFFF',
                    border: `2px solid ${isFilled ? PALETTE.accent : '#CBD5E1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isFilled ? `0 2px 8px rgba(0,89,87,0.25)` : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: fs(0.018),
                      fontWeight: 900,
                      color: isFilled ? '#FFFFFF' : '#94A3B8',
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
                {!isLast && (
                  <div
                    style={{
                      flex: 1,
                      width: 2,
                      background: `linear-gradient(180deg, ${PALETTE.accent}60, #CBD5E180)`,
                      marginTop: 3,
                      minHeight: fs(0.04),
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: fs(0.004) }}>
                <div
                  style={{
                    fontSize: fs(0.024),
                    fontWeight: 800,
                    color: isFilled ? PALETTE.accent : PALETTE.dark,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    marginBottom: step.desc ? fs(0.005) : 0,
                  }}
                >
                  {step.title}
                </div>
                {step.desc && (
                  <div
                    style={{
                      fontSize: fs(0.018),
                      fontWeight: 400,
                      color: PALETTE.subtext,
                      lineHeight: 1.4,
                    }}
                  >
                    {step.desc}
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

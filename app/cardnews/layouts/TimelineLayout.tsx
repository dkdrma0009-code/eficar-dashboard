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
        background: PALETTE.lightBg,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top bar */}
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

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          top: p,
          right: p,
          display: 'flex',
          alignItems: 'center',
          gap: fs(0.012),
          opacity: 0.45,
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
          top: p * 1.1,
          left: p,
          right: p * 3,
        }}
      >
        <div
          style={{
            fontSize: fs(0.038),
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
            width: fs(0.055),
            height: 3,
            background: PALETTE.accent,
            borderRadius: 2,
            marginTop: fs(0.014),
          }}
        />
      </div>

      {/* Steps */}
      <div
        style={{
          position: 'absolute',
          left: p,
          right: p,
          top: cardHeight * 0.28,
          bottom: p,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const stepH = ((cardHeight * 0.68) / Math.max(steps.length, 1));
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: fs(0.02),
                height: stepH,
              }}
            >
              {/* Number + connector */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: fs(0.058),
                }}
              >
                <div
                  style={{
                    width: fs(0.055),
                    height: fs(0.055),
                    borderRadius: '50%',
                    background: i === 0 ? PALETTE.accent : PALETTE.white,
                    border: `2px solid ${PALETTE.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: fs(0.022),
                      fontWeight: 900,
                      color: i === 0 ? PALETTE.white : PALETTE.accent,
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
                      background: `linear-gradient(180deg, ${PALETTE.accent}, rgba(0,89,87,0.2))`,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  paddingTop: fs(0.01),
                  paddingBottom: isLast ? 0 : fs(0.015),
                }}
              >
                <div
                  style={{
                    background: PALETTE.white,
                    borderRadius: fs(0.016),
                    padding: `${fs(0.018)}px ${fs(0.022)}px`,
                    border: i === 0 ? `1px solid ${PALETTE.accent}` : `1px solid ${PALETTE.border}`,
                    boxShadow: i === 0 ? '0 2px 8px rgba(0,89,87,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontSize: fs(0.025),
                      fontWeight: 800,
                      color: i === 0 ? PALETTE.accent : PALETTE.dark,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.3,
                      marginBottom: step.desc ? fs(0.006) : 0,
                    }}
                  >
                    {step.title}
                  </div>
                  {step.desc && (
                    <div
                      style={{
                        fontSize: fs(0.019),
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

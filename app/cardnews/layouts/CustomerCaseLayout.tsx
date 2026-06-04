'use client';

import type { CustomerCaseData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

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

  // 2-col grid layout
  const cols = cases.length <= 2 ? 1 : 2;
  const rows = Math.ceil(cases.length / cols);
  const cellW = cols === 1 ? (cardWidth - p * 2) : (cardWidth - p * 2 - fs(0.022)) / 2;
  const cellH = (cardHeight - p * 2 - fs(0.14)) / rows - fs(0.018);

  return (
    <div style={{
      width: cardWidth, height: cardHeight,
      background: '#FFFFFF',
      fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
      position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: PALETTE.accent }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: p * 1.0, left: p, right: p,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div style={{
          fontSize: fs(0.034), fontWeight: 900,
          color: '#191F28', letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>
          {data.headline.split(' ').map((word, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <span key={i} style={{ color: isLast ? PALETTE.accent : '#191F28' }}>
                {word}{!isLast ? ' ' : ''}
              </span>
            );
          })}
        </div>
        <div style={{ opacity: 0.5, flexShrink: 0, marginLeft: fs(0.02) }}>
          <img src="/eficar_logo.png" alt="에픽카" style={{ height: fs(0.040), width: 'auto' }} />
        </div>
      </div>

      {/* Case grid */}
      <div style={{
        position: 'absolute',
        top: p + fs(0.10),
        left: p, right: p, bottom: p,
        display: 'flex', flexWrap: 'wrap', gap: fs(0.018), alignContent: 'flex-start',
      }}>
        {cases.map((c, i) => (
          <div key={i} style={{
            width: cellW, height: cellH,
            background: '#F8FBFA',
            border: `1px solid rgba(0,89,87,0.12)`,
            borderRadius: fs(0.018),
            padding: `${fs(0.022)}px ${fs(0.024)}px`,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            {/* Company + metric */}
            <div>
              <div style={{
                fontSize: fs(0.022), fontWeight: 800,
                color: '#191F28', letterSpacing: '-0.01em', lineHeight: 1.2,
                marginBottom: fs(0.004),
              }}>
                {c.name}
              </div>
              <div style={{
                fontSize: fs(0.015), fontWeight: 500,
                color: PALETTE.subtext,
              }}>
                {c.metric}
              </div>
            </div>

            {/* Number */}
            <div>
              <div style={{
                fontSize: fs(0.046), fontWeight: 900,
                color: PALETTE.accent, lineHeight: 0.9,
                letterSpacing: '-0.03em',
              }}>
                {c.number}
              </div>
              {c.unit && (
                <div style={{
                  fontSize: fs(0.013), color: PALETTE.subtext,
                  marginTop: fs(0.005), fontWeight: 500,
                }}>
                  {c.unit}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

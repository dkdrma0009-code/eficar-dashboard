'use client';

import type { ListData, CardRatio } from '../types';
import { PALETTE, RATIO_HEIGHT, CARD_WIDTH } from '../types';

interface Props {
  data: ListData;
  ratio: CardRatio;
  cardWidth?: number;
}

export default function ListLayout({ data, ratio, cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];
  const p = cardWidth * 0.072;
  const fs = (r: number) => cardWidth * r;
  const items = data.items.slice(0, 4);

  const titleWords = data.headline.trim().split(' ');
  const accentWord = titleWords[titleWords.length - 1];
  const baseWords = titleWords.slice(0, -1).join(' ');

  return (
    <div style={{
      width: cardWidth, height: cardHeight,
      background: '#FFFFFF',
      fontFamily: 'Pretendard, Apple SD Gothic Neo, sans-serif',
      position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: PALETTE.accent }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: p * 1.05, right: p, opacity: 0.5 }}>
        <img src="/eficar_logo.png" alt="에픽카" style={{ height: fs(0.038), width: 'auto' }} />
      </div>

      {/* Headline — two-tone */}
      <div style={{ position: 'absolute', top: p * 1.1, left: p, right: p * 3.2 }}>
        <div style={{
          fontSize: fs(0.038), fontWeight: 900,
          lineHeight: 1.25, letterSpacing: '-0.02em',
        }}>
          <span style={{ color: '#191F28' }}>{baseWords} </span>
          <span style={{ color: PALETTE.accent }}>{accentWord}</span>
        </div>
        <div style={{
          width: fs(0.05), height: 3,
          background: PALETTE.accent, borderRadius: 2,
          marginTop: fs(0.012),
        }} />
      </div>

      {/* List items */}
      <div style={{
        position: 'absolute',
        top: cardHeight * 0.28,
        left: p, right: p, bottom: p * 0.9,
        display: 'flex', flexDirection: 'column',
        gap: fs(0.016),
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: fs(0.022),
            background: '#F8FBFA',
            border: `1px solid rgba(0,89,87,0.10)`,
            borderLeft: `3px solid ${PALETTE.accent}`,
            borderRadius: `0 ${fs(0.014)}px ${fs(0.014)}px 0`,
            padding: `${fs(0.020)}px ${fs(0.022)}px`,
            flex: 1,
          }}>
            {/* Number badge */}
            <div style={{
              fontSize: fs(0.026), fontWeight: 900,
              color: PALETTE.accent, lineHeight: 1,
              flexShrink: 0, minWidth: fs(0.022),
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: fs(0.024), fontWeight: 800,
                color: '#191F28', letterSpacing: '-0.01em',
                lineHeight: 1.25,
                marginBottom: item.desc ? fs(0.005) : 0,
              }}>
                {item.title}
              </div>
              {item.desc && (
                <div style={{
                  fontSize: fs(0.018), fontWeight: 400,
                  color: PALETTE.subtext, lineHeight: 1.4,
                }}>
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

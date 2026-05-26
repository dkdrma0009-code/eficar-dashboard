'use client';

import type { CardItem, CardRatio } from '../types';
import { RATIO_HEIGHT, CARD_WIDTH } from '../types';
import CoverLayout from '../layouts/CoverLayout';
import BigNumberLayout from '../layouts/BigNumberLayout';
import BeforeAfterLayout from '../layouts/BeforeAfterLayout';
import ListLayout from '../layouts/ListLayout';
import CustomerCaseLayout from '../layouts/CustomerCaseLayout';
import TimelineLayout from '../layouts/TimelineLayout';
import QuoteLayout from '../layouts/QuoteLayout';
import CTALayout from '../layouts/CTALayout';

interface CardCanvasProps {
  card: CardItem;
  ratio: CardRatio;
  scale?: number;
  forExport?: boolean;
}

export default function CardCanvas({ card, ratio, scale = 1, forExport = false }: CardCanvasProps) {
  const cardWidth = CARD_WIDTH;
  const cardHeight = cardWidth * RATIO_HEIGHT[ratio];

  const inner = renderLayout(card, ratio, cardWidth);

  if (forExport) {
    return <div style={{ width: cardWidth, height: cardHeight, overflow: 'hidden' }}>{inner}</div>;
  }

  // Preview: scale down to fit container
  return (
    <div
      style={{
        width: cardWidth * scale,
        height: cardHeight * scale,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: cardWidth,
          height: cardHeight,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        {inner}
      </div>
    </div>
  );
}

function renderLayout(card: CardItem, ratio: CardRatio, cardWidth: number) {
  switch (card.layout) {
    case 'cover':
      return <CoverLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'big-number':
      return <BigNumberLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'before-after':
      return <BeforeAfterLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'list':
      return <ListLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'customer-case':
      return <CustomerCaseLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'timeline':
      return <TimelineLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'quote':
      return <QuoteLayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
    case 'cta':
      return <CTALayout data={card.data} ratio={ratio} cardWidth={cardWidth} />;
  }
}

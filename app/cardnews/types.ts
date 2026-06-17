export type CardRatio = '1:1' | '4:5' | '9:16' | '16:9';

export interface CardFormInput {
  topic: string;
  targetCustomer?: string;
  metric1?: string;
  metric2?: string;
  metric3?: string;
  keyMessage?: string;
  cardCount: number;
}

export const RATIO_HEIGHT: Record<CardRatio, number> = {
  '1:1': 1,
  '4:5': 1.25,
  '9:16': 16 / 9,
  '16:9': 9 / 16,
};

export const CARD_WIDTH = 540;

export const PALETTE = {
  accent: '#005957',
  accentBright: '#00B386',
  dark: '#191F28',
  white: '#FFFFFF',
  subtext: '#8B95A1',
  lightBg: '#F8F9FA',
  border: '#E2E8F0',
} as const;

// Re-export from lib for convenience
export type { CardContent, GeneratedCard } from '@/lib/cardTemplates';

export type CardRatio = '1:1' | '4:5' | '9:16' | '16:9';
export type CardLayout = 'cover' | 'big-number' | 'before-after' | 'list' | 'customer-case' | 'timeline' | 'quote' | 'cta';

export type CoverData = {
  badge?: string;
  headline: string;
  subheadline?: string;
  highlight?: string;
};

export type BigNumberData = {
  tag?: string;
  number: string;
  unit?: string;
  desc?: string;
};

export type BeforeAfterData = {
  headline: string;
  headerA?: string;
  headerB?: string;
  rows: { label: string; a: string; b: string }[];
};

export type ListData = {
  headline: string;
  items: { title: string; desc?: string }[];
};

export type CustomerCaseData = {
  headline: string;
  cases: { name: string; metric: string; number: string; unit?: string }[];
};

export type TimelineData = {
  headline: string;
  steps: { title: string; desc?: string }[];
};

export type QuoteData = {
  quote: string;
  attribution?: string;
  context?: string;
};

export type CTAData = {
  headline: string;
  subheadline?: string;
  contact1?: string;
  contact2?: string;
};

export type CardItem =
  | { layout: 'cover'; data: CoverData }
  | { layout: 'big-number'; data: BigNumberData }
  | { layout: 'before-after'; data: BeforeAfterData }
  | { layout: 'list'; data: ListData }
  | { layout: 'customer-case'; data: CustomerCaseData }
  | { layout: 'timeline'; data: TimelineData }
  | { layout: 'quote'; data: QuoteData }
  | { layout: 'cta'; data: CTAData };

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

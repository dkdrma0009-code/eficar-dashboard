'use client';
import { Trophy, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { formatPercent } from '@/lib/dataUtils';
import type { ViewData } from '@/lib/types';

interface Props {
  viewData: ViewData;
  onSelectCustomer: (name: string) => void;
}

const CONFIGS = {
  mvp: {
    icon: Trophy,
    title: '이달의 MVP',
    gradient: 'linear-gradient(135deg, #005957 0%, #00817E 100%)',
    light: '#E6F2F2',
    color: '#005957',
  },
  action: {
    icon: AlertCircle,
    title: '즉시 액션 필요',
    gradient: 'linear-gradient(135deg, #F04452 0%, #FF6B6B 100%)',
    light: '#FFF0F1',
    color: '#F04452',
  },
  opportunity: {
    icon: Lightbulb,
    title: '이달의 기회',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    light: '#FFFBEB',
    color: '#D97706',
  },
};

function InsightCard({
  type, name, sub, action, onClick,
}: {
  type: keyof typeof CONFIGS;
  name: string; sub: string; action: string;
  onClick: () => void;
}) {
  const cfg = CONFIGS[type];
  const Icon = cfg.icon;

  return (
    <div onClick={onClick} className="card card-hover" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
      {/* 상단 그라디언트 헤더 */}
      <div style={{ background: cfg.gradient, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 15, height: 15, color: 'white' }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{cfg.title}</p>
      </div>

      {/* 본문 */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#191F28', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12 }}>{sub}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: cfg.color }}>
          {action}
          <ArrowRight style={{ width: 13, height: 13 }} />
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ type }: { type: keyof typeof CONFIGS }) {
  const cfg = CONFIGS[type];
  const Icon = cfg.icon;
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.5 }}>
      <div style={{ background: cfg.gradient, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 15, height: 15, color: 'white' }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{cfg.title}</p>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 13, color: '#8B95A1' }}>해당 없음</p>
      </div>
    </div>
  );
}

export default function InsightCards({ viewData, onSelectCustomer }: Props) {
  const { mvpCustomer, actionCustomer, opportunityCustomer, isLatestMonth } = viewData;
  if (isLatestMonth) return null;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {mvpCustomer ? (
        <InsightCard type="mvp"
          name={mvpCustomer.name}
          sub={`전월 대비 ${formatPercent(mvpCustomer.growthRate)} 성장`}
          action="드릴다운 분석"
          onClick={() => onSelectCustomer(mvpCustomer.name)}
        />
      ) : <EmptyCard type="mvp" />}

      {actionCustomer ? (
        <InsightCard type="action"
          name={actionCustomer.name}
          sub={actionCustomer.currentMonthSales === 0 ? '이번 달 매출 없음' : `전월 대비 ${formatPercent(actionCustomer.growthRate)}`}
          action="즉시 연락 필요"
          onClick={() => onSelectCustomer(actionCustomer.name)}
        />
      ) : <EmptyCard type="action" />}

      {opportunityCustomer ? (
        <InsightCard type="opportunity"
          name={opportunityCustomer.name}
          sub={`미도입 품목 ${opportunityCustomer.missingCategoryCount}개 카테고리`}
          action="추가 제안 기회"
          onClick={() => onSelectCustomer(opportunityCustomer.name)}
        />
      ) : <EmptyCard type="opportunity" />}
    </div>
  );
}

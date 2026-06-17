// Pure template functions — importable by both server routes and client components

export interface CardContent {
  type: 'cover' | 'kpi' | 'comparison' | 'customers' | 'list' | 'timeline' | 'cta';
  badge?: string;
  headline?: string;
  subtext?: string;
  kpiTitle?: string;
  kpiLabel?: string;
  kpiNumber?: string;
  kpiDesc?: string;
  compTitle?: string;
  compRows?: { item: string; oem: string; eficar: string }[];
  custTitle?: string;
  customers?: { name: string; metric: string; value: string; note?: string }[];
  listTitle?: string;
  listItems?: { num: number; title: string; desc: string }[];
  timeTitle?: string;
  timeSteps?: { title: string; desc: string }[];
  ctaBadge?: string;
  ctaTitle?: string;
}

export interface GeneratedCard {
  type: string;
  html: string;
  content: CardContent;
}

const LOGO = `<div style='display:flex;align-items:center;gap:6px'><div style='width:24px;height:24px;border-radius:6px;background:#005957;display:flex;align-items:center;justify-content:center'><span style='color:#fff;font-weight:900;font-size:13px;line-height:1'>∞</span></div><span style='font-weight:800;font-size:14px;color:#191F28;letter-spacing:-0.3px'>에픽카</span></div>`;
const LOGO_WHITE = `<div style='display:flex;align-items:center;gap:6px'><div style='width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center'><span style='color:#fff;font-weight:900;font-size:13px;line-height:1'>∞</span></div><span style='font-weight:800;font-size:14px;color:#fff;letter-spacing:-0.3px'>에픽카</span></div>`;

function e(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nl(s: string | undefined): string {
  if (!s) return '';
  return e(s).replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
}

function headlineFs(text: string): number {
  const len = (text || '').replace(/[\n\\n]/g, '').length;
  if (len <= 8) return 48;
  if (len <= 12) return 42;
  if (len <= 15) return 36;
  return 30;
}

function buildCoverHtml(c: CardContent): string {
  const fs = headlineFs(c.headline || '부품비를\n줄이는 방법');
  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='position:absolute;top:0;left:0;bottom:0;width:324px;padding:40px 36px;display:flex;flex-direction:column;justify-content:space-between'>
    <div>${LOGO}</div>
    <div>
      ${c.badge ? `<div style='display:inline-block;background:#E8F5F2;border:1px solid rgba(0,89,87,0.2);border-radius:100px;padding:5px 14px;font-size:13px;font-weight:700;color:#005957;margin-bottom:20px'>${e(c.badge)}</div>` : ''}
      <div style='width:40px;height:3px;background:#005957;border-radius:2px;margin-bottom:16px'></div>
      <div style='font-size:${fs}px;font-weight:900;color:#191F28;line-height:1.15;letter-spacing:-0.025em'>${nl(c.headline || '부품비를\\n줄이는 방법')}</div>
      ${c.subtext ? `<div style='font-size:16px;font-weight:500;color:#6B7280;margin-top:14px;line-height:1.5'>${e(c.subtext)}</div>` : ''}
    </div>
    <div style='font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.04em'>eficar.co.kr</div>
  </div>
  <div style='position:absolute;top:0;right:0;bottom:0;width:216px;background:linear-gradient(145deg,#004745,#005957 50%,#007A77);overflow:hidden'>
    <div style='position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.07)'></div>
    <div style='position:absolute;bottom:-50px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05)'></div>
    <div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:120px;font-weight:900;color:rgba(255,255,255,0.12);line-height:1;letter-spacing:-0.05em;user-select:none'>∞</div>
  </div>
</div>`;
}

function buildKpiHtml(c: CardContent): string {
  const num = c.kpiNumber || '850%';
  const numLen = num.length;
  const numSize = numLen <= 3 ? 96 : numLen <= 5 ? 80 : 64;
  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='position:absolute;top:0;left:0;right:0;padding:36px 40px'>
    <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:32px'>
      ${LOGO}
      ${c.kpiLabel ? `<div style='font-size:12px;font-weight:700;color:#005957;letter-spacing:0.1em'>${e(c.kpiLabel)}</div>` : ''}
    </div>
    ${c.kpiTitle ? `<div style='font-size:28px;font-weight:900;color:#191F28;line-height:1.2;letter-spacing:-0.02em;margin-bottom:28px'>${nl(c.kpiTitle)}</div>` : ''}
    <div style='background:#E8F5F2;border-radius:20px;padding:40px;border:1px solid rgba(0,89,87,0.12)'>
      ${c.kpiLabel ? `<div style='font-size:14px;font-weight:700;color:#005957;margin-bottom:14px'>[${e(c.kpiLabel)}]</div>` : ''}
      <div style='font-size:${numSize}px;font-weight:900;color:#005957;line-height:0.85;letter-spacing:-0.04em'>${e(num)}</div>
      ${c.kpiDesc ? `<div style='font-size:16px;font-weight:500;color:#6B7280;margin-top:18px'>${e(c.kpiDesc)}</div>` : ''}
    </div>
  </div>
</div>`;
}

function buildCustomersHtml(c: CardContent): string {
  const items = (c.customers || [
    { name: 'SK렌터카', metric: '연간 절감액', value: '1.6억', note: '차량 1만대 기준' },
    { name: '그린카', metric: '업무 절감률', value: '90%', note: '에픽커넥트 도입 후' },
    { name: '롯데렌탈', metric: '공급량 성장률', value: '304%', note: '전년 대비' },
    { name: '에픽카 파트너사', metric: '매출 성장률', value: '850%', note: '전년 대비' },
  ]).slice(0, 4);

  const cells = items.map((cu, i) => {
    const bg = i === items.length - 1 ? '#E8F5F2' : '#F8FBFA';
    const border = i === items.length - 1 ? 'rgba(0,89,87,0.18)' : 'rgba(0,89,87,0.12)';
    return `<div style='background:${bg};border:1px solid ${border};border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;height:140px'>
      <div><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:4px'>${e(cu.name)}</div><div style='font-size:13px;color:#6B7280'>${e(cu.metric)}</div></div>
      <div><div style='font-size:38px;font-weight:900;color:#005957;line-height:0.9;letter-spacing:-0.03em'>${e(cu.value)}</div>${cu.note ? `<div style='font-size:12px;color:#9CA3AF;margin-top:5px'>${e(cu.note)}</div>` : ''}</div>
    </div>`;
  }).join('');

  const titleHtml = c.custTitle
    ? nl(c.custTitle)
    : `<span style='color:#191F28'>함께하는 파트너사 </span><span style='color:#005957'>실제 성과</span>`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px'>${LOGO}<span style='font-size:12px;color:#6B7280'>파트너사 실적</span></div>
  <div style='font-size:28px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px'>${titleHtml}</div>
  <div style='display:grid;grid-template-columns:1fr 1fr;gap:14px'>${cells}</div>
</div>`;
}

function buildComparisonHtml(c: CardContent): string {
  const rows = (c.compRows || [
    { item: '단가', oem: '정가', eficar: '–30~40%' },
    { item: '납기', oem: '3~5일', eficar: '당일~익일' },
    { item: '견적', oem: '수동', eficar: 'AI 자동' },
    { item: '사고처리', oem: '전화 수십 통', eficar: '앱 하나' },
  ]).slice(0, 5);

  const rowH = Math.floor(248 / rows.length);
  const rowHtml = rows.map(r => `
    <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;height:${rowH}px;align-items:center;border-bottom:1px solid #F3F4F6'>
      <div style='font-size:16px;font-weight:600;color:#374151'>${e(r.item)}</div>
      <div style='font-size:15px;color:#9CA3AF;text-align:center'>${e(r.oem)}</div>
      <div style='text-align:center'><span style='background:#E8F5F2;border-radius:8px;padding:5px 12px;font-size:15px;font-weight:800;color:#005957'>${e(r.eficar)}</span></div>
    </div>`).join('');

  const titleHtml = c.compTitle
    ? nl(c.compTitle)
    : `OEM vs <span style='color:#005957'>에픽카</span> 대체부품`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:22px'>${LOGO}<span style='font-size:12px;color:#6B7280'>비교 분석</span></div>
  <div style='font-size:26px;font-weight:900;color:#191F28;letter-spacing:-0.02em;margin-bottom:22px'>${titleHtml}</div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;border-bottom:2px solid #E5E7EB;padding-bottom:10px;margin-bottom:4px'>
    <div></div>
    <div style='font-size:13px;font-weight:700;color:#9CA3AF;text-align:center'>OEM</div>
    <div style='text-align:center'><span style='background:#005957;border-radius:100px;padding:3px 12px;font-size:12px;font-weight:700;color:#fff'>에픽카</span></div>
  </div>
  ${rowHtml}
</div>`;
}

function buildListHtml(c: CardContent): string {
  const items = (c.listItems || []).slice(0, 4);
  const gap = items.length <= 3 ? 14 : 10;
  const itemHtml = items.map(it => `
    <div style='display:flex;align-items:flex-start;gap:16px;background:#F8FBFA;border:1px solid rgba(0,89,87,0.1);border-left:3px solid #005957;border-radius:0 12px 12px 0;padding:18px 20px'>
      <span style='font-size:22px;font-weight:900;color:#005957;line-height:1;flex-shrink:0'>${it.num}</span>
      <div><div style='font-size:18px;font-weight:800;color:#191F28;margin-bottom:4px'>${e(it.title)}</div><div style='font-size:14px;color:#6B7280'>${e(it.desc)}</div></div>
    </div>`).join('');

  const titleHtml = c.listTitle
    ? nl(c.listTitle)
    : `<span style='color:#191F28'>에픽카가 바꾼 </span><span style='color:#005957'>${items.length}가지</span>`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:22px'>${LOGO}</div>
  <div style='font-size:28px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px'>${titleHtml}</div>
  <div style='display:flex;flex-direction:column;gap:${gap}px'>${itemHtml}</div>
</div>`;
}

function buildTimelineHtml(c: CardContent): string {
  const steps = (c.timeSteps || []).slice(0, 4);
  const stepH = Math.floor(360 / Math.max(steps.length, 1));

  const stepHtml = steps.map((s, i) => {
    const isFirst = i === 0;
    const isLast = i === steps.length - 1;
    const circleBg = isFirst ? '#005957' : '#fff';
    const circleBorder = isFirst ? '' : 'border:2px solid #CBD5E1;';
    const numColor = isFirst ? '#fff' : '#94A3B8';
    const titleColor = isFirst ? '#005957' : '#191F28';
    const lineGrad = isFirst
      ? 'linear-gradient(180deg,#005957,rgba(0,89,87,0.2))'
      : 'rgba(0,89,87,0.1)';
    return `<div style='display:flex;gap:16px;height:${stepH}px'>
      <div style='display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px'>
        <div style='width:36px;height:36px;border-radius:50%;background:${circleBg};${circleBorder}display:flex;align-items:center;justify-content:center;flex-shrink:0'><span style='font-size:15px;font-weight:900;color:${numColor}'>${i + 1}</span></div>
        ${!isLast ? `<div style='flex:1;width:2px;background:${lineGrad};margin-top:4px'></div>` : ''}
      </div>
      <div style='padding-top:6px'>
        <div style='font-size:17px;font-weight:800;color:${titleColor};margin-bottom:5px'>${e(s.title)}</div>
        <div style='font-size:14px;color:#6B7280;line-height:1.4'>${e(s.desc)}</div>
      </div>
    </div>`;
  }).join('');

  const titleHtml = c.timeTitle
    ? nl(c.timeTitle)
    : `2주 안에 <span style='color:#005957'>시작할 수 있습니다</span>`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#F7F9FC;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>${LOGO}<span style='font-size:12px;color:#6B7280'>도입 프로세스</span></div>
  <div style='font-size:26px;font-weight:900;color:#191F28;letter-spacing:-0.02em;margin-bottom:28px'>${titleHtml}</div>
  <div style='display:flex;flex-direction:column;gap:0'>${stepHtml}</div>
</div>`;
}

function buildCtaHtml(c: CardContent): string {
  const titleFs = headlineFs(c.ctaTitle || '지금 바로\n시작하세요');
  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:linear-gradient(145deg,#003D3C,#005957 50%,#007A77)'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#1CC76E,rgba(28,199,110,0))'></div>
  <div style='position:absolute;top:-60px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.07)'></div>
  <div style='position:absolute;bottom:-50px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05)'></div>
  <div style='position:absolute;inset:0;padding:44px 44px;display:flex;flex-direction:column;justify-content:space-between'>
    <div>${LOGO_WHITE}</div>
    <div>
      ${c.ctaBadge ? `<div style='font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:0.1em;margin-bottom:14px'>${e(c.ctaBadge)}</div>` : ''}
      <div style='font-size:${titleFs}px;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-0.03em'>${nl(c.ctaTitle || '지금 바로\\n시작하세요')}</div>
      <div style='width:40px;height:2px;background:rgba(255,255,255,0.3);border-radius:2px;margin-top:24px'></div>
    </div>
    <div style='display:flex;gap:14px'>
      <div style='flex:1;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:18px 20px'>
        <div style='font-size:11px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:0.1em;margin-bottom:7px'>이메일</div>
        <div style='font-size:15px;font-weight:700;color:#fff'>eficar@eficar.co.kr</div>
      </div>
      <div style='flex:1;background:rgba(28,199,110,0.2);border:1px solid rgba(28,199,110,0.35);border-radius:14px;padding:18px 20px'>
        <div style='font-size:11px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:0.1em;margin-bottom:7px'>전화</div>
        <div style='font-size:15px;font-weight:700;color:#fff'>010-2752-1054</div>
      </div>
    </div>
  </div>
</div>`;
}

export function buildCardHtml(card: CardContent): string {
  switch (card.type) {
    case 'cover':      return buildCoverHtml(card);
    case 'kpi':        return buildKpiHtml(card);
    case 'customers':  return buildCustomersHtml(card);
    case 'comparison': return buildComparisonHtml(card);
    case 'list':       return buildListHtml(card);
    case 'timeline':   return buildTimelineHtml(card);
    case 'cta':        return buildCtaHtml(card);
    default:           return buildCoverHtml(card);
  }
}

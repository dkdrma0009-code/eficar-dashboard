// Pure template functions — importable by both server routes and client components

export interface CardContent {
  type: 'cover' | 'kpi' | 'comparison' | 'customers' | 'list' | 'timeline' | 'cta' | 'chart';
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
  chartType?: 'bar' | 'line' | 'donut';
  chartTitle?: string;
  chartSubtitle?: string;
  chartData?: { label: string; value: number; highlight?: boolean }[];
  chartUnit?: string;
  chartCaption?: string;
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

function slideNumHtml(index: number, total: number, color = '#9CA3AF'): string {
  return `<div style='font-size:12px;font-weight:700;color:${color};letter-spacing:0.05em'>${index + 1}/${total}</div>`;
}

// 수정 5: ∞ opacity 0.12 → 0.22, 크기 120 → 140
function buildCoverHtml(c: CardContent, index = 0, total = 1): string {
  const fs = headlineFs(c.headline || '부품비를\n줄이는 방법');
  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='position:absolute;top:0;left:0;bottom:0;width:324px;padding:40px 36px;display:flex;flex-direction:column;justify-content:space-between'>
    <div style='display:flex;justify-content:space-between;align-items:center'>${LOGO}${slideNumHtml(index, total)}</div>
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
    <div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:140px;font-weight:900;color:rgba(255,255,255,0.22);line-height:1;letter-spacing:-0.05em;user-select:none'>∞</div>
  </div>
</div>`;
}

function buildKpiHtml(c: CardContent, index = 0, total = 1): string {
  const num = c.kpiNumber || '850%';
  const numLen = num.length;
  const numSize = numLen <= 3 ? 96 : numLen <= 5 ? 80 : 64;
  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='padding:36px 40px;height:100%;box-sizing:border-box;display:flex;flex-direction:column'>
    <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:24px'>
      ${LOGO}
      ${slideNumHtml(index, total)}
    </div>
    <div style='flex:1;background:#E8F5F2;border-radius:20px;padding:36px 40px;border:1px solid rgba(0,89,87,0.12);display:flex;flex-direction:column;justify-content:center'>
      ${c.kpiTitle ? `<div style='font-size:22px;font-weight:900;color:#191F28;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px'>${nl(c.kpiTitle)}</div>` : ''}
      ${c.kpiLabel ? `<div style='font-size:13px;font-weight:700;color:#005957;letter-spacing:0.08em;margin-bottom:12px'>${e(c.kpiLabel)}</div>` : ''}
      <div style='font-size:${numSize}px;font-weight:900;color:#005957;line-height:1;letter-spacing:-0.04em'>${e(num)}</div>
      ${c.kpiDesc ? `<div style='font-size:15px;font-weight:500;color:#6B7280;margin-top:16px;line-height:1.5'>${e(c.kpiDesc)}</div>` : ''}
    </div>
  </div>
</div>`;
}

// 수정 3: 3개일 때 마지막 항목 grid-column:span 2, height 고정 → min-height
function buildCustomersHtml(c: CardContent, index = 0, total = 1): string {
  const items = (c.customers || [
    { name: 'SK렌터카', metric: '연간 절감액', value: '1.6억', note: '차량 1만대 기준' },
    { name: '그린카', metric: '업무 절감률', value: '90%', note: '에픽커넥트 도입 후' },
    { name: '롯데렌탈', metric: '공급량 성장률', value: '304%', note: '전년 대비' },
    { name: '에픽카 파트너사', metric: '매출 성장률', value: '850%', note: '전년 대비' },
  ]).slice(0, 4);

  const count = items.length;
  const cells = items.map((cu, i) => {
    const bg = i === items.length - 1 ? '#E8F5F2' : '#F8FBFA';
    const border = i === items.length - 1 ? 'rgba(0,89,87,0.18)' : 'rgba(0,89,87,0.12)';
    const colSpan = (count === 3 && i === 2) ? 'grid-column:span 2;' : '';
    return `<div style='${colSpan}background:${bg};border:1px solid ${border};border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;min-height:120px'>
      <div><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:4px'>${e(cu.name)}</div><div style='font-size:13px;color:#6B7280'>${e(cu.metric)}</div></div>
      <div><div style='font-size:38px;font-weight:900;color:#005957;line-height:0.9;letter-spacing:-0.03em'>${e(cu.value)}</div>${cu.note ? `<div style='font-size:12px;color:#9CA3AF;margin-top:5px'>${e(cu.note)}</div>` : ''}</div>
    </div>`;
  }).join('');

  const titleHtml = c.custTitle
    ? nl(c.custTitle)
    : `<span style='color:#191F28'>함께하는 파트너사 </span><span style='color:#005957'>실제 성과</span>`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px'>${LOGO}${slideNumHtml(index, total)}</div>
  <div style='font-size:28px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px'>${titleHtml}</div>
  <div style='display:grid;grid-template-columns:1fr 1fr;gap:14px'>${cells}</div>
</div>`;
}

function buildComparisonHtml(c: CardContent, index = 0, total = 1): string {
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
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:22px'>${LOGO}${slideNumHtml(index, total)}</div>
  <div style='font-size:26px;font-weight:900;color:#191F28;letter-spacing:-0.02em;margin-bottom:22px'>${titleHtml}</div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;border-bottom:2px solid #E5E7EB;padding-bottom:10px;margin-bottom:4px'>
    <div></div>
    <div style='font-size:13px;font-weight:700;color:#9CA3AF;text-align:center'>OEM</div>
    <div style='text-align:center'><span style='background:#005957;border-radius:100px;padding:3px 12px;font-size:12px;font-weight:700;color:#fff'>에픽카</span></div>
  </div>
  ${rowHtml}
</div>`;
}

// 수정 4: 4개 항목 시 폰트·패딩·여백 동적 축소
function buildListHtml(c: CardContent, index = 0, total = 1): string {
  const items = (c.listItems || []).slice(0, 4);
  const count = items.length;

  const titleSize = count >= 4 ? 24 : 28;
  const itemPadding = count >= 4 ? '14px 16px' : '18px 20px';
  const titleMb = count >= 4 ? '16px' : '24px';
  const numSize = count >= 4 ? 20 : 22;
  const descSize = count >= 4 ? 13 : 14;
  const itemTitleSize = count >= 4 ? 16 : 18;
  const gapSize = count >= 4 ? 8 : 14;
  const padding = count >= 4 ? '32px 36px' : '36px 40px';

  const itemHtml = items.map(it => `
    <div style='display:flex;align-items:flex-start;gap:14px;background:#F8FBFA;border:1px solid rgba(0,89,87,0.1);border-left:3px solid #005957;border-radius:0 12px 12px 0;padding:${itemPadding}'>
      <span style='font-size:${numSize}px;font-weight:900;color:#005957;line-height:1;flex-shrink:0;min-width:24px'>${it.num < 10 ? '0' + it.num : it.num}</span>
      <div><div style='font-size:${itemTitleSize}px;font-weight:800;color:#191F28;margin-bottom:3px'>${e(it.title)}</div><div style='font-size:${descSize}px;color:#6B7280;line-height:1.4'>${e(it.desc)}</div></div>
    </div>`).join('');

  const titleHtml = c.listTitle
    ? nl(c.listTitle)
    : `<span style='color:#191F28'>에픽카가 바꾼 </span><span style='color:#005957'>${items.length}가지</span>`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:${padding}'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:${titleMb}'>${LOGO}${slideNumHtml(index, total)}</div>
  <div style='font-size:${titleSize}px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin-bottom:${titleMb}'>${titleHtml}</div>
  <div style='display:flex;flex-direction:column;gap:${gapSize}px'>${itemHtml}</div>
</div>`;
}

function buildTimelineHtml(c: CardContent, index = 0, total = 1): string {
  const steps = (c.timeSteps || []).slice(0, 4);
  const stepGap = steps.length <= 3 ? 24 : 16;

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
    return `<div style='display:flex;gap:16px;padding-bottom:${!isLast ? stepGap + 'px' : '0'}'>
      <div style='display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px'>
        <div style='width:36px;height:36px;border-radius:50%;background:${circleBg};${circleBorder}display:flex;align-items:center;justify-content:center;flex-shrink:0'><span style='font-size:15px;font-weight:900;color:${numColor}'>${i + 1}</span></div>
        ${!isLast ? `<div style='height:${stepGap + 8}px;width:2px;background:${lineGrad};margin-top:4px'></div>` : ''}
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
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>${LOGO}${slideNumHtml(index, total)}</div>
  <div style='font-size:26px;font-weight:900;color:#191F28;letter-spacing:-0.02em;margin-bottom:28px'>${titleHtml}</div>
  <div style='display:flex;flex-direction:column'>${stepHtml}</div>
</div>`;
}

function buildChartSvg(
  type: 'bar' | 'line' | 'donut',
  data: { label: string; value: number; highlight?: boolean }[],
  unit: string,
  width: number,
  height: number,
): string {
  if (type === 'bar') {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barMaxH = height - 50; // top space for value label, bottom for x label
    const rawBarW = width / (data.length * 1.8);
    const barW = Math.min(rawBarW, 60);
    const totalBarArea = data.length * barW;
    const spacing = (width - totalBarArea) / (data.length + 1);
    const bottomY = height - 30;

    const bars = data.map((d, i) => {
      const x = spacing + i * (barW + spacing);
      const bh = Math.max(20, Math.round((d.value / maxVal) * barMaxH));
      const y = bottomY - bh;
      const fill = d.highlight !== false ? '#005957' : '#C8E6E5';
      const labelX = x + barW / 2;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="${fill}" rx="4" ry="4"/>
<text x="${labelX}" y="${y - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#005957">${d.value}${unit}</text>
<text x="${labelX}" y="${height}" text-anchor="middle" font-size="12" fill="#6B7280">${e(d.label)}</text>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${bars}</svg>`;
  }

  if (type === 'line') {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const padL = 20, padR = 20, padT = 24, padB = 30;
    const w = width - padL - padR;
    const h = height - padT - padB;

    const pts = data.map((d, i) => {
      const x = padL + (data.length === 1 ? w / 2 : (i / (data.length - 1)) * w);
      const y = padT + h - (d.value / maxVal) * h;
      return { x, y, d };
    });

    const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
    const polyFill = [
      pts[0] ? `${pts[0].x},${padT + h}` : '',
      ...pts.map(p => `${p.x},${p.y}`),
      pts[pts.length - 1] ? `${pts[pts.length - 1].x},${padT + h}` : '',
    ].join(' ');

    const circles = pts.map(p => {
      const r = p.d.highlight !== false ? 5 : 4;
      const fill = p.d.highlight !== false ? '#005957' : '#C8E6E5';
      return `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}"/>
<text x="${p.x}" y="${p.y - 9}" text-anchor="middle" font-size="12" font-weight="700" fill="#005957">${p.d.value}${unit}</text>
<text x="${p.x}" y="${padT + h + 16}" text-anchor="middle" font-size="12" fill="#6B7280">${e(p.d.label)}</text>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<polygon points="${polyFill}" fill="rgba(0,89,87,0.08)"/>
<polyline points="${polyPts}" stroke="#005957" stroke-width="2.5" fill="none"/>
${circles}
</svg>`;
  }

  if (type === 'donut') {
    const donutData = data.slice(0, 4);
    const total = donutData.reduce((s, d) => s + d.value, 0) || 1;
    const cx = 100, cy = height / 2;
    const R = Math.min(cx, cy) - 16;
    const r = R * 0.55;
    const colors = ['#005957', '#2A9D8F', '#57CC99', '#C8E6E5'];

    let startAngle = -Math.PI / 2;
    const arcs = donutData.map((d, i) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = cx + R * Math.cos(startAngle);
      const y1 = cy + R * Math.sin(startAngle);
      const x2 = cx + R * Math.cos(endAngle);
      const y2 = cy + R * Math.sin(endAngle);
      const ix1 = cx + r * Math.cos(endAngle);
      const iy1 = cy + r * Math.sin(endAngle);
      const ix2 = cx + r * Math.cos(startAngle);
      const iy2 = cy + r * Math.sin(startAngle);
      const large = angle > Math.PI ? 1 : 0;
      const path = `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix1},${iy1} A${r},${r} 0 ${large},0 ${ix2},${iy2} Z`;
      startAngle = endAngle;
      return `<path d="${path}" fill="${colors[i]}"/>`;
    }).join('');

    const maxItem = donutData.reduce((a, b) => b.value > a.value ? b : a, donutData[0]);
    const centerLabel = maxItem ? `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="24" font-weight="900" fill="#005957">${maxItem.value}${unit}</text>` : '';

    const legendX = cx * 2 + 16;
    const legend = donutData.map((d, i) => {
      const ly = 20 + i * 44;
      return `<circle cx="${legendX + 8}" cy="${ly + 8}" r="7" fill="${colors[i]}"/>
<text x="${legendX + 22}" y="${ly + 7}" font-size="13" fill="#374151" font-weight="600">${e(d.label)}</text>
<text x="${legendX + 22}" y="${ly + 22}" font-size="13" fill="#005957" font-weight="800">${d.value}${unit}</text>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${arcs}
${centerLabel}
${legend}
</svg>`;
  }

  return '';
}

function buildChartHtml(c: CardContent, index = 0, total = 1): string {
  const data = c.chartData ?? [];
  const chartType = c.chartType ?? 'bar';
  const unit = c.chartUnit ?? '';
  const chartW = 460;
  const chartH = chartType === 'donut' ? 200 : 260;

  const svgHtml = data.length > 0
    ? buildChartSvg(chartType, data, unit, chartW, chartH)
    : `<div style='color:#9CA3AF;font-size:14px;text-align:center;padding:40px'>데이터 없음</div>`;

  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='padding:32px 36px;height:100%;box-sizing:border-box;display:flex;flex-direction:column'>
    <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>
      ${LOGO}
      ${slideNumHtml(index, total)}
    </div>
    ${c.chartTitle ? `<div style='font-size:24px;font-weight:900;color:#191F28;line-height:1.2;letter-spacing:-0.02em;margin-bottom:4px'>${nl(c.chartTitle)}</div>` : ''}
    ${c.chartSubtitle ? `<div style='font-size:14px;color:#6B7280;margin-bottom:16px'>${e(c.chartSubtitle)}</div>` : '<div style="margin-bottom:16px"></div>'}
    <div style='flex:1;display:flex;align-items:center;justify-content:center'>
      ${svgHtml}
    </div>
    ${c.chartCaption ? `<div style='font-size:12px;color:#9CA3AF;text-align:center;margin-top:8px'>${e(c.chartCaption)}</div>` : ''}
  </div>
</div>`;
}

function buildCtaHtml(c: CardContent, index = 0, total = 1): string {
  const titleFs = headlineFs(c.ctaTitle || '지금 바로\n시작하세요');
  return `<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:linear-gradient(145deg,#003D3C,#005957 50%,#007A77)'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#1CC76E,rgba(28,199,110,0))'></div>
  <div style='position:absolute;top:-60px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.07)'></div>
  <div style='position:absolute;bottom:-50px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05)'></div>
  <div style='position:absolute;inset:0;padding:44px 44px;display:flex;flex-direction:column;justify-content:space-between'>
    <div style='display:flex;justify-content:space-between;align-items:center'>${LOGO_WHITE}${slideNumHtml(index, total, 'rgba(255,255,255,0.5)')}</div>
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

// 수정 1: index/total 파라미터 추가
export function buildCardHtml(card: CardContent, index = 0, total = 1): string {
  switch (card.type) {
    case 'cover':      return buildCoverHtml(card, index, total);
    case 'kpi':        return buildKpiHtml(card, index, total);
    case 'customers':  return buildCustomersHtml(card, index, total);
    case 'comparison': return buildComparisonHtml(card, index, total);
    case 'list':       return buildListHtml(card, index, total);
    case 'timeline':   return buildTimelineHtml(card, index, total);
    case 'chart':      return buildChartHtml(card, index, total);
    case 'cta':        return buildCtaHtml(card, index, total);
    default:           return buildCoverHtml(card, index, total);
  }
}

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const OUT = join('C:/Users/tmdgu/Downloads', `eficar_flyer_preview_${Date.now()}.jpg`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 1600 });

const TEMPLATE = process.argv[2] || 'gs25_event'; // 커맨드라인으로 템플릿 지정
await page.goto('http://localhost:3000/flyer', { waitUntil: 'networkidle' });

// 해당 템플릿 버튼 클릭
if (TEMPLATE !== 'gs25_event') {
  const btn = page.locator(`button:has-text("${
    TEMPLATE === 'brand_promo_a' ? '브랜드 홍보물 A형' :
    TEMPLATE === 'brand_promo_b' ? '브랜드 홍보물 B형' : TEMPLATE
  }")`);
  await btn.click();
  await page.waitForTimeout(500);
}

await page.waitForTimeout(1500); // QR blob URL 생성 대기

const flyerEl = await page.locator('[data-flyer-preview]').first().elementHandle().catch(() => null)
  ?? await page.locator('div').filter({ has: page.locator('text=GS25') }).first().elementHandle();

// previewRef 위치 찾기 - GS25 텍스트가 있는 첫 번째 자식 div
const previewDiv = await page.evaluate(() => {
  // "미리보기" 텍스트 다음 div 안의 첫번째 자식(previewRef) 찾기
  const labels = Array.from(document.querySelectorAll('div'));
  const label = labels.find(el => el.textContent?.trim() === '미리보기' && el.children.length === 0);
  if (label) {
    const container = label.nextElementSibling;
    if (container) {
      const inner = container.querySelector('div');
      if (inner) return inner.getBoundingClientRect();
    }
  }
  // fallback: 480px 너비 div 찾기
  for (const div of labels) {
    if (div.style.width === '480px') return div.getBoundingClientRect();
  }
  return null;
});

if (previewDiv) {
  // 이벤트 섹션 실제 높이 확인
  const heights = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    const flyer = allDivs.find(d => d.style.width === '480px');
    if (!flyer) return {};
    const sections = Array.from(flyer.children).map((el, i) => ({
      i, scrollH: el.scrollHeight, clientH: el.clientHeight,
    }));
    return { flyerH: flyer.clientHeight, flyerScrollH: flyer.scrollHeight, sections };
  });
  console.log('HEIGHTS:', JSON.stringify(heights, null, 2));

  const screenshot = await page.screenshot({
    clip: { x: previewDiv.x, y: previewDiv.y, width: previewDiv.width, height: previewDiv.height },
    type: 'jpeg',
    quality: 95,
  });
  writeFileSync(OUT, screenshot);
  console.log('SAVED:' + OUT);
} else {
  // fallback: 전체 페이지 우측 절반 캡처
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 95 });
  writeFileSync(OUT, screenshot);
  console.log('SAVED_FALLBACK:' + OUT);
}

await browser.close();

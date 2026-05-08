import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CUSTOMERS = [
  '롯데렌탈_장기차',
  'SK렌터카',
  '롯데렌탈',
  '삼성',
  '그린카',
  '일반',
  'CAR123',
];

const CAR_TYPES = ['국산', '외산'];
const PART_TYPES = ['중고', '재제조', '품질인증', 'OEM'];

const ITEMS = [
  '헤드램프 (현대 쏘나타)',
  '헤드램프 (기아 K5)',
  '테일램프 (현대 아반떼)',
  '테일램프 (기아 스포티지)',
  '앞범퍼 (현대 그랜저)',
  '뒷범퍼 (기아 카니발)',
  '알로이 휠 (18인치)',
  '알로이 휠 (19인치)',
  '사이드미러 (현대 투싼)',
  '사이드미러 좌측 (기아 셀토스)',
  '앞도어 우측 (현대 팰리세이드)',
  '뒷도어 좌측 (기아 모하비)',
  '윈드실드 유리 (현대 아이오닉6)',
  '라디에이터 그릴 (기아 EV6)',
  '펜더 우측 (현대 코나)',
  '헤드램프 (BMW 5시리즈)',
  '테일램프 (Mercedes E클래스)',
  '앞범퍼 (Audi A6)',
  '사이드미러 (BMW 3시리즈)',
  '알로이 휠 (20인치, 수입)',
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 고객사별 기본 월매출 규모 설정
const BASE_SALES = {
  '롯데렌탈_장기차': 120_000_000,
  'SK렌터카':         95_000_000,
  '롯데렌탈':         80_000_000,
  '삼성':             55_000_000,
  '그린카':           45_000_000,
  '일반':             30_000_000,
  'CAR123':           20_000_000,
};

const rows = [['판매일자', '서비스유형', '차량구분', '부품유형', '품목명', '판매금액']];

// 2025-06 ~ 2026-04 (11개월)
const months = [];
for (let m = 6; m <= 12; m++) months.push(`2025-${String(m).padStart(2, '0')}`);
for (let m = 1; m <= 4; m++)  months.push(`2026-${String(m).padStart(2, '0')}`);

for (const month of months) {
  for (const customer of CUSTOMERS) {
    const base = BASE_SALES[customer];

    // 그린카: 2026-03부터 급감 시뮬레이션
    let multiplier = 1 + (Math.random() * 0.3 - 0.15); // ±15% 랜덤
    if (customer === '그린카' && month >= '2026-03') {
      multiplier *= 0.35; // -65% 급감 → ⚠️ 경고 발생
    }

    const targetSales = Math.round(base * multiplier);
    const unitPrice = rand(300_000, 3_500_000);
    const txCount = Math.max(1, Math.round(targetSales / unitPrice));

    let accumulated = 0;
    for (let i = 0; i < txCount; i++) {
      const isLast = i === txCount - 1;
      const amount = isLast
        ? Math.max(100_000, targetSales - accumulated)
        : Math.round(unitPrice * (0.7 + Math.random() * 0.6));

      accumulated += amount;

      const item = pick(ITEMS);
      const isImport = item.includes('BMW') || item.includes('Mercedes') || item.includes('Audi');

      rows.push([
        month,
        customer,
        isImport ? '외산' : pick(CAR_TYPES),
        pick(PART_TYPES),
        item,
        amount,
      ]);
    }
  }
}

const ws = XLSX.utils.aoa_to_sheet(rows);

// 컬럼 너비 설정
ws['!cols'] = [
  { wch: 12 }, // 판매일자
  { wch: 18 }, // 서비스유형
  { wch: 8 },  // 차량구분
  { wch: 10 }, // 부품유형
  { wch: 30 }, // 품목명
  { wch: 14 }, // 판매금액
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '매출데이터');

const outPath = join(__dirname, '..', 'public', 'sample-data.xlsx');
XLSX.writeFile(wb, outPath);

console.log(`✅ 샘플 파일 생성 완료: ${outPath}`);
console.log(`   총 ${rows.length - 1}개 행, ${months.length}개월, ${CUSTOMERS.length}개 고객사`);

import * as XLSX from 'xlsx';
import type { SalesRecord } from './types';

/**
 * 정확한 일치를 먼저 시도하고, 없으면 부분 일치를 시도합니다.
 * 기존 코드는 "어느 키워드든 포함하는 첫 번째 헤더"를 찾아서
 * 순서에 따라 잘못된 컬럼이 선택될 수 있었습니다.
 */
function findColIndex(headers: string[], keywords: string[]): number {
  // 1단계: 정확히 일치하는 헤더 (e.g. "판매일자" === "판매일자")
  for (const k of keywords) {
    const idx = headers.indexOf(k);
    if (idx !== -1) return idx;
  }
  // 2단계: 키워드를 포함하는 헤더 (e.g. "판매일자" includes "일자")
  for (const k of keywords) {
    const idx = headers.findIndex(h => h.includes(k));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * 날짜 셀 → "YYYY-MM" 문자열 변환
 *
 * 버그 수정:
 * - typeof raw === 'number' 를 먼저 처리 (xlsx가 날짜 셀을 Excel serial 숫자로 반환할 때)
 * - Date 객체 생성 없이 문자열 연산만 사용 (타임존 오류 방지)
 * - XLSX.SSF.parse_date_code 실패 시 수동 계산 fallback 추가
 */
function parseDate(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '';

  // xlsx가 날짜 셀을 숫자(Excel serial)로 반환한 경우
  // cellDates: false 옵션을 써도 날짜 타입 셀은 숫자로 들어옵니다
  if (typeof raw === 'number') {
    if (raw > 40000 && raw < 70000) {
      try {
        const d = XLSX.SSF.parse_date_code(raw);
        return `${d.y}-${String(d.m).padStart(2, '0')}`;
      } catch {
        // XLSX.SSF 실패 시: Excel serial → JS UTC timestamp 수동 계산
        // 25569 = 1970-01-01 기준 Excel serial (윈도우 모드)
        const ms = Math.round((raw - 25569) * 86400 * 1000);
        const d = new Date(ms);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
    }
    return '';
  }

  const str = String(raw).trim();
  if (!str) return '';

  // "2026-01" — 정확한 YYYY-MM
  if (/^\d{4}-\d{2}$/.test(str)) return str;

  // "2026-01-15" 또는 "2026-01-15T00:00:00"
  if (/^\d{4}-\d{2}/.test(str)) return str.substring(0, 7);

  // "2026.01" 또는 "2026.01.15"
  if (/^\d{4}\.\d{2}/.test(str)) {
    return `${str.substring(0, 4)}-${str.substring(5, 7)}`;
  }

  // "2026/01" 또는 "2026/01/15"
  if (/^\d{4}\/\d{2}/.test(str)) {
    return `${str.substring(0, 4)}-${str.substring(5, 7)}`;
  }

  // "202601" — 6자리 붙임 숫자
  if (/^\d{6}$/.test(str)) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}`;
  }

  // 숫자 문자열로 저장된 Excel serial (e.g. "46143")
  const num = Number(str);
  if (Number.isFinite(num) && Number.isInteger(num) && num > 40000 && num < 70000) {
    try {
      const d = XLSX.SSF.parse_date_code(num);
      return `${d.y}-${String(d.m).padStart(2, '0')}`;
    } catch {
      const ms = Math.round((num - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    }
  }

  return '';
}

export async function parseExcelFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) throw new Error('파일 읽기 실패');

        const wb = XLSX.read(buffer, {
          type: 'array',
          cellDates: false, // 날짜를 JS Date가 아닌 serial 숫자로 유지
        });

        const ws = wb.Sheets[wb.SheetNames[0]];
        console.log(`[에픽카] 시트: "${wb.SheetNames[0]}", 범위: ${ws['!ref']}`);

        const rows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: '',   // 빈 셀 → 빈 문자열
          raw: true,    // 숫자/날짜를 포맷된 문자열이 아닌 raw 값으로 반환
          blankrows: false, // 완전히 비어있는 행은 건너뜀
        }) as unknown[][];

        console.log(`[에픽카] 읽은 행 수 (헤더 포함): ${rows.length}행`);

        if (rows.length < 2) throw new Error('데이터가 없습니다');

        const headers = rows[0].map(h => String(h).trim());
        console.log('[에픽카] 헤더:', headers);

        const dateIdx    = findColIndex(headers, ['판매일자', '일자', '날짜', 'date']);
        const serviceIdx = findColIndex(headers, ['서비스유형', '서비스', '고객사', 'service']);
        const carTypeIdx = findColIndex(headers, ['차량구분', '차량', 'car']);
        const partTypeIdx = findColIndex(headers, ['부품유형', '부품', 'part']);
        const itemIdx    = findColIndex(headers, ['품목명', '품목', 'item', '제품']);
        const amountIdx  = findColIndex(headers, ['판매금액', '금액', '매출', 'amount', 'sales']);

        // 어느 컬럼이 선택됐는지 명시적으로 출력
        console.log('[에픽카] 컬럼 매핑:', {
          판매일자:  dateIdx    >= 0 ? `[${dateIdx}] "${headers[dateIdx]}"` : '❌ 미발견',
          서비스유형: serviceIdx >= 0 ? `[${serviceIdx}] "${headers[serviceIdx]}"` : '❌ 미발견',
          차량구분:  carTypeIdx >= 0 ? `[${carTypeIdx}] "${headers[carTypeIdx]}"` : '(없음)',
          부품유형:  partTypeIdx >= 0 ? `[${partTypeIdx}] "${headers[partTypeIdx]}"` : '(없음)',
          품목명:    itemIdx    >= 0 ? `[${itemIdx}] "${headers[itemIdx]}"` : '(없음)',
          판매금액:  amountIdx  >= 0 ? `[${amountIdx}] "${headers[amountIdx]}"` : '❌ 미발견',
        });

        if (amountIdx === -1) throw new Error(`판매금액 컬럼을 찾을 수 없습니다. 헤더: [${headers.join(', ')}]`);
        if (dateIdx === -1) throw new Error(`판매일자 컬럼을 찾을 수 없습니다. 헤더: [${headers.join(', ')}]`);

        const records: SalesRecord[] = [];
        let skippedNoAmount = 0;  // 금액 셀 자체가 비어있는 행
        let skippedBadDate  = 0;  // 날짜 파싱 실패한 행

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as unknown[];
          if (!row || row.length === 0) continue;

          // ── 날짜 파싱 ──────────────────────────────────────────────────
          const date = parseDate(row[dateIdx]);
          if (!date || date.length < 7) {
            skippedBadDate++;
            if (skippedBadDate <= 10) {
              console.warn(
                `[에픽카] ${i + 1}행 날짜 파싱 실패:`,
                row[dateIdx],
                `(type: ${typeof row[dateIdx]})`,
                '→ 행 제외',
              );
            }
            continue;
          }

          // ── 금액 파싱 ──────────────────────────────────────────────────
          // 버그 수정: 기존에는 amount <= 0 이면 행 전체를 제외했습니다.
          // 0원 거래나 음수 매출(반품)도 거래건수에 포함해야 합니다.
          // 셀 자체가 비어있는 경우만 제외합니다.
          const rawAmount = row[amountIdx];
          if (rawAmount === '' || rawAmount === null || rawAmount === undefined) {
            skippedNoAmount++;
            continue;
          }

          const amount = typeof rawAmount === 'number'
            ? rawAmount
            : parseFloat(String(rawAmount).replace(/[,₩\s원]/g, '')) || 0;

          records.push({
            date: date.substring(0, 7),
            service: (serviceIdx >= 0 && row[serviceIdx] !== '' && row[serviceIdx] !== null)
              ? String(row[serviceIdx]).trim() || '미분류'
              : '미분류',
            carType:  String(carTypeIdx  >= 0 ? (row[carTypeIdx]  ?? '') : '').trim(),
            partType: String(partTypeIdx >= 0 ? (row[partTypeIdx] ?? '') : '').trim(),
            itemName: (itemIdx >= 0 && row[itemIdx] !== '' && row[itemIdx] !== null)
              ? String(row[itemIdx]).trim() || '미분류'
              : '미분류',
            amount,
          });
        }

        // ── 진단 로그 (거래건수 중복 검증) ─────────────────────────────
        console.log('');
        console.log('[에픽카] ═══ 파싱 진단 ═══════════════════════════════════');
        console.log(`[에픽카] 원시 행 수 (헤더 포함): ${rows.length}행`);
        console.log(`[에픽카] 파싱된 유효 레코드 전체: ${records.length}건`);

        // 전체 월 집계 (행수 + 판매금액 합계)
        const allDates = [...new Set(records.map(r => r.date))].sort();
        console.log(`[에픽카] 월 수: ${allDates.length}개월`);
        for (const m of allDates) {
          const monthRecs = records.filter(r => r.date === m);
          const monthSales = monthRecs.reduce((s, r) => s + r.amount, 0);
          console.log(`[에픽카] ${m}: ${monthRecs.length}행, ${monthSales.toLocaleString()}원`);
        }
        console.log('[에픽카] ════════════════════════════════════════════════');
        console.log('');

        // ── 검증 로그 ────────────────────────────────────────────────────
        // 월별 × 서비스유형별 집계 (불일치 추적용)
        type MonthService = Record<string, Record<string, { count: number; sales: number }>>;
        const breakdown: MonthService = {};
        for (const r of records) {
          if (!breakdown[r.date]) breakdown[r.date] = {};
          if (!breakdown[r.date][r.service]) breakdown[r.date][r.service] = { count: 0, sales: 0 };
          breakdown[r.date][r.service].count++;
          breakdown[r.date][r.service].sales += r.amount;
        }

        const sortedMonths = Object.keys(breakdown).sort();

        console.log(
          `[에픽카] ✅ 파싱 완료 — 유효: ${records.length}건`,
          `| 금액 빈셀 제외: ${skippedNoAmount}건`,
          `| 날짜 오류 제외: ${skippedBadDate}건`,
        );

        // 월별 합계 (원 단위 정확한 값)
        const monthSummary = sortedMonths.map(m => {
          const services = breakdown[m];
          const totalCount = Object.values(services).reduce((s, v) => s + v.count, 0);
          const totalSales = Object.values(services).reduce((s, v) => s + v.sales, 0);
          return `${m}: ${totalSales.toLocaleString()}원 (${totalCount}건)`;
        });
        console.log('[에픽카] 월별 합계 ▼');
        monthSummary.forEach(s => console.log(' ', s));

        // 서비스유형별 세분화 (매출 불일치 추적용)
        console.log('[에픽카] 서비스유형별 세분화 ▼');
        sortedMonths.forEach(m => {
          const services = breakdown[m];
          const rows = Object.entries(services)
            .sort(([, a], [, b]) => b.sales - a.sales)
            .map(([svc, v]) => `    ${svc}: ${v.sales.toLocaleString()}원 (${v.count}건)`);
          console.log(`  ── ${m} ──`);
          rows.forEach(r => console.log(r));
        });

        if (records.length === 0) throw new Error('유효한 데이터가 없습니다. 컬럼명과 데이터 형식을 확인해주세요.');

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.readAsArrayBuffer(file);
  });
}

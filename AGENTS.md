# 에픽카 마케팅 대시보드 — AGENTS.md

## 프로젝트 개요

에픽카(자동차 대체부품 B2B 솔루션) 영업팀 전용 마케팅 대시보드.
엑셀 파일 업로드 → 매출 분석 → AI 제안서·콘텐츠 생성 → 캠페인 관리 → Notion 자동 기록 흐름.

- **회사**: 에픽카 (eficar@eficar.co.kr)
- **주요 고객사**: SK렌터카, 롯데렌탈, 삼성화재, 그린카
- **주력 제품**: 헤드램프, 휠, 에픽커넥트, 에픽렌즈
- **GitHub**: https://github.com/dkdrma0009-code/-.git
- **로컬 경로**: `c:\eficar-dashboard`

## 기술 스택

- **프레임워크**: Next.js 16 (App Router), TypeScript, React 18
- **UI**: Tailwind CSS, Recharts, lucide-react
- **AI**: Gemini 2.5 Flash (`gemini-2.5-flash`) — **thinkingConfig 사용 금지** (400 오류 발생)
- **스토리지**: localStorage (주), Supabase (백그라운드 동기화)
- **외부 연동**: Notion API (개발 일지·보고서 자동 저장)
- **기타**: xlsx (엑셀 파싱), jspdf + html2canvas (PDF 생성)

## 환경 변수 (.env.local)

```
GEMINI_API_KEY=...          # https://aistudio.google.com/app/apikey
NOTION_TOKEN=...            # Notion Integration Token
NOTION_REPORT_PAGE_ID=...   # Notion 부모 페이지 ID
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 디렉토리 구조

```
app/
  page.tsx                  # 메인 대시보드 (파일 업로드 + Dashboard 렌더)
  layout.tsx                # 루트 레이아웃 (AppHeader 포함)
  providers.tsx             # Suspense 래퍼

  calculator/page.tsx       # OEM 대비 절감액 계산기
  compare/page.tsx          # 고객사 비교
  cardnews/page.tsx         # 카드뉴스 생성
  goals/page.tsx            # 목표 관리
  library/page.tsx          # 콘텐츠 라이브러리
  calendar/page.tsx         # 콘텐츠 캘린더
  report/page.tsx           # 월간 마케팅 보고서
  ai-coach/page.tsx         # AI 영업 코치
  campaigns/page.tsx        # 캠페인 성과 트래킹 + 예약 발송
  content/page.tsx          # 콘텐츠 생성 (카카오/이메일/LinkedIn/카드)
  proposal/page.tsx         # AI 제안서 생성 + 인라인 편집
  customers/[name]/page.tsx # 고객사 상세 (sk → SK렌터카, lotte → 롯데렌탈)

  api/
    content-generate/route.ts   # 콘텐츠 문구 생성 (Gemini)
    proposal/route.ts           # AI 제안서 생성 (Gemini → JSON)
    ai-insights/route.ts        # 대시보드 AI 인사이트
    ai-coach/route.ts           # AI 영업 코치
    marketing-report/route.ts   # 월간 마케팅 보고서
    notion-save/route.ts        # Notion 보고서 저장
    notion-devlog/route.ts      # Notion 개발 일지 저장
    ai-generate/route.ts        # 카드뉴스 문구 생성
    followup-reminder/route.ts  # 팔로업 알림

components/
  AppHeader.tsx             # 상단 네비게이션 (모든 페이지 공통)
  Dashboard.tsx             # 메인 대시보드 레이아웃
  KPICards.tsx              # KPI 카드 4개 (매출·성장률·거래건수·활성고객)
  MonthlyChart.tsx          # 월별 매출 바 차트 (Recharts)
  CustomerTable.tsx         # 고객사 테이블
  ProductPieChart.tsx       # 제품별 파이 차트
  CustomerModal.tsx         # 고객사 클릭 시 상세 모달
  CustomerReportModal.tsx   # 고객사 PDF 리포트 모달
  InsightCards.tsx          # 인사이트 카드 (최고 성장·이탈위험 등)
  AIInsightsPanel.tsx       # AI 인사이트 패널
  WarningBanner.tsx         # 이탈 위험 고객사 배너
  FileUpload.tsx            # 엑셀 파일 업로드

lib/
  types.ts                  # 공통 타입 (DashboardData, ViewData, MtdInfo 등)
  dataUtils.ts              # 데이터 계산 (computeViewData, MTD 로직 포함)
  parseExcel.ts             # 엑셀 → DashboardData 파싱
  campaignStorage.ts        # 캠페인 localStorage CRUD
  crmStorage.ts             # CRM 메모 localStorage CRUD
  goalsStorage.ts           # 목표 localStorage CRUD
  calendarStorage.ts        # 캘린더 localStorage CRUD
  libraryStorage.ts         # 라이브러리 localStorage CRUD
  supabase.ts               # Supabase 클라이언트
  syncManager.ts            # localStorage → Supabase 동기화

hooks/
  useCountUp.ts             # 숫자 카운트업 애니메이션
```

## 핵심 데이터 흐름

1. **엑셀 업로드** → `lib/parseExcel.ts` → `DashboardData` 생성
2. **`DashboardData`** 구조:
   - `records: SalesRecord[]` — 날짜(YYYY-MM)·고객사·제품·금액
   - `customers: string[]` — 고객사 목록
   - `allMonths: string[]` — 전체 월 목록
   - `currentMonth / latestMonth` — 선택 월 / 가장 최신 월
   - `monthlyData` — 월별 집계
3. **`computeViewData`** (`lib/dataUtils.ts`) — 선택 월 기준 KPI 계산
   - 진행 중인 달(`isLatestMonth`)이면 MTD 일평균 비교 방식 적용
   - `MtdInfo`: `todayDay · daysInMonth · dailyRate · projectedSales · prevDailyRate`

## 주요 구현 규칙

### Gemini API 호출 시 주의사항
```ts
// 반드시 이 형태로만 호출
generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
// thinkingConfig 절대 포함 금지 — 400 오류 발생
```

### 고객사 slug 매칭 (customers/[name]/page.tsx)
```ts
const SLUG_MATCH = {
  sk: (n: string) => /sk/i.test(n),
  lotte: (n: string) => /롯데|그린카/i.test(n),
};
```

### 제안서 → 콘텐츠 연동
- `app/proposal/page.tsx`에서 sessionStorage(`eficar-proposal-context`)에 `{ title, items, nextStep }` 저장
- `app/content/page.tsx` 마운트 시 읽어서 `linkedProposal` 상태 세팅
- API 호출 시 `proposalContext`로 전달 → Gemini 프롬프트에 반영

### MTD 비교 로직
- 날짜 데이터가 YYYY-MM 단위로만 저장됨 (일별 없음)
- 진행 중인 달: `일평균 = 현재 매출 ÷ 오늘 날짜`
- 전월 일평균: `전월 매출 ÷ 전월 일수`
- 성장률 = `(이번달 일평균 - 전월 일평균) / 전월 일평균 × 100`

### localStorage 키 목록
- `eficar-campaigns` — 캠페인 레코드
- `eficar-crm-{customerName}` — CRM 메모
- `eficar-goals` — 목표 금액
- `eficar-calendar` — 콘텐츠 캘린더
- `eficar-library` — 콘텐츠 라이브러리

## 현재 구현된 페이지 목록

| 경로 | 기능 |
|------|------|
| `/` | 메인 대시보드 (엑셀 업로드 + KPI + 차트) |
| `/customers/sk` | SK렌터카 상세 |
| `/customers/lotte` | 롯데렌탈 상세 |
| `/proposal` | AI 제안서 생성 + 인라인 편집 |
| `/content` | 콘텐츠 문구 생성 (카카오·이메일·LinkedIn·카드) |
| `/campaigns` | 캠페인 트래킹 + 예약 발송 |
| `/report` | 월간 마케팅 보고서 + Notion 저장 |
| `/ai-coach` | AI 영업 코치 |
| `/goals` | 목표 관리 |
| `/calendar` | 콘텐츠 캘린더 |
| `/library` | 콘텐츠 라이브러리 |
| `/calculator` | OEM 대비 절감액 계산기 |
| `/compare` | 고객사 비교 |
| `/cardnews` | 카드뉴스 생성 |

## 개발 서버 실행

```bash
npm run dev   # http://localhost:3000
```

터미널에서 직접 실행할 것 — Codex가 백그라운드로 실행하면 프로세스가 종료될 수 있음.

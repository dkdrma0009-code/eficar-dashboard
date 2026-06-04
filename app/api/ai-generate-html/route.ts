import { NextRequest, NextResponse } from 'next/server';
import type { CardFormInput } from '@/app/cardnews/types';
import { callGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

const EFICAR_CONTEXT = `에픽카(자동차 대체부품 B2B 솔루션):
- 고객사: 롯데렌탈, SK렌터카, 삼성화재, 그린카
- 핵심 수치: 공급량 304% 성장 / 매출 850% 성장 / 1만대당 연간 1.6억 절감 / 그린카 업무 90% 절감
- 제품: 헤드램프, 휠, 에픽커넥트(사고처리 자동화), 에픽렌즈(AI 부품 판독)
- 연락처: eficar@eficar.co.kr / 010-2752-1054`;

const LOGO = `<div style='display:flex;align-items:center;gap:6px'><div style='width:24px;height:24px;border-radius:6px;background:#005957;display:flex;align-items:center;justify-content:center'><span style='color:#fff;font-weight:900;font-size:13px;line-height:1'>∞</span></div><span style='font-weight:800;font-size:14px;color:#191F28;letter-spacing:-0.3px'>에픽카</span></div>`;
const LOGO_WHITE = `<div style='display:flex;align-items:center;gap:6px'><div style='width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center'><span style='color:#fff;font-weight:900;font-size:13px;line-height:1'>∞</span></div><span style='font-weight:800;font-size:14px;color:#fff;letter-spacing:-0.3px'>에픽카</span></div>`;

const DESIGN_SYSTEM = `
【에픽카 카드뉴스 디자인 시스템】
카드: 540×540px 정방형. font-family:Pretendard,-apple-system,sans-serif. 모든 스타일 인라인.

색상:
#005957 메인틸 | #1CC76E 밝은그린 | #E8F5F2 연한틸배경 | #191F28 본문 | #6B7280 보조

로고(어두운배경): ${LOGO_WHITE}
로고(밝은배경): ${LOGO}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【1. 커버 — 스플릿 레이아웃】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='position:absolute;top:0;left:0;bottom:0;width:324px;padding:40px 36px;display:flex;flex-direction:column;justify-content:space-between'>
    <div>${LOGO}</div>
    <div>
      <div style='display:inline-block;background:#E8F5F2;border:1px solid rgba(0,89,87,0.2);border-radius:100px;padding:5px 14px;font-size:13px;font-weight:700;color:#005957;margin-bottom:20px'>에픽카 솔루션</div>
      <div style='width:40px;height:3px;background:#005957;border-radius:2px;margin-bottom:16px'></div>
      <div style='font-size:42px;font-weight:900;color:#191F28;line-height:1.15;letter-spacing:-0.025em'>부품비를<br>줄이는 방법</div>
      <div style='font-size:16px;font-weight:500;color:#6B7280;margin-top:14px;line-height:1.5'>데이터 기반 대체부품 공급 플랫폼</div>
    </div>
    <div style='font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.04em'>eficar.co.kr</div>
  </div>
  <div style='position:absolute;top:0;right:0;bottom:0;width:216px;background:linear-gradient(145deg,#004745,#005957 50%,#007A77);overflow:hidden'>
    <div style='position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.07)'></div>
    <div style='position:absolute;bottom:-50px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05)'></div>
    <div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:120px;font-weight:900;color:rgba(255,255,255,0.12);line-height:1;letter-spacing:-0.05em;user-select:none'>∞</div>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【2. KPI 수치 카드】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='position:absolute;top:0;left:0;right:0;padding:36px 40px'>
    <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:32px'>
      ${LOGO}
      <div style='font-size:12px;font-weight:700;color:#005957;letter-spacing:0.1em'>매출 성장</div>
    </div>
    <div style='font-size:30px;font-weight:900;color:#191F28;line-height:1.2;letter-spacing:-0.02em;margin-bottom:28px'><span style='color:#191F28'>전년 대비 </span><span style='color:#005957'>매출 성장률</span></div>
    <div style='background:#E8F5F2;border-radius:20px;padding:40px;border:1px solid rgba(0,89,87,0.12)'>
      <div style='font-size:14px;font-weight:700;color:#005957;margin-bottom:14px'>[전년 대비 매출성장]</div>
      <div style='font-size:96px;font-weight:900;color:#005957;line-height:0.85;letter-spacing:-0.04em'>850%</div>
      <div style='font-size:16px;font-weight:500;color:#6B7280;margin-top:18px'>월평균 성장률 11.3%로 매출 급성장 중</div>
    </div>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【3. 고객사 실적 카드 — 2×2 그리드】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px'>${LOGO}<span style='font-size:12px;color:#6B7280'>파트너사 실적</span></div>
  <div style='font-size:28px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px'><span style='color:#191F28'>함께하는 파트너사 </span><span style='color:#005957'>실제 성과</span></div>
  <div style='display:grid;grid-template-columns:1fr 1fr;gap:14px'>
    <div style='background:#F8FBFA;border:1px solid rgba(0,89,87,0.12);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;height:140px'>
      <div><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:4px'>SK렌터카</div><div style='font-size:13px;color:#6B7280'>연간 절감액</div></div>
      <div><div style='font-size:38px;font-weight:900;color:#005957;line-height:0.9;letter-spacing:-0.03em'>1.6억</div><div style='font-size:12px;color:#9CA3AF;margin-top:5px'>차량 1만대 기준</div></div>
    </div>
    <div style='background:#F8FBFA;border:1px solid rgba(0,89,87,0.12);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;height:140px'>
      <div><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:4px'>그린카</div><div style='font-size:13px;color:#6B7280'>업무 절감률</div></div>
      <div><div style='font-size:38px;font-weight:900;color:#005957;line-height:0.9;letter-spacing:-0.03em'>90%</div><div style='font-size:12px;color:#9CA3AF;margin-top:5px'>에픽커넥트 도입 후</div></div>
    </div>
    <div style='background:#F8FBFA;border:1px solid rgba(0,89,87,0.12);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;height:140px'>
      <div><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:4px'>롯데렌탈</div><div style='font-size:13px;color:#6B7280'>공급량 성장률</div></div>
      <div><div style='font-size:38px;font-weight:900;color:#005957;line-height:0.9;letter-spacing:-0.03em'>304%</div><div style='font-size:12px;color:#9CA3AF;margin-top:5px'>전년 대비</div></div>
    </div>
    <div style='background:#E8F5F2;border:1px solid rgba(0,89,87,0.18);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;height:140px'>
      <div><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:4px'>에픽카 파트너사</div><div style='font-size:13px;color:#6B7280'>매출 성장률</div></div>
      <div><div style='font-size:38px;font-weight:900;color:#005957;line-height:0.9;letter-spacing:-0.03em'>850%</div><div style='font-size:12px;color:#9CA3AF;margin-top:5px'>전년 대비</div></div>
    </div>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【4. 비교표 카드】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:22px'>${LOGO}<span style='font-size:12px;color:#6B7280'>비교 분석</span></div>
  <div style='font-size:26px;font-weight:900;color:#191F28;letter-spacing:-0.02em;margin-bottom:22px'>OEM vs <span style='color:#005957'>에픽카</span> 대체부품</div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;border-bottom:2px solid #E5E7EB;padding-bottom:10px;margin-bottom:4px'>
    <div></div>
    <div style='font-size:13px;font-weight:700;color:#9CA3AF;text-align:center'>OEM</div>
    <div style='text-align:center'><span style='background:#005957;border-radius:100px;padding:3px 12px;font-size:12px;font-weight:700;color:#fff'>에픽카</span></div>
  </div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;height:64px;align-items:center;border-bottom:1px solid #F3F4F6'><div style='font-size:16px;font-weight:600;color:#374151'>단가</div><div style='font-size:15px;color:#9CA3AF;text-align:center'>정가</div><div style='text-align:center'><span style='background:#E8F5F2;border-radius:8px;padding:5px 12px;font-size:15px;font-weight:800;color:#005957'>–30~40%</span></div></div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;height:64px;align-items:center;border-bottom:1px solid #F3F4F6'><div style='font-size:16px;font-weight:600;color:#374151'>납기</div><div style='font-size:15px;color:#9CA3AF;text-align:center'>3~5일</div><div style='text-align:center'><span style='background:#E8F5F2;border-radius:8px;padding:5px 12px;font-size:15px;font-weight:800;color:#005957'>당일~익일</span></div></div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;height:64px;align-items:center;border-bottom:1px solid #F3F4F6'><div style='font-size:16px;font-weight:600;color:#374151'>견적</div><div style='font-size:15px;color:#9CA3AF;text-align:center'>수동</div><div style='text-align:center'><span style='background:#E8F5F2;border-radius:8px;padding:5px 12px;font-size:15px;font-weight:800;color:#005957'>AI 자동</span></div></div>
  <div style='display:grid;grid-template-columns:1.4fr 1fr 1fr;height:64px;align-items:center'><div style='font-size:16px;font-weight:600;color:#374151'>사고처리</div><div style='font-size:14px;color:#9CA3AF;text-align:center'>전화 수십 통</div><div style='text-align:center'><span style='background:#E8F5F2;border-radius:8px;padding:5px 12px;font-size:15px;font-weight:800;color:#005957'>앱 하나</span></div></div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【5. 리스트 카드】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#fff;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:22px'>${LOGO}</div>
  <div style='font-size:28px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px'><span style='color:#191F28'>에픽카가 바꾼 </span><span style='color:#005957'>3가지</span></div>
  <div style='display:flex;flex-direction:column;gap:14px'>
    <div style='display:flex;align-items:flex-start;gap:16px;background:#F8FBFA;border:1px solid rgba(0,89,87,0.1);border-left:3px solid #005957;border-radius:0 12px 12px 0;padding:18px 20px'>
      <span style='font-size:22px;font-weight:900;color:#005957;line-height:1;flex-shrink:0'>1</span>
      <div><div style='font-size:18px;font-weight:800;color:#191F28;margin-bottom:4px'>에픽커넥트</div><div style='font-size:14px;color:#6B7280'>사고처리 자동화로 담당자 업무 90% 절감</div></div>
    </div>
    <div style='display:flex;align-items:flex-start;gap:16px;background:#F8FBFA;border:1px solid rgba(0,89,87,0.1);border-left:3px solid #005957;border-radius:0 12px 12px 0;padding:18px 20px'>
      <span style='font-size:22px;font-weight:900;color:#005957;line-height:1;flex-shrink:0'>2</span>
      <div><div style='font-size:18px;font-weight:800;color:#191F28;margin-bottom:4px'>에픽렌즈</div><div style='font-size:14px;color:#6B7280'>AI 기반 부품 판독, 견적 오류 제로화</div></div>
    </div>
    <div style='display:flex;align-items:flex-start;gap:16px;background:#F8FBFA;border:1px solid rgba(0,89,87,0.1);border-left:3px solid #005957;border-radius:0 12px 12px 0;padding:18px 20px'>
      <span style='font-size:22px;font-weight:900;color:#005957;line-height:1;flex-shrink:0'>3</span>
      <div><div style='font-size:18px;font-weight:800;color:#191F28;margin-bottom:4px'>헤드램프·휠</div><div style='font-size:14px;color:#6B7280'>OEM 대비 최대 40% 저렴한 품질 인증 부품</div></div>
    </div>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【6. CTA 카드】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:linear-gradient(145deg,#003D3C,#005957 50%,#007A77)'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#1CC76E,rgba(28,199,110,0))'></div>
  <div style='position:absolute;top:-60px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.07)'></div>
  <div style='position:absolute;bottom:-50px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05)'></div>
  <div style='position:absolute;inset:0;padding:44px 44px;display:flex;flex-direction:column;justify-content:space-between'>
    <div>${LOGO_WHITE}</div>
    <div>
      <div style='font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:0.1em;margin-bottom:14px'>에픽카 파트너십 문의</div>
      <div style='font-size:52px;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-0.03em'>지금 바로<br>시작하세요</div>
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
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【6. 타임라인 카드 — 단계별 프로세스】예시 HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<div style='width:540px;height:540px;overflow:hidden;box-sizing:border-box;font-family:Pretendard,-apple-system,sans-serif;position:relative;background:#F7F9FC;padding:36px 40px'>
  <div style='position:absolute;top:0;left:0;right:0;height:4px;background:#005957'></div>
  <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>${LOGO}<span style='font-size:12px;color:#6B7280'>도입 프로세스</span></div>
  <div style='font-size:26px;font-weight:900;color:#191F28;letter-spacing:-0.02em;margin-bottom:28px'>2주 안에 <span style='color:#005957'>시작할 수 있습니다</span></div>
  <div style='display:flex;flex-direction:column;gap:0'>
    <div style='display:flex;gap:16px;height:100px'>
      <div style='display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px'>
        <div style='width:36px;height:36px;border-radius:50%;background:#005957;display:flex;align-items:center;justify-content:center;flex-shrink:0'><span style='font-size:15px;font-weight:900;color:#fff'>1</span></div>
        <div style='flex:1;width:2px;background:linear-gradient(180deg,#005957,rgba(0,89,87,0.2));margin-top:4px'></div>
      </div>
      <div style='padding-top:6px'><div style='font-size:17px;font-weight:800;color:#005957;margin-bottom:5px'>현황 분석</div><div style='font-size:14px;color:#6B7280;line-height:1.4'>부품 사용 패턴 파악 및 절감 가능액 진단</div></div>
    </div>
    <div style='display:flex;gap:16px;height:100px'>
      <div style='display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px'>
        <div style='width:36px;height:36px;border-radius:50%;background:#fff;border:2px solid #CBD5E1;display:flex;align-items:center;justify-content:center;flex-shrink:0'><span style='font-size:15px;font-weight:900;color:#94A3B8'>2</span></div>
        <div style='flex:1;width:2px;background:linear-gradient(180deg,rgba(0,89,87,0.2),rgba(0,89,87,0.1));margin-top:4px'></div>
      </div>
      <div style='padding-top:6px'><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:5px'>파일럿 세팅</div><div style='font-size:14px;color:#6B7280;line-height:1.4'>2주 내 운영 시작, 초기 비용 없음</div></div>
    </div>
    <div style='display:flex;gap:16px;height:100px'>
      <div style='display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px'>
        <div style='width:36px;height:36px;border-radius:50%;background:#fff;border:2px solid #CBD5E1;display:flex;align-items:center;justify-content:center;flex-shrink:0'><span style='font-size:15px;font-weight:900;color:#94A3B8'>3</span></div>
        <div style='flex:1;width:2px;background:rgba(0,89,87,0.1);margin-top:4px'></div>
      </div>
      <div style='padding-top:6px'><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:5px'>효과 확인</div><div style='font-size:14px;color:#6B7280;line-height:1.4'>절감액 수치 리포트 자동 제공</div></div>
    </div>
    <div style='display:flex;gap:16px'>
      <div style='display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px'>
        <div style='width:36px;height:36px;border-radius:50%;background:#fff;border:2px solid #CBD5E1;display:flex;align-items:center;justify-content:center;flex-shrink:0'><span style='font-size:15px;font-weight:900;color:#94A3B8'>4</span></div>
      </div>
      <div style='padding-top:6px'><div style='font-size:17px;font-weight:800;color:#191F28;margin-bottom:5px'>전면 전환</div><div style='font-size:14px;color:#6B7280;line-height:1.4'>전 차량 대상 적용, 연간 1.6억 절감 달성</div></div>
    </div>
  </div>
</div>

【HTML 작성 규칙】
- 위 예시를 기반으로 내용만 바꿔서 생성. 구조와 스타일은 최대한 유지.
- 모든 스타일 인라인 (style='' 속성으로만)
- 이모지(🔄⚙️📦 등) 절대 금지 — 숫자 원형 배지로 대체
- 외부 이미지 금지. 로고는 위 예시 그대로 사용.
- 루트 div: width:540px;height:540px;overflow:hidden;box-sizing:border-box
- font-family:Pretendard,-apple-system,sans-serif 항상 명시
- 카드 타입별로 위 예시 패턴을 정확히 따를 것
- timeline 카드는 반드시 원형 번호 + 세로 연결선 구조로 작성
`;

const COPY_RULES = `
【카피라이팅 원칙】
- 헤드라인 15자 이내
- 수치 없는 카드 금지 — 반드시 구체적 숫자 포함
- 선언체: "절감했습니다" 아닌 "1.6억 절감"
- "혁신", "최적화", "스마트" 금지
`;

const CARD_SEQ: Record<number, string[]> = {
  3: ['cover', 'kpi', 'cta'],
  4: ['cover', 'kpi', 'comparison', 'cta'],
  5: ['cover', 'kpi', 'comparison', 'list', 'cta'],
  6: ['cover', 'kpi', 'comparison', 'customers', 'list', 'cta'],
  7: ['cover', 'kpi', 'comparison', 'customers', 'list', 'timeline', 'cta'],
};

function getSeq(count: number): string[] {
  if (count <= 3) return CARD_SEQ[3];
  if (CARD_SEQ[count]) return CARD_SEQ[count];
  const base = CARD_SEQ[7];
  const extra = count - 7;
  const seq = [...base];
  for (let i = 0; i < extra; i++) seq.splice(seq.length - 1, 0, 'list');
  return seq;
}

function buildPrompt(input: CardFormInput, cardCount: number): string {
  const metricsStr = [input.metric1, input.metric2, input.metric3]
    .filter(Boolean).join(', ');
  const seq = getSeq(cardCount);

  return `당신은 에픽카 브랜드 카드뉴스 디자이너입니다.
아래 정보를 바탕으로 ${cardCount}장의 카드뉴스를 HTML로 직접 디자인하세요.

${EFICAR_CONTEXT}

${DESIGN_SYSTEM}

${COPY_RULES}

【입력 정보】
주제: ${input.topic}
${input.targetCustomer ? `대상 고객사: ${input.targetCustomer}` : ''}
${metricsStr ? `강조 수치: ${metricsStr}` : ''}
${input.keyMessage ? `핵심 메시지: ${input.keyMessage}` : ''}

【카드 순서 — 반드시 이 순서로 ${cardCount}장】
${seq.map((t, i) => `${i + 1}. ${t}`).join('\n')}

【출력 형식 — 반드시 이 형식으로, 다른 텍스트 일절 금지】
각 카드 앞에 구분자를 쓰고 바로 HTML을 작성하세요:

===CARD:cover===
<div style='width:540px;height:540px;...'>...</div>
===CARD:kpi===
<div style='width:540px;height:540px;...'>...</div>

【중요】
- HTML 속성은 반드시 홑따옴표(')로 작성. 큰따옴표(") 절대 금지.
- 구분자(===CARD:타입===)와 HTML 사이에 빈 줄 없이 바로 이어서 작성
- 코드블록(\`\`\`) 금지
- 위 예시 패턴을 정확히 따르되 내용(텍스트, 수치)만 주제에 맞게 변경`;
}

function parseDelimited(raw: string): HtmlCard[] {
  const cards: HtmlCard[] = [];
  // 구분자로 분할
  const parts = raw.split(/===CARD:([^=]+)===/);
  // parts[0] = 앞 텍스트(버림), parts[1] = type, parts[2] = html, parts[3] = type, ...
  for (let i = 1; i < parts.length - 1; i += 2) {
    const type = parts[i].trim();
    const html = parts[i + 1].trim()
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    if (type && html) {
      cards.push({ type, title: type, html });
    }
  }
  return cards;
}

export interface HtmlCard {
  type: string;
  title: string;
  html: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<CardFormInput & { cardCount: number }>;
  const { topic, cardCount = 6, targetCustomer, metric1, metric2, metric3, keyMessage } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });
  }

  const count = Math.min(10, Math.max(3, Number(cardCount)));
  const input: CardFormInput = {
    topic: topic.trim(),
    targetCustomer,
    metric1, metric2, metric3,
    keyMessage,
    cardCount: count,
  };

  const prompt = buildPrompt(input, count);

  let rawText: string;
  try {
    rawText = await callGemini(prompt, { temperature: 0.8, maxOutputTokens: 16384 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }

  const cards = parseDelimited(rawText);

  if (!cards.length) {
    console.error('[ai-generate-html] parse failed. raw:', rawText.slice(0, 600));
    return NextResponse.json({ error: '카드 생성 실패 — 구분자를 찾을 수 없습니다', raw: rawText.slice(0, 400) }, { status: 500 });
  }

  console.log(`[ai-generate-html] OK cards=${cards.length}`);
  return NextResponse.json({ cards, mode: 'html' });
}

-- 팝빌 발송 결과 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

alter table campaign_send_logs
  add column if not exists popbill_result   text,        -- '0' = 성공, 그 외 = 실패 코드
  add column if not exists popbill_msg      text,        -- 결과 메시지 (예: "정상수신")
  add column if not exists delivered_at     timestamptz; -- 수신 완료 시각 (팝빌 resultDT)

-- 캠페인 발송 로그 테이블
-- Supabase SQL Editor에서 실행하세요

create table if not exists campaign_send_logs (
  id             text primary key,
  channel        text not null,
  customer       text not null default '',
  receiver_masked text not null default '',
  content_preview text not null default '',
  receipt_num    text,
  status         text not null default 'sent',
  sent_at        timestamptz not null default now(),
  open_at        timestamptz,
  click_at       timestamptz
);

-- 내부 대시보드용 RLS (인증 없이 접근 가능)
alter table campaign_send_logs enable row level security;
create policy "allow_all" on campaign_send_logs
  for all using (true) with check (true);

create table if not exists scheduled_sends (
  id          text primary key default gen_random_uuid()::text,
  scheduled_at timestamptz not null,
  channel     text not null,           -- 'email' | 'sms' | 'lms' | 'mms'
  customer    text,
  subject     text,
  content     text not null,
  recipients  jsonb not null default '[]', -- [{email/phone, name}]
  cta_label   text,
  cta_url     text,
  status      text not null default 'pending', -- 'pending' | 'sent' | 'failed'
  sent_at     timestamptz,
  result      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists scheduled_sends_scheduled_at on scheduled_sends (scheduled_at)
  where status = 'pending';

create table if not exists events (
  id uuid primary key,
  type text not null,
  actor_user_id uuid references users(id) on delete set null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_created on events(created_at desc);
create index if not exists idx_events_type on events(type);
create index if not exists idx_events_actor on events(actor_user_id);

create table if not exists sessions (
  id uuid primary key,
  match_id uuid not null references matches(id) on delete cascade,
  created_by_user_id uuid not null references users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null default 'online',
  location_text text,
  meeting_link text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_match on sessions(match_id);
create index if not exists idx_sessions_starts on sessions(starts_at);

create table if not exists blocks (
  blocker_user_id uuid not null references users(id) on delete cascade,
  blocked_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id)
);

create index if not exists idx_blocks_blocker on blocks(blocker_user_id);
create index if not exists idx_blocks_blocked on blocks(blocked_user_id);

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('STUDENT','ADMIN')),
  created_at timestamptz not null default now()
);

create table if not exists student_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  program text not null,
  year text not null,
  learning_style text,
  goals jsonb not null default '[]'::jsonb,
  bio text,
  collaboration_mode text not null default 'online',
  location text,
  contact_pref text not null default 'email',
  is_active boolean not null default true
);

create table if not exists units (
  id uuid primary key,
  code text not null,
  name text not null,
  department text
);

create table if not exists enrollments (
  user_id uuid references users(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  semester text,
  primary key (user_id, unit_id)
);

create table if not exists availability_slots (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null,
  end_time text not null
);

create table if not exists match_requests (
  id uuid primary key,
  from_user_id uuid not null references users(id) on delete cascade,
  to_user_id uuid not null references users(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  status text not null check (status in ('PENDING','ACCEPTED','DECLINED')),
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key,
  user1_id uuid not null references users(id) on delete cascade,
  user2_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists feedback (
  id uuid primary key,
  from_user_id uuid not null references users(id) on delete cascade,
  to_user_id uuid not null references users(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

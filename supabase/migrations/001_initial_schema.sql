-- LiveScore initial schema
create extension if not exists "uuid-ossp";

create type round_status as enum ('setup', 'active', 'completed');
create type game_mode as enum (
  'stroke', 'stableford', 'skins', 'scramble', 'best_ball', 'wolf', 'ryder'
);
create type round_event_type as enum (
  'score_updated', 'leaderboard_milestone', 'mode_changed', 'host_message'
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status round_status not null default 'setup',
  game_mode game_mode not null default 'stroke',
  mode_config jsonb not null default '{}',
  course_id text not null default 'wolf',
  tee_id text not null default 'yellow',
  handicaps_enabled boolean not null default false,
  host_player_id uuid,
  trip_name text default 'Bachelor Trip',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  display_name text not null,
  handicap_index numeric(4, 1),
  team_id uuid references teams(id) on delete set null,
  is_active boolean not null default true,
  is_host boolean not null default false,
  created_at timestamptz not null default now()
);

alter table rounds
  add constraint rounds_host_player_fk
  foreign key (host_player_id) references players(id) on delete set null;

create table scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  hole int not null check (hole >= 1 and hole <= 18),
  player_id uuid references players(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  strokes int not null check (strokes >= 1 and strokes <= 20),
  contributor_player_id uuid references players(id) on delete set null,
  entered_by_player_id uuid references players(id) on delete set null,
  wolf_points int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scores_player_or_team check (
    (player_id is not null and team_id is null) or
    (player_id is null and team_id is not null)
  )
);

create unique index scores_round_hole_player_unique
  on scores (round_id, hole, player_id) where player_id is not null;

create unique index scores_round_hole_team_unique
  on scores (round_id, hole, team_id) where team_id is not null;

create table round_events (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  event_type round_event_type not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (player_id, endpoint)
);

create index scores_round_id_idx on scores (round_id);
create index players_round_id_idx on players (round_id);
create index teams_round_id_idx on teams (round_id);
create index round_events_round_id_idx on round_events (round_id);

alter table rounds enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table scores enable row level security;
alter table round_events enable row level security;
alter table push_subscriptions enable row level security;

create policy "anon_all_rounds" on rounds for all using (true) with check (true);
create policy "anon_all_teams" on teams for all using (true) with check (true);
create policy "anon_all_players" on players for all using (true) with check (true);
create policy "anon_all_scores" on scores for all using (true) with check (true);
create policy "anon_all_round_events" on round_events for all using (true) with check (true);
create policy "anon_all_push_subscriptions" on push_subscriptions for all using (true) with check (true);

alter publication supabase_realtime add table scores;
alter publication supabase_realtime add table round_events;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table rounds;

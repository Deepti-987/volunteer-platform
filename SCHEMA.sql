-- ============================================================
-- VolunteerOps — Global Volunteer Coordination Platform
-- Complete Supabase SQL Schema
-- Run this entire file in Supabase SQL Editor → New Query
-- ============================================================

-- ── 1. volunteers ─────────────────────────────────────────────
create table if not exists volunteers (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  skills        text[] default '{}',
  availability  text not null default 'inactive' check (availability in ('active','inactive')),
  role          text not null default 'volunteer' check (role in ('volunteer','admin')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_volunteers_availability on volunteers(availability);
create index if not exists idx_volunteers_role          on volunteers(role);

alter table volunteers enable row level security;

-- ── Helper: check if current user is admin ────────────────────
-- NOTE: defined AFTER volunteers table so the reference resolves correctly
create or replace function is_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from volunteers
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "volunteers: read own row"
  on volunteers for select
  using (auth.uid() = id);

create policy "volunteers: update own row"
  on volunteers for update
  using (auth.uid() = id);

create policy "volunteers: insert own row"
  on volunteers for insert
  with check (auth.uid() = id);

create policy "admin: read all volunteers"
  on volunteers for select
  using (is_admin());

create policy "admin: update all volunteers"
  on volunteers for update
  using (is_admin());

-- ── 2. tasks ──────────────────────────────────────────────────
create table if not exists tasks (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description            text,
  location_name          text,
  lat                    double precision,
  lng                    double precision,
  required_skills        text[] default '{}',
  status                 text not null default 'pending'
                           check (status in ('pending','in_progress','completed','cancelled')),
  assigned_volunteer_id  uuid references volunteers(id) on delete set null,
  created_by             uuid references volunteers(id) on delete set null,
  priority               text not null default 'medium'
                           check (priority in ('low','medium','high','critical')),
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index if not exists idx_tasks_status      on tasks(status);
create index if not exists idx_tasks_priority    on tasks(priority);
create index if not exists idx_tasks_assigned    on tasks(assigned_volunteer_id);
create index if not exists idx_tasks_created_by  on tasks(created_by);

alter table tasks enable row level security;

create policy "volunteers: read own tasks"
  on tasks for select
  using (
    auth.uid() = assigned_volunteer_id
    or auth.uid() = created_by
    or is_admin()
  );

create policy "volunteers: update own assigned tasks"
  on tasks for update
  using (auth.uid() = assigned_volunteer_id or is_admin());

create policy "admin: insert tasks"
  on tasks for insert
  with check (is_admin());

create policy "admin: delete tasks"
  on tasks for delete
  using (is_admin());

-- ── 3. locations ──────────────────────────────────────────────
create table if not exists locations (
  id            uuid primary key default gen_random_uuid(),
  volunteer_id  uuid not null references volunteers(id) on delete cascade unique,
  lat           double precision not null,
  lng           double precision not null,
  updated_at    timestamptz default now()
);

create index if not exists idx_locations_volunteer on locations(volunteer_id);
create index if not exists idx_locations_updated   on locations(updated_at);

alter table locations enable row level security;

create policy "volunteers: upsert own location"
  on locations for all
  using (auth.uid() = volunteer_id)
  with check (auth.uid() = volunteer_id);

create policy "all authenticated: read locations"
  on locations for select
  using (auth.role() = 'authenticated');

-- ── 4. notifications ──────────────────────────────────────────
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  volunteer_id  uuid not null references volunteers(id) on delete cascade,
  title         text not null,
  message       text,
  type          text default 'info' check (type in ('info','warning','emergency','success')),
  read          boolean default false,
  created_at    timestamptz default now()
);

create index if not exists idx_notifications_volunteer on notifications(volunteer_id);
create index if not exists idx_notifications_read      on notifications(read);

alter table notifications enable row level security;

create policy "volunteers: read own notifications"
  on notifications for select
  using (auth.uid() = volunteer_id);

create policy "volunteers: update own notifications"
  on notifications for update
  using (auth.uid() = volunteer_id);

create policy "admin: insert notifications"
  on notifications for insert
  with check (is_admin() or auth.uid() = volunteer_id);

-- ── 5. broadcasts ─────────────────────────────────────────────
create table if not exists broadcasts (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  created_by  uuid references volunteers(id) on delete set null,
  created_at  timestamptz default now()
);

alter table broadcasts enable row level security;

create policy "admin: all access to broadcasts"
  on broadcasts for all
  using (is_admin())
  with check (is_admin());

-- ── 6. admin_logs ─────────────────────────────────────────────
create table if not exists admin_logs (
  id            uuid primary key default gen_random_uuid(),
  action        text not null,
  performed_by  uuid references volunteers(id) on delete set null,
  target_id     uuid,
  details       text,
  created_at    timestamptz default now()
);

create index if not exists idx_admin_logs_performed_by on admin_logs(performed_by);
create index if not exists idx_admin_logs_created_at   on admin_logs(created_at);

alter table admin_logs enable row level security;

create policy "admin: read all logs"
  on admin_logs for select
  using (is_admin());

create policy "authenticated: insert logs"
  on admin_logs for insert
  with check (auth.role() = 'authenticated');

-- ── Auto-update updated_at triggers ───────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger volunteers_updated_at
  before update on volunteers
  for each row execute function update_updated_at();

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- ── Enable Realtime on notifications ──────────────────────────
-- Run this to enable realtime for the notifications table:
-- Go to Supabase Dashboard → Database → Replication → Tables → enable notifications
-- OR run:
alter publication supabase_realtime add table notifications;

-- ── Done! ──────────────────────────────────────────────────────
-- All 6 tables created with RLS, indexes, and triggers.
-- Next: copy your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local

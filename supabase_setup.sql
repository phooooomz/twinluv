-- Together – Our Little World : Supabase setup
-- วิธีใช้: Supabase Dashboard > SQL Editor > New query > วางทั้งไฟล์ > Run
-- ก่อนหน้านั้นให้เปิด Authentication > Sign In / Providers > "Allow anonymous sign-ins"

-- ============ Tables ============
create table if not exists public.profiles (
  uid        uuid primary key references auth.users(id) on delete cascade,
  name       text,
  room_code  text,
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  room_code  text primary key check (room_code ~ '^[A-Z0-9]{6}$'),
  member_ids uuid[] not null default '{}',
  data       jsonb  not null default '{}'::jsonb,   -- worldName, members, coins, pet, createdAt
  created_at timestamptz not null default now()
);

-- daily / someday / quizzes / activities เก็บรวมในตารางเดียว แยกด้วยคอลัมน์ kind
create table if not exists public.room_docs (
  room_code  text not null references public.rooms(room_code) on delete cascade,
  kind       text not null check (kind in ('daily','someday','quizzes','activities')),
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (room_code, kind, id)
);

-- ============ Helper ============
create or replace function public.is_room_member(p_code text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.room_code = p_code and auth.uid() = any (r.member_ids)
  );
$$;

-- ============ Row Level Security ============
alter table public.profiles  enable row level security;
alter table public.rooms     enable row level security;
alter table public.room_docs enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (uid = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (uid = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

drop policy if exists rooms_select on public.rooms;
drop policy if exists rooms_insert on public.rooms;
drop policy if exists rooms_update on public.rooms;
create policy rooms_select on public.rooms for select to authenticated
  using (auth.uid() = any (member_ids));
create policy rooms_insert on public.rooms for insert to authenticated
  with check (cardinality(member_ids) = 1 and member_ids[1] = auth.uid());
create policy rooms_update on public.rooms for update to authenticated
  using (auth.uid() = any (member_ids)) with check (auth.uid() = any (member_ids));

drop policy if exists room_docs_all on public.room_docs;
create policy room_docs_all on public.room_docs for all to authenticated
  using (public.is_room_member(room_code)) with check (public.is_room_member(room_code));

-- ============ Privileges ============
revoke all on public.profiles, public.rooms, public.room_docs from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.rooms to authenticated;
grant update (data) on public.rooms to authenticated;   -- member_ids แก้ได้ผ่าน join_room() เท่านั้น
grant select, insert, update, delete on public.room_docs to authenticated;

-- ============ RPC functions ============
-- เข้าร่วมห้อง: ตรวจว่ามีห้อง, ไม่เกิน 2 คน แล้วเพิ่มผู้ใช้เข้าไป (security definer เพราะผู้เข้าร่วมยังไม่เป็นสมาชิก)
create or replace function public.join_room(p_code text, p_name text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_room public.rooms%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_room from public.rooms where room_code = upper(p_code) for update;
  if not found then raise exception 'room_not_found'; end if;

  if v_uid = any (v_room.member_ids) then return; end if;
  if cardinality(v_room.member_ids) >= 2 then raise exception 'room_full'; end if;

  update public.rooms
     set member_ids = array_append(member_ids, v_uid),
         data = jsonb_set(
                  data, '{members}',
                  coalesce(data->'members', '{}'::jsonb) ||
                  jsonb_build_object(v_uid::text, jsonb_build_object(
                    'uid', v_uid::text,
                    'name', p_name,
                    'role', 'partner',
                    'joinedAt', (extract(epoch from now()) * 1000)::bigint))
                )
   where room_code = v_room.room_code;
end;
$$;

-- merge ระดับ field บนของ rooms.data (เหมือน updateDoc ของ Firestore)
create or replace function public.patch_room(p_code text, p_patch jsonb)
returns void
language sql security invoker
set search_path = public
as $$
  update public.rooms
     set data = data || (p_patch - 'members')
   where room_code = p_code;
$$;

-- เพิ่ม/ลดเหรียญแบบ atomic (กันค่าทับกันเมื่อสองคนกดพร้อมกัน)
create or replace function public.add_coins(p_code text, p_amount int)
returns void
language sql security invoker
set search_path = public
as $$
  update public.rooms
     set data = jsonb_set(
           data, '{coins}',
           to_jsonb(greatest(0, coalesce((data->>'coins')::int, 0) + p_amount)))
   where room_code = p_code;
$$;

create or replace function public.patch_doc(p_code text, p_kind text, p_id text, p_patch jsonb)
returns void
language sql security invoker
set search_path = public
as $$
  update public.room_docs
     set data = data || p_patch
   where room_code = p_code and kind = p_kind and id = p_id;
$$;

revoke execute on function public.join_room(text, text)            from public, anon;
revoke execute on function public.patch_room(text, jsonb)          from public, anon;
revoke execute on function public.add_coins(text, int)             from public, anon;
revoke execute on function public.patch_doc(text, text, text, jsonb) from public, anon;
grant  execute on function public.join_room(text, text)            to authenticated;
grant  execute on function public.patch_room(text, jsonb)          to authenticated;
grant  execute on function public.add_coins(text, int)             to authenticated;
grant  execute on function public.patch_doc(text, text, text, jsonb) to authenticated;

-- ============ Realtime ============
alter table public.rooms     replica identity full;
alter table public.room_docs replica identity full;

do $$
begin
  begin alter publication supabase_realtime add table public.rooms;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_docs; exception when duplicate_object then null; end;
end $$;

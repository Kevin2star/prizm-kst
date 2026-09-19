-- 참여 행에도 user_id를 둘 수 있게 계정 행(space_id is null)만 user_id unique.
-- 소유자만 스페이스를 삭제. 초대코드(join_code)는 생성 시에만 발급하고 여기서 바꾸지 않는다.

alter table public.spaces
  add column if not exists owner_id uuid references auth.users (id) on delete cascade,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.members drop constraint if exists members_user_id_key;
drop index if exists members_user_id_key;

drop index if exists members_account_nickname_uidx;
create unique index members_account_nickname_uidx
  on public.members (lower(btrim(nickname)))
  where user_id is not null and space_id is null;

create unique index if not exists members_account_user_id_uidx
  on public.members (user_id)
  where user_id is not null and space_id is null;

create unique index if not exists members_space_user_uidx
  on public.members (user_id, space_id)
  where user_id is not null and space_id is not null;

drop policy if exists spaces_insert_own on public.spaces;
create policy spaces_insert_own
  on public.spaces
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists spaces_update_own on public.spaces;
create policy spaces_update_own
  on public.spaces
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists spaces_delete_own on public.spaces;
create policy spaces_delete_own
  on public.spaces
  for delete
  to authenticated
  using (owner_id = auth.uid());

grant insert, update, delete on table public.spaces to authenticated;

drop policy if exists members_insert_owned_space on public.members;
create policy members_insert_owned_space
  on public.members
  for insert
  to authenticated
  with check (
    space_id is not null
    and (user_id is null or user_id = auth.uid())
    and exists (
      select 1
      from public.spaces s
      where s.id = space_id
        and s.owner_id = auth.uid()
    )
  );

create or replace function public.ensure_space_member(p_space_id bigint)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  nick text;
  result public.members;
  owned boolean;
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  select nickname into nick
    from public.members
   where user_id = uid
     and space_id is null
   limit 1;

  nick := btrim(coalesce(nick, ''));
  if nick = '' then
    select btrim(coalesce(raw_user_meta_data ->> 'nickname', ''))
      into nick
      from auth.users
     where id = uid;
  end if;
  if nick is null or nick = '' then
    nick := '멤버';
  end if;

  select exists(
    select 1
    from public.spaces s
    where s.id = p_space_id
      and s.owner_id = uid
  ) into owned;

  select * into result
    from public.members
   where space_id = p_space_id
     and user_id = uid
   limit 1;
  if found then
    return result;
  end if;

  if not owned then
    raise exception 'NOT_SPACE_MEMBER' using errcode = '42501';
  end if;

  select * into result
    from public.members
   where space_id = p_space_id
     and user_id is null
     and lower(btrim(nickname)) = lower(nick)
   limit 1;
  if found then
    update public.members
       set user_id = uid
     where id = result.id
    returning * into result;
    return result;
  end if;

  insert into public.members (space_id, nickname, user_id)
  values (p_space_id, nick, uid)
  returning * into result;

  return result;
end;
$$;

create or replace function public.join_space_by_code(p_code text)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  nick text;
  result public.members;
  space_row public.spaces;
  code text;
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  code := upper(btrim(coalesce(p_code, '')));
  if code = '' then
    raise exception '참여 코드를 입력해주세요.' using errcode = '22023';
  end if;

  select * into space_row
    from public.spaces
   where join_code = code
   limit 1;
  if not found then
    raise exception '참여 코드를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  select nickname into nick
    from public.members
   where user_id = uid
     and space_id is null
   limit 1;

  nick := btrim(coalesce(nick, ''));
  if nick = '' then
    select btrim(coalesce(raw_user_meta_data ->> 'nickname', ''))
      into nick
      from auth.users
     where id = uid;
  end if;
  if nick is null or nick = '' then
    nick := '멤버';
  end if;

  select * into result
    from public.members
   where space_id = space_row.id
     and user_id = uid
   limit 1;
  if found then
    return result;
  end if;

  select * into result
    from public.members
   where space_id = space_row.id
     and user_id is null
     and lower(btrim(nickname)) = lower(nick)
   limit 1;
  if found then
    update public.members
       set user_id = uid
     where id = result.id
    returning * into result;
    return result;
  end if;

  begin
    insert into public.members (space_id, nickname, user_id)
    values (space_row.id, nick, uid)
    returning * into result;
  exception
    when unique_violation then
      select * into result
        from public.members
       where space_id = space_row.id
         and user_id = uid
       limit 1;
      if not found then
        raise;
      end if;
  end;

  return result;
end;
$$;

grant execute on function public.ensure_space_member(bigint) to authenticated;
grant execute on function public.join_space_by_code(text) to authenticated;

create or replace function public.delete_owned_space(p_space_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  delete from public.spaces
   where id = p_space_id
     and owner_id = uid;

  if not found then
    raise exception '스페이스를 삭제하지 못했습니다. 소유자만 삭제할 수 있습니다.' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.delete_owned_space(bigint) to authenticated;

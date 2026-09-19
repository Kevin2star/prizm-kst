-- 스페이스 소유자가 계정 행과 별도로 참여 행(space_id 있음)을 만들 수 있게 한다.
-- 계정 행(user_id 있음, space_id null)과 참여 행을 섞지 않는다.

drop policy if exists members_insert_owned_space on public.members;
create policy members_insert_owned_space
  on public.members
  for insert
  to authenticated
  with check (
    space_id is not null
    and user_id is null
    and exists (
      select 1
      from public.spaces s
      where s.id = space_id
        and s.owner_id = auth.uid()
    )
  );

grant insert on table public.members to authenticated;

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
     and (
       user_id = uid
       or lower(btrim(nickname)) = lower(nick)
     )
   limit 1;
  if found then
    return result;
  end if;

  if not owned then
    raise exception 'NOT_SPACE_MEMBER' using errcode = '42501';
  end if;

  insert into public.members (space_id, nickname)
  values (p_space_id, nick)
  returning * into result;

  return result;
end;
$$;

grant execute on function public.ensure_space_member(bigint) to authenticated;

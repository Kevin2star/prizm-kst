-- 로그인 계정은 기존 public.members 를 쓴다 (singular member 테이블 없음).
-- 비밀번호는 members 에 두지 않는다. GoTrue(auth.users)가 해시만 보관한다.
-- 브라우저에는 supabase-js가 access/refresh 토큰만 persistSession으로 유지하고,
-- signOut() 시 제거한다. 비밀번호를 localStorage에 저장하지 말 것.
-- 스페이스 참여자 행(space_id 있음)과 계정 행(user_id 있음)을 같은 테이블에 둔다.

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_email_updated on auth.users;
drop table if exists public.member cascade;
drop function if exists public.handle_new_member();
drop function if exists public.sync_member_email();
drop function if exists public.member_protect_identity();

alter table public.members
  alter column space_id drop not null,
  alter column school drop not null,
  alter column major drop not null;

alter table public.members
  alter column school set default '',
  alter column major set default '';

alter table public.members
  add column if not exists email text,
  add column if not exists user_id uuid unique references auth.users (id) on delete cascade;

update public.members
   set school = coalesce(school, ''),
       major = coalesce(major, '');

alter table public.members drop constraint if exists members_email_format;
alter table public.members drop constraint if exists members_email_lowercase;

alter table public.members
  add constraint members_email_format check (
    email is null or email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );

alter table public.members
  add constraint members_email_lowercase check (
    email is null or email = lower(email)
  );

create unique index if not exists members_email_lower_uidx
  on public.members (lower(email))
  where email is not null;

create unique index if not exists members_account_nickname_uidx
  on public.members (lower(btrim(nickname)))
  where user_id is not null;

drop policy if exists members_update_own on public.members;
create policy members_update_own
  on public.members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on table public.members to anon, authenticated;
grant update on table public.members to authenticated;

create or replace function public.members_protect_account()
returns trigger
language plpgsql
as $$
begin
  if old.user_id is not null then
    new.user_id := old.user_id;
    new.email := old.email;
    new.created_at := old.created_at;
    new.nickname := btrim(new.nickname);
    if char_length(new.nickname) < 2 then
      raise exception 'NICKNAME_INVALID' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists members_protect_account on public.members;
create trigger members_protect_account
  before update on public.members
  for each row
  execute function public.members_protect_account();

create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mail text;
  nick text;
  base text;
  suffix integer := 0;
begin
  mail := lower(btrim(coalesce(new.email, '')));
  if mail = '' then
    raise exception 'EMAIL_REQUIRED' using errcode = '23502';
  end if;

  nick := btrim(coalesce(new.raw_user_meta_data ->> 'nickname', ''));
  if nick = '' then
    nick := split_part(mail, '@', 1);
  end if;
  if char_length(nick) < 2 then
    nick := rpad(nick, 2, 'x');
  end if;
  nick := left(nick, 80);
  base := nick;

  loop
    begin
      insert into public.members (user_id, email, nickname, space_id, school, major)
      values (new.id, mail, nick, null, '', '');
      exit;
    exception
      when unique_violation then
        if exists (select 1 from public.members where user_id = new.id) then
          return new;
        end if;
        if exists (select 1 from public.members where email is not null and lower(email) = mail) then
          raise;
        end if;
        suffix := suffix + 1;
        nick := left(base, 76) || '_' || suffix::text;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_member();

create or replace function public.sync_member_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.members
       set email = lower(btrim(new.email))
     where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  execute function public.sync_member_email();

do $$
declare
  u record;
  mail text;
  nick text;
  base text;
  suffix integer;
begin
  for u in
    select id, email, raw_user_meta_data
    from auth.users
    where not exists (select 1 from public.members m where m.user_id = auth.users.id)
  loop
    mail := lower(btrim(coalesce(u.email, '')));
    if mail = '' then
      continue;
    end if;
    nick := btrim(coalesce(u.raw_user_meta_data ->> 'nickname', ''));
    if nick = '' then
      nick := split_part(mail, '@', 1);
    end if;
    if char_length(nick) < 2 then
      nick := rpad(nick, 2, 'x');
    end if;
    nick := left(nick, 80);
    base := nick;
    suffix := 0;
    loop
      begin
        insert into public.members (user_id, email, nickname, space_id, school, major)
        values (u.id, mail, nick, null, '', '');
        exit;
      exception
        when unique_violation then
          if exists (select 1 from public.members where user_id = u.id) then
            exit;
          end if;
          if exists (select 1 from public.members where email is not null and lower(email) = mail) then
            raise;
          end if;
          suffix := suffix + 1;
          nick := left(base, 76) || '_' || suffix::text;
      end;
    end loop;
  end loop;
end $$;

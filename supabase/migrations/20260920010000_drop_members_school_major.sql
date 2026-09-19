-- 로그인/스페이스 참여자 모두 school, major 를 쓰지 않는다.

alter table public.members drop column if exists school;
alter table public.members drop column if exists major;

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
      insert into public.members (user_id, email, nickname, space_id)
      values (new.id, mail, nick, null);
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

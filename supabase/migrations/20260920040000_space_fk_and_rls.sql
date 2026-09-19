-- members.space_id 가 nullable(계정 행)이어도 참여 행은 spaces 삭제 시 같이 지워져야 한다.
-- artifacts.space_id FK도 원래 스키마대로 복구한다.
-- spaces RLS가 꺼져 있으면 소유자 삭제 정책이 적용되지 않는다.

delete from public.members
 where space_id is not null
   and space_id not in (select id from public.spaces);

delete from public.artifacts
 where space_id is not null
   and space_id not in (select id from public.spaces);

alter table public.members drop constraint if exists members_space_id_fkey;
alter table public.members
  add constraint members_space_id_fkey
  foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.artifacts drop constraint if exists artifacts_space_id_fkey;
alter table public.artifacts
  add constraint artifacts_space_id_fkey
  foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.spaces enable row level security;

drop policy if exists spaces_select on public.spaces;
create policy spaces_select
  on public.spaces
  for select
  to anon, authenticated
  using (true);

revoke all on function public.join_space_by_code(text) from public, anon;
revoke all on function public.delete_owned_space(bigint) from public, anon;
revoke all on function public.ensure_space_member(bigint) from public, anon;
grant execute on function public.join_space_by_code(text) to authenticated;
grant execute on function public.delete_owned_space(bigint) to authenticated;
grant execute on function public.ensure_space_member(bigint) to authenticated;

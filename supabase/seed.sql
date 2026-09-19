create or replace function public.prizm_demo_embedding(cluster integer)
returns text
language plpgsql
as $$
declare
  vals double precision[] := array_fill(0::double precision, array[768]);
  i integer;
begin
  for i in 0..31 loop
    vals[cluster * 32 + i + 1] := 1.0;
  end loop;
  return array_to_json(vals)::text;
end;
$$;

do $$
declare
  space_id bigint;
  minsu_id bigint;
  jihyun_id bigint;
  sua_id bigint;
  wait_id bigint;
  seat_id bigint;
  a1 bigint;
  a2 bigint;
  a3 bigint;
  b1 bigint;
  b2 bigint;
begin
  if exists (select 1 from public.spaces where join_code = 'CAFE01') then
    return;
  end if;

  insert into public.spaces (name, join_code)
  values ('교내 카페 개선안', 'CAFE01')
  returning id into space_id;

  insert into public.members (space_id, nickname)
  values (space_id, '민수')
  returning id into minsu_id;
  insert into public.members (space_id, nickname)
  values (space_id, '지현')
  returning id into jihyun_id;
  insert into public.members (space_id, nickname)
  values (space_id, '수아')
  returning id into sua_id;

  insert into public.artifact_groups (space_id, label, common_points, differences, notes)
  values (
    space_id,
    '대기시간 문제 해결',
    '점심 피크에 줄이 카페 입구까지 늘어나 자리 회전과 주문 경험이 함께 무너진다는 문제의식을 공유한다.',
    '[]',
    '예약·원격 픽업과 매장 대기의 연결은 아직 아무도 구체적으로 다루지 않았다. 키오스크 접근성도 빈틈이다.'
  ) returning id into wait_id;

  insert into public.artifact_groups (space_id, label, common_points, differences, notes)
  values (
    space_id,
    '좌석·공간 경험',
    '카페가 ''잠깐 마시는 곳''이 아니라 수업 사이 머무는 공간인데, 좌석 구조가 그 쓰임을 받쳐주지 못한다고 본다.',
    '[]',
    '콘센트·소음존 구획은 언급만 있고 실험 설계가 없다. 야외 테라스 좌석은 비어 있는 확장 포인트다.'
  ) returning id into seat_id;

  insert into public.artifacts (space_id, member_id, group_id, title, content, tags, embedding, status)
  values (
    space_id, minsu_id, wait_id,
    '카페 대기열 재배치',
    '점심 12시부터 12시 40분까지 중앙 카페 줄이 출입문을 막는다. 산업공학 관점에서 병목은 주문과 픽업이 한 줄에서 섞이는 지점이다.
카운터 앞 줄을 주문 전용으로 두고, 오른쪽 벽면을 픽업 레인으로 나누면 서 있는 사람과 지나가는 사람이 충돌하지 않는다.
트레이 회수대를 출구 쪽으로 옮기면 동선이 원 모양이 되어 회전이 빨라진다.',
    '["대기시간","동선","대기열"]',
    public.prizm_demo_embedding(0),
    'READY'
  ) returning id into a1;

  insert into public.artifacts (space_id, member_id, group_id, title, content, tags, embedding, status)
  values (
    space_id, jihyun_id, wait_id,
    '피크타임 예측으로 미리 배치하기',
    '지난 학기 POS 로그를 보면 화·목 12:10~12:35에 주문이 몰린다. 컴퓨터공학 관점에서는 대기열을 물리적으로 늘리기 전에 예측이 필요하다.
간단한 시간대 모델로 ''10분 뒤 대기 인원''을 추정하고, 그 구간에만 아르바이트를 한 명 더 붙이면 평균 대기 3분을 줄일 수 있다.
앱 푸시로 ''지금 가면 줄이 짧다''는 신호를 보내 수요를 분산하는 것도 가능하다.',
    '["대기시간","예측","피크타임"]',
    public.prizm_demo_embedding(0),
    'READY'
  ) returning id into a2;

  insert into public.artifacts (space_id, member_id, group_id, title, content, tags, embedding, status)
  values (
    space_id, sua_id, wait_id,
    '모바일 주문 번호표 화면',
    '줄에 선 사람들은 메뉴를 고르지 못한 채 앞으로 밀린다. 시각디자인 관점에서는 대기를 ''서 있는 벌''이 아니라 준비 시간으로 바꿔야 한다.
입구 QR로 모바일 번호표를 뽑고, 벽면 화면에 현재 제조 번호를 크게 보여 주면 줄에서 빠져 메뉴를 고를 수 있다.
번호 색과 픽업대 조명만 맞춰도 호출 혼선이 줄어든다. 줄 자체 길이를 시각적으로 숨기는 게 아니라, 기다림의 질을 바꾸는 안이다.',
    '["대기시간","모바일주문","번호표"]',
    public.prizm_demo_embedding(0),
    'READY'
  ) returning id into a3;

  insert into public.artifacts (space_id, member_id, group_id, title, content, tags, embedding, status)
  values (
    space_id, sua_id, seat_id,
    '붙였다 떼는 모듈 좌석',
    '지금 카페 좌석은 4인용 큰 테이블이 대부분이라 혼자 온 학생이 자리를 과하게 점유한다. 디자인 전공으로서는 가구가 쓰임을 규정한다고 본다.
2인용 모듈을 기본으로 두고 자석식 연결로 4인용을 만들면, 점심엔 회전이 되고 오후엔 팀 프로젝트 공간이 된다.
창가 1인용 카운터를 늘리면 ''잠깐 마시는'' 수요와 ''앉아 있는'' 수요가 분리된다.',
    '["좌석","공간","모듈가구"]',
    public.prizm_demo_embedding(1),
    'READY'
  ) returning id into b1;

  insert into public.artifacts (space_id, member_id, group_id, title, content, tags, embedding, status)
  values (
    space_id, jihyun_id, seat_id,
    '빈자리 occupancy 센서',
    '2층에 자리가 있는데도 1층에서 서성이는 일이 반복된다. 컴퓨터공학 안은 각 테이블 밑에 저가 occupancy 센서를 달고 앱 지도에 초록/회색으로 띄우는 것이다.
실시간 정확도가 떨어지면 ''3분 내 비움 추정'' 정도로 완화해도, 탐색 시간 자체는 줄어든다.
좌석 데이터는 대기열 예측과도 연결할 수 있지만, 이번 안은 공간 탐색 문제에 초점을 둔다.',
    '["좌석","센서","빈자리"]',
    public.prizm_demo_embedding(1),
    'READY'
  ) returning id into b2;

  insert into public.artifacts (space_id, member_id, group_id, title, content, tags, embedding, status)
  values (
    space_id, minsu_id, null,
    '알레르기 메뉴 표시 표준',
    '대기나 좌석과 별개로, 카페 메뉴판에 알레르기 원재료가 거의 없다. 유제품·견과 표시가 없으면 일부 학생은 아예 주문하지 못한다.
키오스크와 보드에 동일한 아이콘 세트를 넣고, 제조 실수 방지를 위해 컵 홀더에도 약어를 찍는 운영 규칙을 제안한다.
이 문제는 줄 길이보다 안전과 접근성에 가깝다.',
    '["알레르기","메뉴표시","접근성"]',
    public.prizm_demo_embedding(2),
    'READY'
  );

  update public.artifact_groups
  set differences = json_build_array(
    json_build_object('artifactId', a1, 'summary', '민수(산업공학)는 동선 관점에서 대기열을 카운터와 픽업대로 분리해 재배치했다'),
    json_build_object('artifactId', a2, 'summary', '지현(컴퓨터공학)은 과거 결제 데이터로 피크를 예측해 미리 인원을 배치하자고 했다'),
    json_build_object('artifactId', a3, 'summary', '수아(시각디자인)는 모바일 번호표와 대기 화면으로 ''서 있는 시간''을 줄이자고 했다')
  )::text
  where id = wait_id;

  update public.artifact_groups
  set differences = json_build_array(
    json_build_object('artifactId', b1, 'summary', '수아(시각디자인)는 2~4인이 붙였다 뗄 수 있는 모듈 가구로 공간을 바꾸자고 했다'),
    json_build_object('artifactId', b2, 'summary', '지현(컴퓨터공학)은 좌석 occupancy 센서로 빈자리를 앱에 띄우자고 했다')
  )::text
  where id = seat_id;
end $$;

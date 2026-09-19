import { supabase } from "./supabaseClient";
import { saveSession } from "./session";

export function formatRelativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export async function getAccountMember(userId) {
  const { data, error } = await supabase
    .from("members")
    .select("id, user_id, email, nickname")
    .eq("user_id", userId)
    .is("space_id", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findSpaceMembership(spaceId, user) {
  const { data: byUser, error: userError } = await supabase
    .from("members")
    .select("id, space_id, nickname, user_id")
    .eq("space_id", spaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (userError) throw userError;
  if (byUser) return byUser;

  const account = await getAccountMember(user.id);
  const nickname = account?.nickname || user.user_metadata?.nickname;
  if (!nickname) return null;

  const { data: byNick, error: nickError } = await supabase
    .from("members")
    .select("id, space_id, nickname, user_id")
    .eq("space_id", spaceId)
    .eq("nickname", nickname)
    .is("user_id", null)
    .maybeSingle();
  if (nickError) throw nickError;
  return byNick;
}

export function applySpaceSession(membership, joinCode) {
  saveSession({
    memberId: membership.id,
    spaceId: membership.space_id,
    nickname: membership.nickname,
    joinCode: joinCode || undefined,
  });
}

function randomJoinCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

export async function createOwnedSpace(user, { name, description }) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) throw new Error("스페이스 이름을 입력하세요.");
  const trimmedDescription = String(description || "").trim();

  let lastError = null;
  for (let i = 0; i < 8; i++) {
    const joinCode = randomJoinCode();
    const { data, error } = await supabase
      .from("spaces")
      .insert({
        name: trimmedName,
        description: trimmedDescription || trimmedName,
        join_code: joinCode,
        owner_id: user.id,
      })
      .select("id, name, description, join_code, owner_id, created_at, updated_at")
      .single();
    if (!error) return data;
    lastError = error;
    if (error.code !== "23505") break;
  }
  throw lastError || new Error("스페이스를 만들지 못했습니다.");
}

function mapSpaceCard(membership, space, people) {
  return {
    id: space.id,
    name: space.name,
    description: space.description || "프로젝트 공간",
    inviteCode: space.join_code,
    members: people,
    updated: formatRelativeTime(space.updated_at || space.created_at),
    updatedAt: space.updated_at || space.created_at,
    favorite: false,
    memberId: membership?.id ?? null,
    memberNickname: membership?.nickname,
    ownerId: space.owner_id || null,
    isPreview: false,
  };
}

async function loadOwnedSpaces(user) {
  const { data, error } = await supabase
    .from("spaces")
    .select("id, name, description, join_code, owner_id, created_at, updated_at")
    .eq("owner_id", user.id);
  if (error) {
    console.warn("소유 스페이스 조회를 건너뜁니다:", error.message);
    return [];
  }
  return data || [];
}

export async function listMySpaces(user) {
  const account = await getAccountMember(user.id);
  const nickname = account?.nickname || user.user_metadata?.nickname || "";

  const { data: byUser, error: userError } = await supabase
    .from("members")
    .select("id, space_id, nickname, user_id")
    .not("space_id", "is", null)
    .eq("user_id", user.id);
  if (userError) throw userError;

  let byNick = [];
  if (nickname) {
    const { data, error } = await supabase
      .from("members")
      .select("id, space_id, nickname, user_id")
      .not("space_id", "is", null)
      .eq("nickname", nickname)
      .is("user_id", null);
    if (error) throw error;
    byNick = data || [];
  }

  const memberships = new Map();
  for (const row of [...(byUser || []), ...byNick]) {
    if (row?.space_id == null) continue;
    if (!memberships.has(row.space_id)) memberships.set(row.space_id, row);
  }

  const owned = await loadOwnedSpaces(user);
  const spaceById = new Map(owned.map((space) => [space.id, space]));

  const missingIds = [...memberships.keys()].filter((id) => !spaceById.has(id));
  if (missingIds.length) {
    const { data: extra, error: spacesError } = await supabase
      .from("spaces")
      .select("id, name, description, join_code, owner_id, created_at, updated_at")
      .in("id", missingIds);
    if (spacesError) throw spacesError;
    for (const space of extra || []) spaceById.set(space.id, space);
  }

  const spaceIds = [...spaceById.keys()];
  if (spaceIds.length === 0) return [];

  const { data: peopleRows, error: peopleError } = await supabase
    .from("members")
    .select("space_id, nickname")
    .in("space_id", spaceIds);
  if (peopleError) throw peopleError;

  const peopleBySpace = new Map();
  for (const person of peopleRows || []) {
    const list = peopleBySpace.get(person.space_id) || [];
    const name = person.nickname || "멤버";
    list.push({
      initial: String(name).charAt(0).toUpperCase(),
      name,
    });
    peopleBySpace.set(person.space_id, list);
  }

  return spaceIds
    .map((id) => {
      const space = spaceById.get(id);
      if (!space) return null;
      return mapSpaceCard(memberships.get(id) || null, space, peopleBySpace.get(id) || []);
    })
    .filter(Boolean);
}

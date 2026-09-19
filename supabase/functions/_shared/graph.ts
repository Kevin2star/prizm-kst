import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { num, parseJsonArray } from "./admin.ts";

function memberOf(row: { members?: unknown }) {
  const raw = row.members;
  if (Array.isArray(raw)) return raw[0] ?? { nickname: "" };
  return raw ?? { nickname: "" };
}

function parseTags(json: string | null): string[] {
  const tags = parseJsonArray<string[]>(json, []);
  return Array.isArray(tags) ? tags : [];
}

function artifactNode(artifact: Record<string, unknown>) {
  const member = memberOf(artifact);
  return {
    type: "ARTIFACT",
    id: `artifact-${artifact.id}`,
    artifactId: num(artifact.id),
    label: artifact.title,
    status: artifact.status,
    nickname: member.nickname,
    tags: parseTags(artifact.tags as string | null),
  };
}

function leaf(type: string, id: string, label: string, body: string | null, sourceIds: number[]) {
  return { type, id, label, body, sourceArtifactIds: sourceIds };
}

function parseDiff(json: string | null): Array<Record<string, unknown>> {
  const value = parseJsonArray<unknown>(json, []);
  return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
}

function groupNode(group: Record<string, unknown>, members: Array<Record<string, unknown>>) {
  const sourceIds = members.map((item) => num(item.id));
  const byId = new Map(members.map((item) => [num(item.id), item]));
  const updatedAt = group.updated_at ? new Date(String(group.updated_at)) : null;
  const updated = !!updatedAt && updatedAt.getTime() > Date.now() - 5 * 60 * 1000;

  const diffItems = parseDiff(group.differences as string | null).map((row) => {
    const artifactId = row.artifactId == null ? null : num(row.artifactId);
    const source = artifactId == null ? null : byId.get(artifactId);
    const member = source ? memberOf(source) : null;
    const item: Record<string, unknown> = {
      artifactId,
      summary: String(row.summary ?? ""),
    };
    if (member) {
      item.nickname = member.nickname;
    }
    return item;
  });

  const gid = num(group.id);
  return {
    type: "GROUP",
    id: `group-${gid}`,
    groupId: gid,
    label: group.label,
    updated,
    children: [
      leaf("COMMON", `group-${gid}-common`, "공통점", group.common_points as string | null, sourceIds),
      {
        type: "DIFF",
        id: `group-${gid}-diff`,
        label: "차이점",
        items: diffItems,
        sourceArtifactIds: sourceIds,
      },
      leaf("NOTES", `group-${gid}-notes`, "비고", group.notes as string | null, sourceIds),
      {
        type: "SOURCES",
        id: `group-${gid}-sources`,
        label: "원본 목록",
        children: members.map(artifactNode),
      },
    ],
  };
}

export async function buildGraph(admin: SupabaseClient, spaceId: number) {
  const { data: space, error } = await admin.from("spaces").select("*").eq("id", spaceId).maybeSingle();
  if (error || !space) return null;

  const { data: artifacts } = await admin
    .from("artifacts")
    .select("id, title, status, tags, group_id, created_at, members(nickname)")
    .eq("space_id", spaceId);
  const { data: groups } = await admin
    .from("artifact_groups")
    .select("*")
    .eq("space_id", spaceId)
    .order("id");

  const byGroup = new Map<number, Array<Record<string, unknown>>>();
  for (const item of artifacts ?? []) {
    if (item.group_id == null) continue;
    const key = num(item.group_id);
    const list = byGroup.get(key) ?? [];
    list.push(item as Record<string, unknown>);
    byGroup.set(key, list);
  }

  const children: unknown[] = [];
  for (const group of groups ?? []) {
    const members = byGroup.get(num(group.id)) ?? [];
    if (members.length > 0) children.push(groupNode(group as Record<string, unknown>, members));
  }
  (artifacts ?? [])
    .filter((item) => item.group_id == null)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .forEach((item) => children.push(artifactNode(item as Record<string, unknown>)));

  return {
    spaceId: num(space.id),
    name: space.name,
    joinCode: space.join_code,
    root: {
      type: "SPACE",
      id: `space-${space.id}`,
      label: space.name,
      children,
    },
  };
}

export function artifactResponse(row: Record<string, unknown>) {
  const member = memberOf(row);
  return {
    id: num(row.id),
    spaceId: num(row.space_id),
    memberId: num(row.member_id),
    nickname: member.nickname,
    title: row.title,
    content: row.content,
    status: row.status,
    tags: parseTags(row.tags as string | null),
    groupId: row.group_id == null ? null : num(row.group_id),
    createdAt: row.created_at,
  };
}

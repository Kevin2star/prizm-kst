import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { generateContent, geminiConfigured, stripJson } from "./gemini.ts";
import { num, parseJsonArray } from "./admin.ts";

export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function threshold(): number {
  const raw = Deno.env.get("SIMILARITY_THRESHOLD");
  const value = raw ? Number(raw) : 0.75;
  return Number.isFinite(value) ? value : 0.75;
}

function parseEmbedding(json: string | null): number[] {
  const values = parseJsonArray<number[]>(json, []);
  return Array.isArray(values) ? values.map(Number) : [];
}

function parseTags(json: string | null): string[] {
  const values = parseJsonArray<string[]>(json, []);
  return Array.isArray(values) ? values.filter((t) => typeof t === "string") : [];
}

function blob(row: { title: string; content: string; tags: string | null }): string {
  return `${row.title}${row.content}${row.tags ?? ""}`;
}

function mentionsWait(row: { title: string; content: string; tags: string | null }): boolean {
  const text = blob(row).toLowerCase();
  return text.includes("대기") || text.includes("줄") || text.includes("피크");
}

function mentionsSeat(row: { title: string; content: string; tags: string | null }): boolean {
  const text = blob(row);
  return text.includes("좌석") || text.includes("공간") || text.includes("자리");
}

function similarity(
  current: { title: string; content: string; tags: string | null },
  currentVec: number[],
  other: { title: string; content: string; tags: string | null; embedding: string | null },
): number {
  let boosted = cosine(currentVec, parseEmbedding(other.embedding));
  const left = parseTags(current.tags);
  const right = parseTags(other.tags);
  if (left.some((tag) => right.includes(tag))) boosted = Math.max(boosted, 0.78);
  if (mentionsWait(current) && mentionsWait(other)) boosted = Math.max(boosted, 0.8);
  if (mentionsSeat(current) && mentionsSeat(other)) boosted = Math.max(boosted, 0.8);
  return boosted;
}

async function fillFallbackSummary(
  admin: SupabaseClient,
  groupId: number,
  members: Array<{ id: number; title: string; members: { nickname: string; major: string } | { nickname: string; major: string }[] }>,
) {
  const diffs = members.map((artifact) => {
    const member = Array.isArray(artifact.members) ? artifact.members[0] : artifact.members;
    return {
      artifactId: num(artifact.id),
      summary: `${member.nickname}(${member.major}) / ${artifact.title}`,
    };
  });
  await admin.from("artifact_groups").update({
    label: members[0].title,
    common_points: "같은 문제의식을 공유하는 결과물들이 모였습니다.",
    differences: JSON.stringify(diffs),
    notes: "자동 폴백 정리본입니다. Gemini 키가 있으면 다시 분석됩니다.",
    updated_at: new Date().toISOString(),
  }).eq("id", groupId);
}

async function refreshSummary(
  admin: SupabaseClient,
  group: { id: number; label: string },
  members: Array<{
    id: number;
    title: string;
    content: string;
    tags: string | null;
    members: { nickname: string; school: string; major: string } | { nickname: string; school: string; major: string }[];
  }>,
) {
  const input = members.map((artifact) => {
    const member = Array.isArray(artifact.members) ? artifact.members[0] : artifact.members;
    return `- id=${artifact.id} nickname=${member.nickname} school=${member.school} major=${member.major} title=${artifact.title} tags=${artifact.tags}\ncontent=${artifact.content}\n`;
  }).join("");
  const prompt =
    `아래 결과물들을 하나로 합치지 말고 비교 정리본 JSON만 반환하라. 마크다운 금지.\n` +
    `원문에 없는 사실을 만들지 마라.\n` +
    `차이점은 "누가 / 어떤 관점으로 / 무엇을 다르게" 형식.\n` +
    `notes는 빈틈/특이점/확장만. 없는 칭찬을 지어내지 마라.\n` +
    `스키마:\n{"label":"...","commonPoints":"...","differences":[{"artifactId":1,"summary":"..."}],"notes":"..."}\n` +
    `결과물:\n${input}`;
  try {
    const raw = stripJson(await generateContent("gemini-2.5-flash", prompt));
    const node = JSON.parse(raw);
    await admin.from("artifact_groups").update({
      label: node.label || group.label,
      common_points: node.commonPoints ?? "",
      differences: JSON.stringify(node.differences ?? []),
      notes: node.notes ?? "",
      updated_at: new Date().toISOString(),
    }).eq("id", group.id);
  } catch {
    await fillFallbackSummary(admin, group.id, members);
  }
}

export async function assignGroup(admin: SupabaseClient, artifactId: number): Promise<number | null> {
  const { data: current, error } = await admin
    .from("artifacts")
    .select("id, space_id, title, content, tags, embedding, status, group_id, members(nickname, school, major)")
    .eq("id", artifactId)
    .maybeSingle();
  if (error || !current || !current.embedding || current.status !== "READY") return null;

  const currentVec = parseEmbedding(current.embedding);
  const { data: others } = await admin
    .from("artifacts")
    .select("id, space_id, title, content, tags, embedding, status, group_id")
    .eq("space_id", current.space_id)
    .eq("status", "READY")
    .neq("id", artifactId);

  let best: { id: number; embedding: string | null; group_id: number | null; title: string; content: string; tags: string | null } | null = null;
  let bestScore = -1;
  for (const other of others ?? []) {
    if (!other.embedding) continue;
    const score = similarity(current, currentVec, other);
    if (score > bestScore) {
      bestScore = score;
      best = other;
    }
  }

  if (!best || bestScore < threshold()) return null;

  let groupId = best.group_id ? num(best.group_id) : null;
  if (!groupId) {
    const { data: created, error: groupError } = await admin
      .from("artifact_groups")
      .insert({ space_id: current.space_id, label: "새 그룹" })
      .select("id")
      .single();
    if (groupError || !created) return null;
    groupId = num(created.id);
    await admin.from("artifacts").update({ group_id: groupId, updated_at: new Date().toISOString() }).eq("id", best.id);
  }
  await admin.from("artifacts").update({ group_id: groupId, updated_at: new Date().toISOString() }).eq("id", current.id);

  const { data: members } = await admin
    .from("artifacts")
    .select("id, title, content, tags, members(nickname, school, major)")
    .eq("group_id", groupId);
  const list = members ?? [];
  if (list.length >= 2) {
    const { data: group } = await admin.from("artifact_groups").select("id, label").eq("id", groupId).single();
    if (group) {
      if (geminiConfigured()) await refreshSummary(admin, { id: num(group.id), label: group.label }, list);
      else await fillFallbackSummary(admin, groupId, list);
    }
  }
  return groupId;
}

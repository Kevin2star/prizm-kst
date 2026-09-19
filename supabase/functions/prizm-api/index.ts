import { adminClient, num, requireText } from "../_shared/admin.ts";
import { analyzeArtifact } from "../_shared/analyze.ts";
import { corsHeaders, errorJson, json } from "../_shared/cors.ts";
import { artifactResponse, buildGraph } from "../_shared/graph.ts";
import { parseJsonArray } from "../_shared/admin.ts";

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function routePath(url: URL): string {
  const marker = "/prizm-api";
  const idx = url.pathname.indexOf(marker);
  const rest = idx >= 0 ? url.pathname.slice(idx + marker.length) : url.pathname;
  const trimmed = rest.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function randomJoinCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}

async function uniqueJoinCode(admin: ReturnType<typeof adminClient>): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = randomJoinCode();
    const { data } = await admin.from("spaces").select("id").eq("join_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new HttpError(400, "JOIN_CODE_EXHAUSTED", "참여 코드를 발급하지 못했습니다. 다시 시도하세요.");
}

function scheduleAnalyze(artifactId: number) {
  const run = async () => {
    try {
      await analyzeArtifact(adminClient(), artifactId);
    } catch (ex) {
      console.error(ex);
    }
  };
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(run());
  else run();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const path = routePath(url);
    const admin = adminClient();

    if (req.method === "GET" && (path === "/health" || path === "/")) {
      return json({ status: "ok" });
    }

    if (req.method === "POST" && path === "/spaces") {
      const body = await req.json().catch(() => ({}));
      const name = requireText(body.name, "SPACE_NAME_REQUIRED", "스페이스 이름을 입력하세요.");
      const joinCode = await uniqueJoinCode(admin);
      const { data, error } = await admin.from("spaces").insert({ name, join_code: joinCode }).select("*").single();
      if (error) throw error;
      return json({ id: num(data.id), name: data.name, joinCode: data.join_code });
    }

    const joinMatch = path.match(/^\/spaces\/([^/]+)\/join$/);
    if (req.method === "POST" && joinMatch) {
      const code = decodeURIComponent(joinMatch[1]).trim().toUpperCase();
      const body = await req.json().catch(() => ({}));
      const { data: space } = await admin.from("spaces").select("*").eq("join_code", code).maybeSingle();
      if (!space) throw new HttpError(404, "SPACE_NOT_FOUND", "참여 코드를 찾을 수 없습니다.");
      const nickname = requireText(body.nickname, "NICKNAME_REQUIRED", "닉네임을 입력하세요.");
      const school = requireText(body.school, "SCHOOL_REQUIRED", "학교를 입력하세요.");
      const major = requireText(body.major, "MAJOR_REQUIRED", "전공을 입력하세요.");
      const { data: member, error } = await admin.from("members").insert({
        space_id: space.id,
        nickname,
        school,
        major,
      }).select("*").single();
      if (error) throw error;
      const memberId = num(member.id);
      return json({
        id: memberId,
        memberId,
        spaceId: num(space.id),
        nickname: member.nickname,
        school: member.school,
        major: member.major,
      });
    }

    const graphMatch = path.match(/^\/spaces\/(\d+)\/graph$/);
    if (req.method === "GET" && graphMatch) {
      const graph = await buildGraph(admin, Number(graphMatch[1]));
      if (!graph) throw new HttpError(404, "SPACE_NOT_FOUND", "스페이스를 찾을 수 없습니다.");
      return json(graph);
    }

    const artifactsMatch = path.match(/^\/spaces\/(\d+)\/artifacts$/);
    if (artifactsMatch) {
      const spaceId = Number(artifactsMatch[1]);
      const { data: space } = await admin.from("spaces").select("id").eq("id", spaceId).maybeSingle();
      if (!space) throw new HttpError(404, "SPACE_NOT_FOUND", "스페이스를 찾을 수 없습니다.");
      if (req.method === "GET") {
        const { data, error } = await admin
          .from("artifacts")
          .select("*, members(nickname, school, major)")
          .eq("space_id", spaceId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json((data ?? []).map((row) => artifactResponse(row as Record<string, unknown>)));
      }
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const memberId = Number(body.memberId);
        const title = requireText(body.title, "TITLE_REQUIRED", "제목을 입력하세요.");
        const content = requireText(body.content, "CONTENT_REQUIRED", "본문을 입력하세요.");
        const { data: member } = await admin
          .from("members")
          .select("*")
          .eq("id", memberId)
          .eq("space_id", spaceId)
          .maybeSingle();
        if (!member) throw new HttpError(403, "MEMBER_NOT_IN_SPACE", "해당 스페이스의 참여자가 아닙니다.");
        const { data: saved, error } = await admin.from("artifacts").insert({
          space_id: spaceId,
          member_id: memberId,
          title,
          content,
          tags: "[]",
          status: "PENDING",
        }).select("*, members(nickname, school, major)").single();
        if (error) throw error;
        scheduleAnalyze(num(saved.id));
        return json(artifactResponse(saved as Record<string, unknown>), 201);
      }
    }

    const spaceMatch = path.match(/^\/spaces\/(\d+)$/);
    if (req.method === "GET" && spaceMatch) {
      const spaceId = Number(spaceMatch[1]);
      const { data: space } = await admin.from("spaces").select("*").eq("id", spaceId).maybeSingle();
      if (!space) throw new HttpError(404, "SPACE_NOT_FOUND", "스페이스를 찾을 수 없습니다.");
      const { count } = await admin.from("members").select("id", { count: "exact", head: true }).eq("space_id", spaceId);
      return json({
        id: num(space.id),
        name: space.name,
        joinCode: space.join_code,
        memberCount: count ?? 0,
      });
    }

    const artifactMatch = path.match(/^\/artifacts\/(\d+)$/);
    if (req.method === "GET" && artifactMatch) {
      const { data, error } = await admin
        .from("artifacts")
        .select("*, members(nickname, school, major)")
        .eq("id", Number(artifactMatch[1]))
        .maybeSingle();
      if (error || !data) throw new HttpError(404, "ARTIFACT_NOT_FOUND", "결과물을 찾을 수 없습니다.");
      return json(artifactResponse(data as Record<string, unknown>));
    }

    const groupMatch = path.match(/^\/groups\/(\d+)$/);
    if (req.method === "GET" && groupMatch) {
      const groupId = Number(groupMatch[1]);
      const { data: group } = await admin.from("artifact_groups").select("*").eq("id", groupId).maybeSingle();
      if (!group) throw new HttpError(404, "GROUP_NOT_FOUND", "그룹을 찾을 수 없습니다.");
      const { data: artifacts } = await admin
        .from("artifacts")
        .select("id, title, members(nickname, school, major)")
        .eq("group_id", groupId);
      const diffs = parseJsonArray<unknown>(group.differences, []);
      return json({
        id: num(group.id),
        spaceId: num(group.space_id),
        label: group.label,
        commonPoints: group.common_points,
        differences: Array.isArray(diffs) ? diffs : [],
        notes: group.notes,
        artifacts: (artifacts ?? []).map((artifact) => {
          const memberRaw = artifact.members;
          const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
          return {
            id: num(artifact.id),
            title: artifact.title,
            memberNickname: member?.nickname,
            school: member?.school,
            major: member?.major,
          };
        }),
      });
    }

    return errorJson("NOT_FOUND", "요청한 경로를 찾을 수 없습니다.", 404);
  } catch (ex) {
    if (ex instanceof HttpError) return errorJson(ex.code, ex.message, ex.status);
    const err = ex as { code?: string; status?: number; message?: string };
    if (err.code && err.status) return errorJson(err.code, err.message || "요청에 실패했습니다.", err.status);
    console.error(ex);
    return errorJson("INTERNAL_ERROR", "요청에 실패했습니다.", 500);
  }
});

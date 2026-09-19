import { adminClient } from "../_shared/admin.ts";
import { analyzeArtifact } from "../_shared/analyze.ts";
import { corsHeaders, errorJson, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorJson("METHOD_NOT_ALLOWED", "POST only", 405);
  }
  try {
    const body = await req.json().catch(() => ({}));
    const artifactId = Number(body.artifactId);
    if (!Number.isFinite(artifactId)) {
      return errorJson("ARTIFACT_ID_REQUIRED", "artifactId가 필요합니다.", 400);
    }
    await analyzeArtifact(adminClient(), artifactId);
    return json({ status: "ok" });
  } catch (ex) {
    console.error(ex);
    return errorJson("INTERNAL_ERROR", "분석에 실패했습니다.", 500);
  }
});

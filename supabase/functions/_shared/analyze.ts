import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { embed, generateTags, geminiConfigured } from "./gemini.ts";
import { assignGroup } from "./grouping.ts";

export async function analyzeArtifact(admin: SupabaseClient, artifactId: number): Promise<void> {
  const { data: artifact, error } = await admin
    .from("artifacts")
    .select("id, space_id, title, content, members(nickname, school, major)")
    .eq("id", artifactId)
    .maybeSingle();
  if (error || !artifact) return;

  await admin.from("artifacts").update({
    status: "PROCESSING",
    updated_at: new Date().toISOString(),
  }).eq("id", artifactId);

  try {
    if (!geminiConfigured()) throw new Error("GEMINI_API_KEY is not set");
    const memberRaw = artifact.members;
    const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    let tags = await generateTags(artifact.title, artifact.content, member.school, member.major);
    if (tags.length === 0) {
      tags = await generateTags(artifact.title, artifact.content, member.school, member.major);
    }
    if (tags.length === 0) tags = ["미분류"];
    const embedding = await embed(artifact.title, artifact.content);
    await admin.from("artifacts").update({
      tags: JSON.stringify(tags),
      embedding: JSON.stringify(embedding),
      status: "READY",
      updated_at: new Date().toISOString(),
    }).eq("id", artifactId);
    await assignGroup(admin, artifactId);
  } catch (ex) {
    console.error("analyzeArtifact failed", artifactId, ex);
    await admin.from("artifacts").update({
      status: "FAILED",
      updated_at: new Date().toISOString(),
    }).eq("id", artifactId);
  }
}

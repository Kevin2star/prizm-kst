const EMBED_DIM = 768;
const MAX_EMBED_CHARS = 8000;

export function geminiConfigured(): boolean {
  const key = Deno.env.get("GEMINI_API_KEY");
  return !!key && key.trim() !== "";
}

function apiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

function tagModel(): string {
  return Deno.env.get("GEMINI_TAG_MODEL") || "gemini-2.5-flash";
}

function embedModel(): string {
  return Deno.env.get("GEMINI_EMBED_MODEL") || "gemini-embedding-001";
}

export function stripJson(raw: string | null | undefined): string {
  if (!raw) return "";
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

export async function generateContent(model: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    },
  );
  if (response.status === 429) {
    throw new Error("GEMINI_429");
  }
  if (!response.ok) {
    throw new Error(`Gemini generateContent failed: ${response.status}`);
  }
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function generateTags(
  title: string,
  content: string,
): Promise<string[]> {
  const prompt =
    `다음 결과물에서 핵심 주제, 접근 방식, 사용 기술/관점을 한국어 명사구 태그 3~5개로 추출하라.\n` +
    `JSON만 반환하고 마크다운 코드펜스를 쓰지 마라.\n` +
    `스키마: {"tags":["키워드1","키워드2","키워드3"]}\n` +
    `제목: ${title}\n본문:\n${content}`;
  const text = await generateContent(tagModel(), prompt);
  return parseTags(text);
}

function parseTags(raw: string): string[] {
  try {
    const node = JSON.parse(stripJson(raw));
    const tags = Array.isArray(node.tags) ? node.tags : [];
    return tags.filter((item: unknown) => typeof item === "string" && item.trim() !== "");
  } catch {
    return [];
  }
}

export async function embed(title: string, content: string): Promise<number[]> {
  let input = `${title}\n${content}`;
  if (input.length > MAX_EMBED_CHARS) input = input.slice(0, MAX_EMBED_CHARS);
  const model = embedModel();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text: input }] },
        outputDimensionality: EMBED_DIM,
      }),
    },
  );
  if (response.status === 429) throw new Error("GEMINI_429");
  if (!response.ok) throw new Error(`Gemini embed failed: ${response.status}`);
  const data = await response.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) throw new Error("empty embedding");
  return values.map((v: unknown) => Number(v));
}

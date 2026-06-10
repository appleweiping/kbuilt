// kbuilt — AI one-line summary (Vercel serverless function).
//
// IMPORTANT: this function NEVER touches the video bytes. It only fetches the
// page's title/description (tiny) and asks Claude for a one-line Chinese
// summary, so it stays far inside Vercel's free 300s / 100GB limits.
//
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "ANTHROPIC_API_KEY not set on the server" }, 500);

  let url;
  try { ({ url } = await req.json()); } catch { return json({ error: "bad json" }, 400); }
  if (!url) return json({ error: "missing url" }, 400);

  // grab lightweight page metadata (title + og:description) only
  let meta = "";
  try {
    const html = await (await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } })).text();
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || "";
    const desc = (html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || "";
    meta = `标题: ${title}\n描述: ${desc}`.slice(0, 2000);
  } catch {
    meta = `URL: ${url}`;
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `用一句中文概括这个视频的内容（不超过40字）。仅根据以下元数据：\n\n${meta}`,
        }],
      }),
    });
    const data = await r.json();
    const text = data?.content?.[0]?.text?.trim() || "（无法生成摘要）";
    return json({ result: text });
  } catch (e) {
    return json({ error: "AI call failed: " + e.message }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

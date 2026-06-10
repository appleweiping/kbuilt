// kbuilt — subtitle fetch + translate to Chinese (Vercel serverless function).
//
// Lightweight: translates caption text when the client already has it. This
// endpoint intentionally does not fetch video bytes or proxy media through
// Vercel, so it stays well within Vercel's free limits.
//
// Env: ANTHROPIC_API_KEY (Claude). Optional: ENGINE_URL (the HF cobalt space).

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "ANTHROPIC_API_KEY not set on the server" }, 500);

  let url, text;
  try { ({ url, text } = await req.json()); } catch { return json({ error: "bad json" }, 400); }

  // If the client already extracted caption text, just translate it. Automatic
  // caption extraction is not wired yet because the public downloader path must
  // never route media bytes through Vercel.
  if (!text) {
    return json({
      result:
        "字幕翻译需要先拿到原始字幕文本。\n" +
        "当前公开站点不会通过 Vercel 抓取或代理视频/字幕流；\n" +
        "若后续 UI 提供字幕文本，本接口会只翻译文本。",
    });
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
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `把下面的字幕翻译成自然流畅的简体中文，保留时间轴/行结构：\n\n${String(text).slice(0, 12000)}`,
        }],
      }),
    });
    const data = await r.json();
    const out = data?.content?.[0]?.text?.trim() || "（翻译失败）";
    return json({ result: out });
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

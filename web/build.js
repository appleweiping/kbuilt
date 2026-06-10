// kbuilt build step (runs on Vercel). Injects the HF engine URL from the env
// var NEXT_PUBLIC_ENGINE_URL into public/config.js so we don't hardcode it.
// If the env var is absent (e.g. local), config.js keeps its placeholder.

const fs = require("fs");
const path = require("path");

const engine = process.env.NEXT_PUBLIC_ENGINE_URL || process.env.ENGINE_URL || "";
const cfgPath = path.join(__dirname, "public", "config.js");

if (engine) {
  const normalized = engine.replace(/\/?$/, "/");
  const content = `// generated at build time — do not edit by hand
window.KBUILT_CONFIG = {
  ENGINE_URL: ${JSON.stringify(normalized)},
  API_BASE: "/api",
};
`;
  fs.writeFileSync(cfgPath, content);
  console.log("[kbuilt] config.js -> ENGINE_URL =", normalized);
} else {
  console.log("[kbuilt] NEXT_PUBLIC_ENGINE_URL not set; keeping existing config.js");
}

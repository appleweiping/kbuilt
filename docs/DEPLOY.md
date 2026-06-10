# 部署指南 / Deploy guide

kbuilt 分两层，都免费、都在云上，**你本地不跑任何东西、不占 CPU/内存**：

1. **引擎层**（下载干活）→ Hugging Face Spaces（Docker，免费）
2. **前端层**（你看到的网站）→ Vercel（静态站 + 轻量 API，免费）

按顺序做一次，之后就是个网址，打开即用。

---

## 第一步：部署下载引擎到 Hugging Face Spaces

1. 注册/登录 https://huggingface.co （免费，无需信用卡）。
2. 右上角头像 → **New Space**。
   - Owner：你的用户名
   - Space name：`kbuilt-engine`
   - License：随意（如 mit）
   - **Select the SDK：选 `Docker` → `Blank`**
   - Visibility：**Public**（公开，否则前端调不到）
   - 点 **Create Space**。
3. 把本仓库 `engine/` 目录里的文件传到这个 Space：
   - 简单做法：在 Space 页面点 **Files → Add file → Upload files**，
     把 `engine/Dockerfile` 和 `engine/README.md` 拖进去。
   - （`README.md` 顶部的 `sdk: docker` / `app_port: 7860` 配置头 HF 会自动识别。）
4. 设置引擎自己的公开地址：
   - Space 页 **Settings → Variables and secrets → New variable**
   - Name：`API_URL`
   - Value：你的 Space 公开地址，形如
     `https://<你的用户名>-kbuilt-engine.hf.space/`（**结尾要带 `/`**）
   - 保存。Space 会自动重新构建（约 2-4 分钟）。
5. 构建完成后，浏览器打开 `https://<你的用户名>-kbuilt-engine.hf.space/`，
   应返回一段 JSON（cobalt 版本信息）→ 引擎就绪。

> **休眠提示**：HF 免费 Space 闲置一段时间会休眠，下次访问冷启动约 30 秒。
> 前端已处理这个等待。想常驻可在 docs 里看"保活"小节。

---

## 第二步：部署前端到 Vercel

1. 先把本项目推到你的 GitHub（见仓库根 README 的 git 步骤，或已自动完成）。
2. 登录 https://vercel.com （用 GitHub 账号登录，免费 Hobby 档）。
3. **Add New → Project → Import** 你的 `kbuilt` 仓库。
4. 关键设置：
   - **Root Directory：选 `web`**（前端在子目录）。
   - Framework Preset：`Other`（vercel.json 已配好 build）。
   - **Environment Variables** 加两个：
     | Name | Value |
     |------|-------|
     | `NEXT_PUBLIC_ENGINE_URL` | 第一步的 Space 地址，如 `https://<用户名>-kbuilt-engine.hf.space/` |
     | `ANTHROPIC_API_KEY` | 你的 Claude API key（只为 AI 摘要/字幕功能；不填则 AI 按钮提示未配置，下载照常用） |
5. 点 **Deploy**。约 1 分钟后给你一个网址，如 `https://kbuilt.vercel.app`。

打开那个网址 → 粘贴视频链接 → 选画质 → 点 download。完成。

---

## 怎么用（终端用户）

1. 浏览器打开你的 Vercel 网址。
2. 粘贴 B站/抖音/X/TikTok/YouTube 等视频链接。
3. 选画质和模式（视频+音频 / 仅音频 / 静音）。
4. 点 ⬇ download，文件直接存进你的下载文件夹。
5. 可选：点 AI 的 summarize / 字幕→中文。

**完全零安装**：用户什么都不用装，跟用任何网站一样。

---

## 关于 YouTube 的诚实说明

YouTube 会封机房 IP，而 HF Spaces 用的就是机房 IP。所以：
- **B站 / 抖音 / X / TikTok / Instagram / Reddit / Twitch / Vimeo / SoundCloud 等：稳定可用。**
- **YouTube：可能间歇失败**，提示 `youtube.api_error` 之类。
  缓解办法：给引擎配 cookies（`engine/cookies.example.json` → 设 `COOKIE_PATH`），
  或给 Space 挂代理（`HTTP_PROXY` 环境变量）。
  这是所有免费云下载器的共同难题，不是 kbuilt 的 bug。

---

## 保活（可选，让引擎不休眠）

免费方案下引擎闲置会睡。若想减少冷启动：
- 用 https://cron-job.org （免费）每 10 分钟 GET 一次你的 Space 地址；
- 或 GitHub Actions 定时 curl。
注意这只是减少等待，HF 免费档仍可能在长时间高压下限速，属正常。

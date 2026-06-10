<div align="center">

<img src="./assets/banner.png" alt="kbuilt — 公开浏览器视频下载器" width="100%" />

# kbuilt

[English](./README.md) · **中文** · [日本語](./README.ja.md) · [한국어](./README.ko.md)

**公开可直接使用、零安装的浏览器视频下载器，后端复用自部署 cobalt 引擎。**

[![engine](https://img.shields.io/badge/engine-Hugging%20Face%20Spaces-6b8cff)](https://weipingapple-kbuilt-engine.hf.space/)
[![frontend](https://img.shields.io/badge/frontend-Vercel-111111)](https://kbuilt.vercel.app/)
[![license](https://img.shields.io/badge/license-MIT-2fae6a)](./LICENSE)

</div>

---

## 这是什么

kbuilt 的目标是一个陌生用户搜索到也能直接用的网站：

1. 打开公开的 kbuilt 网站。
2. 粘贴公开视频链接，例如 YouTube、B站、抖音、TikTok、X/Twitter、Instagram、Reddit、Vimeo、SoundCloud 等 cobalt 支持的网站。
3. 选择画质和模式。
4. 点击下载，在浏览器里保存文件。

用户不需要安装桌面软件、浏览器扩展、本地 `yt-dlp`，也不需要登录。
网页会直接调用公开的 Hugging Face Spaces 引擎；引擎运行
[imputnet/cobalt](https://github.com/imputnet/cobalt)。

## 公开地址

| 服务 | 地址 |
|---|---|
| 网页 | https://kbuilt.vercel.app/ |
| 引擎健康检查 | https://weipingapple-kbuilt-engine.hf.space/ |
| 源码 | https://github.com/appleweiping/kbuilt |

## 架构

```
浏览器用户
  |
  | 打开 kbuilt 并提交视频链接
  v
Vercel 静态前端
  |
  | 直接调用引擎，视频流不经过 Vercel
  v
HF Spaces Docker 引擎：cobalt
  |
  | tunnel / redirect / picker 返回
  v
浏览器保存媒体文件
```

硬边界：

- Vercel 只负责静态 UI 和可选的极轻量 AI 文本接口。
- 下载流由 HF Spaces 上的 cobalt 引擎产生，直接到用户浏览器。
- kbuilt 不缓存视频、不保存用户链接、不用 Vercel 代理视频。
- 前端请求显式设置 `localProcessing: "disabled"`，保证公开站点保持零安装、零本地转码/合并。

## 功能

- 支持 cobalt 可处理的公开链接：YouTube、Bilibili、抖音、TikTok、X/Twitter、Instagram、Reddit、Twitch、Vimeo、SoundCloud、Pinterest、Tumblr 等。
- 画质选择：max / 2160p / 1080p / 720p / 480p。
- 模式：视频+音频、仅音频、静音。
- 四语界面：中文、英文、日文、韩文。
- 亮/暗终端风格 UI。
- 可选 AI 摘要只基于网页元数据；字幕翻译不再假装自动可用，除非后续 UI 能提供真实字幕文本。

## 关于 YouTube 的诚实说明

YouTube 经常封锁机房 IP。HF Spaces 属于机房基础设施，所以 YouTube 可能间歇失败，或者需要给引擎额外配置 cookies / proxy。这是免费云下载器的共同限制，不是 kbuilt 自己的提取逻辑坏了。

生产验收优先使用非 YouTube 的公开链接，例如 TikTok、SoundCloud、X/Twitter、Instagram、Reddit、Twitch、Vimeo、抖音，以及 cobalt 上游当前可用时的 B站。各站可用性会跟随 cobalt 上游和平台反爬策略变化。

## 部署

完整步骤见 [docs/DEPLOY.md](./docs/DEPLOY.md)。

生产形态：

- 引擎：公开 Hugging Face Docker Space `weipingapple/kbuilt-engine`
- 前端：公开 Vercel 项目 `kbuilt`，Root Directory 为 `web`
- 引擎地址：`https://weipingapple-kbuilt-engine.hf.space/`

## 许可与致谢

- 本仓库的前端、API 胶水、文档和资产使用 [MIT License](./LICENSE)。
- 下载引擎为 [imputnet/cobalt](https://github.com/imputnet/cobalt)，AGPL-3.0 许可。kbuilt 使用官方容器镜像，未修改 cobalt 源码。

无担保。请只下载你有权下载的内容。

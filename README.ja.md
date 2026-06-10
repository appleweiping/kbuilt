<div align="center">

<img src="./assets/banner.png" alt="kbuilt — public browser video downloader" width="100%" />

# kbuilt

[English](./README.md) · [中文](./README.zh.md) · **日本語** · [한국어](./README.ko.md)

**公開サイトとしてそのまま使える、インストール不要のブラウザ動画ダウンローダー。自前の cobalt エンジンで動きます。**

[![engine](https://img.shields.io/badge/engine-Hugging%20Face%20Spaces-6b8cff)](https://weipingapple-kbuilt-engine.hf.space/)
[![frontend](https://img.shields.io/badge/frontend-Vercel-111111)](https://kbuilt.vercel.app/)
[![license](https://img.shields.io/badge/license-MIT-2fae6a)](./LICENSE)

</div>

---

## これは何か

kbuilt は、初めて訪れた人でもすぐ使える公開 Web サイトを目指しています。

1. 公開 kbuilt サイトを開く。
2. YouTube、Bilibili、Douyin、TikTok、X/Twitter、Instagram、Reddit、Vimeo、SoundCloud など、cobalt が対応する公開動画 URL を貼り付ける。
3. 画質とモードを選ぶ。
4. ダウンロードをクリックし、ブラウザでファイルを保存する。

デスクトップアプリ、拡張機能、ローカル `yt-dlp`、ユーザーログインは不要です。
Web アプリは Hugging Face Spaces 上の公開エンジンを直接呼び出し、そのエンジンは
[imputnet/cobalt](https://github.com/imputnet/cobalt) を実行します。

## 公開 URL

| Surface | URL |
|---|---|
| Web app | https://kbuilt.vercel.app/ |
| Engine health | https://weipingapple-kbuilt-engine.hf.space/ |
| Source | https://github.com/appleweiping/kbuilt |

## アーキテクチャ

```
ブラウザ利用者
  |
  | kbuilt を開いて動画 URL を送信
  v
Vercel 静的フロントエンド
  |
  | エンジンを直接呼ぶ。動画データは Vercel を通らない
  v
HF Spaces Docker engine running cobalt
  |
  | tunnel / redirect / picker
  v
ブラウザがメディアファイルを保存
```

重要な境界：

- Vercel は静的 UI と任意の軽量 AI テキスト API だけを担当します。
- ダウンロードストリームは HF Spaces の cobalt エンジンからブラウザへ直接流れます。
- kbuilt はメディアをキャッシュせず、ユーザーのリンクを保存せず、Vercel で動画をプロキシしません。
- フロントエンドは `localProcessing: "disabled"` を指定し、公開サイトをインストール不要・ローカル変換なしに保ちます。

## 機能

- cobalt が対応する公開リンクに対応：YouTube、Bilibili、Douyin、TikTok、X/Twitter、Instagram、Reddit、Twitch、Vimeo、SoundCloud、Pinterest、Tumblr など。
- 画質選択：max / 2160p / 1080p / 720p / 480p。
- モード：動画+音声、音声のみ、ミュート。
- 4 言語 UI：中国語、英語、日本語、韓国語。
- ライト/ダークのターミナル風 UI。
- 任意の AI 要約はページメタデータに基づくものです。字幕翻訳は、字幕テキストが提供されるまで自動機能としては扱いません。

## YouTube についての正直な注意

YouTube はデータセンター IP をブロックすることがあります。HF Spaces はデータセンター基盤なので、YouTube は不安定になったり、cookies / proxy が必要になったりします。これは無料クラウド型ダウンローダー共通の制約で、kbuilt 独自の抽出ロジックの問題ではありません。

本番検証では、TikTok、SoundCloud、X/Twitter、Instagram、Reddit、Twitch、Vimeo、Douyin、そして cobalt upstream が現在対応できている場合の Bilibili など、YouTube 以外の公開リンクを優先してください。各サービスの安定性は cobalt upstream と各プラットフォームの bot 対策に従います。

## デプロイ

詳細は [docs/DEPLOY.md](./docs/DEPLOY.md) を参照してください。

本番構成：

- Engine: public Hugging Face Docker Space `weipingapple/kbuilt-engine`
- Front-end: public Vercel project `kbuilt`, root directory `web`
- Engine URL: `https://weipingapple-kbuilt-engine.hf.space/`

## ライセンスと謝辞

- このリポジトリのフロントエンド、API glue、ドキュメント、アセットは [MIT License](./LICENSE) です。
- ダウンロードエンジンは AGPL-3.0 の [imputnet/cobalt](https://github.com/imputnet/cobalt) です。kbuilt は公式コンテナイメージを使用し、cobalt のソースコードは変更していません。

無保証です。ダウンロードする権利のあるコンテンツにのみ使用してください。

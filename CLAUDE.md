# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Ghosttyターミナルのテーマ管理CLIツール（`ghostty-theme`コマンド）。お気に入りテーマの管理、対話的なテーマ選択、ランダム設定などを提供する。

## コマンド

- `npm run build` — TypeScriptコンパイル（`dist/`に出力）
- `npm run dev` — tsxで直接実行（開発時）
- テストフレームワークは未導入

## アーキテクチャ

```
src/
  index.ts          # CLIエントリポイント（Commander.jsでコマンド定義）
  types.ts          # Theme, Favorites インターフェース
  commands/         # 各CLIコマンドの実装（set, list, random, add, remove）
  lib/              # コア機能
    config.ts       # Ghostty設定ファイル（~/.config/ghostty/config）の読み書き
    themes.ts       # `ghostty +list-themes`経由で全テーマ取得・検索
    favorites.ts    # お気に入りJSON（~/.config/ghostty-theme-cli/favorites.json）管理
    prompt.ts       # 検索付きインタラクティブセレクター（raw mode, ANSIエスケープ）
```

### データフロー

- **テーマ一覧**: `ghostty +list-themes`外部コマンドの出力をパースして取得
- **設定の書き換え**: Ghostty設定ファイル内の`theme = <name>`行を直接編集
- **お気に入り永続化**: JSON形式でローカルファイルに保存。初回実行時はデフォルト12テーマで初期化

### 設計パターン

- Commander.jsベース。各コマンドは`commands/`内の独立ファイルで、対応するlib関数を組み合わせて実装
- `GHOSTTY_CONFIG_PATH`環境変数でGhostty設定パスをオーバーライド可能
- prompt.tsはNode.jsのraw modeとANSIエスケープシーケンスで独自の対話UIを実装（外部UIライブラリ不使用）

## 技術スタック

- TypeScript（ES2022, Node16モジュール, strict mode）
- chalk: ターミナルカラー出力
- commander: CLIフレームワーク

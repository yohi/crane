# MSTB (Multi-Session Tile Browser) - Crane

MSTB (Crane) は、ElectronとReactを使用して構築された、タイル型レイアウトのマルチセッションブラウザです。

最大の特徴は、各タイル（ウェブビュー）が**独立したセッション**を持っていることです。これにより、異なるアカウントでの同時ログインや、クッキー・ローカルストレージの分離が必要な作業を単一のウィンドウで効率的に行うことができます。

## 主な機能

*   **タイル表示**: 複数のウェブサイトをグリッド状に同時に表示・操作できます。
*   **セッション分離**: 各ビューは `ViewManager` と `SessionManager` によって管理され、完全に独立したメモリ上のセッション（パーティション）で動作します。クッキーやストレージは共有されません。
*   **セキュリティ**: 強固なコンテンツセキュリティポリシー (CSP) とコンテキスト分離 (Context Isolation) を採用しています。
*   **ナビゲーション**: 各タイルで「戻る」「リロード」「フォーカス」などの操作が可能です。

## 技術スタック

*   **Core**: [Electron](https://www.electronjs.org/) (v34)
*   **UI Library**: [React](https://react.dev/) (v19)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Testing**: [Playwright](https://playwright.dev/)

## 開発環境のセットアップ

### 前提条件

*   Node.js (LTSバージョンの利用を推奨)
*   npm

### インストール

プロジェクトの依存関係をインストールします。

```bash
npm install
```

### 開発サーバーの起動

開発モードでアプリを起動します。RendererプロセスとMainプロセスが同時に監視モードで起動します。

```bash
npm run dev
```

### ビルド

プロダクション用のビルドを行います。`dist/` ディレクトリにファイルが出力されます。

```bash
npm run build
```

### テスト

Playwrightを使用したE2Eテストが設定されています。

```bash
npx playwright test
```

## アーキテクチャ概要

*   **Main Process**: アプリケーションのライフサイクル、`BrowserView` の作成・管理、およびセッションの分離を担当します。
    *   `SessionManager`: セッションの作成と破棄を管理します。
    *   `ViewManager`: `BrowserView` の配置とIPC通信を制御します。
*   **Renderer Process**: ユーザーインターフェース（React）を描画します。各タイルの配置情報をIPC経由でMainプロセスに送信し、それに基づいて `BrowserView` がオーバーレイ表示されます。

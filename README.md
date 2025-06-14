# Doctor Car App

ドクターカー運用支援システムのPoC（概念実証）版

## 概要

このアプリケーションは、ドクターカーの運用効率化と医療の質向上を目的としたリアルタイム情報共有システムです。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Firebase (BaaS)
- **データベース**: Cloud Firestore
- **認証**: Firebase Authentication
- **スタイリング**: Tailwind CSS
- **地図**: Leaflet
- **状態管理**: Zustand
- **テスト**: Jest + React Testing Library
- **開発手法**: TDD + BDD

## 機能

- ✅ 認証システム（ログイン・ログアウト・デモログイン）
- ✅ 事案一覧表示
- ✅ 事案詳細表示
- ✅ リアルタイムデータ同期
- 🚧 バイタルサイン管理（実装予定）
- 🚧 処置記録管理（実装予定）
- 🚧 チャット機能（実装予定）
- 🚧 地図・位置情報（実装予定）

## セットアップ

### 前提条件

- Node.js 18.x以上
- npm 9.x以上
- Firebase プロジェクト（本番環境のみ）

### 環境構築

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定（本番環境のみ）
`.env.local`ファイルを作成し、Firebase設定を記入

3. Firebase エミュレーターの起動（開発時）
```bash
npm run emulator
```

4. 開発サーバーの起動
```bash
npm run dev
```

### デモ環境（プロダクション）

Firebase設定不要でデモデータを使用したバージョンです。

```bash
# デモ環境ビルド
npm run build:demo

# プレビュー
npm run preview
```

## スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run build:demo` - デモ環境ビルド
- `npm run preview` - ビルド結果のプレビュー
- `npm test` - テスト実行
- `npm run test:watch` - テスト監視モード
- `npm run test:coverage` - カバレッジ付きテスト
- `npm run lint` - ESLint実行
- `npm run format` - Prettier実行
- `npm run type-check` - TypeScript型チェック
- `npm run emulator` - Firebase エミュレーター起動

## デプロイメント

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 手動デプロイ
```bash
npm run build:demo
# distフォルダを任意の静的ホスティングサービスにアップロード
```

## 開発手法

本プロジェクトは **TDD（テスト駆動開発）+ BDD（振る舞い駆動開発）** で開発されています。

### TDD（Test-Driven Development）
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通すコードを書く
3. **Refactor**: コードを改善する

### BDD（Behavior-Driven Development）
- **Given-When-Then** 形式でユーザーの振る舞いをテスト
- ユーザーストーリーに基づく機能開発

## プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── common/         # 共通コンポーネント
│   ├── auth/           # 認証関連
│   ├── cases/          # 事案関連
│   └── ...
├── pages/              # ページコンポーネント
├── services/           # Firebase API ラッパー
├── stores/             # Zustand ストア
├── types/              # TypeScript 型定義
├── utils/              # ユーティリティ関数
├── constants/          # 定数
└── __tests__/          # テストファイル
```

## ライセンス

このプロジェクトは概念実証用です。

## 開発者向け情報

### コンポーネント作成規約
- 関数コンポーネント + TypeScript
- Props は interface で型定義
- テストファイルを必ず作成

### 状態管理規約
- Zustand を使用
- ストアは機能別に分割
- リアルタイム同期は Firebase の onSnapshot を使用

### テスト規約
- 単体テスト: `*.test.ts(x)`
- BDD テスト: `*.bdd.test.ts(x)`
- 統合テスト: `*.integration.test.ts(x)`

詳細な開発ガイドは設計ドキュメントを参照してください。
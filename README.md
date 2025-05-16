# 数独アプリ（Sudoku App）- 技術詳細ドキュメント

本アプリケーションは、React、Express、PostgreSQLを使用した完全なフルスタック数独ゲームです。クロスデバイスでのプレイを実現するための認証、ゲーム状態の永続化、ソーシャル機能を備えています。

## アーキテクチャ概要

このプロジェクトはフロントエンド（React）とバックエンド（Express）が連携するフルスタックアプリケーションです。データの永続化にはPostgreSQLデータベースとDrizzle ORMを使用しています。

### ディレクトリ構造

```
.
├── client/                # フロントエンドアプリケーション
│   ├── src/              
│   │   ├── components/    # UIコンポーネント
│   │   ├── context/       # Reactコンテキスト
│   │   ├── hooks/         # カスタムフック
│   │   ├── lib/           # ユーティリティ関数
│   │   ├── pages/         # ページコンポーネント
│   │   └── ...
├── server/                # バックエンドサーバー
│   ├── db.ts              # データベース接続
│   ├── index.ts           # サーバーエントリーポイント
│   ├── routes.ts          # APIルート定義
│   ├── storage.ts         # データストレージ層
│   ├── sudoku.ts          # 数独ゲームロジック
│   └── ...
└── shared/                # 共有コード
    └── schema.ts          # データベーススキーマ定義
```

## 技術スタックの詳細

### フロントエンド

- **React**: UIレンダリングライブラリ
- **TypeScript**: 型安全な開発環境
- **TailwindCSS**: ユーティリティファーストのCSSフレームワーク
- **shadcn/ui**: 再利用可能なUIコンポーネントライブラリ
- **TanStack Query (React Query)**: サーバー状態管理
- **Wouter**: 軽量ルーティングライブラリ
- **Zod**: スキーマ検証ライブラリ
- **React Hook Form**: フォーム管理

### バックエンド

- **Express.js**: Node.jsウェブアプリケーションフレームワーク
- **TypeScript**: 型安全な開発環境
- **Drizzle ORM**: TypeScriptファーストのORMライブラリ
- **PostgreSQL**: リレーショナルデータベース
- **Zod**: リクエスト検証
- **OpenID Connect**: Replit認証
- **Express Session**: セッション管理

## データモデル

主要なデータモデルは `shared/schema.ts` で定義されています：

### 主要なエンティティ

1. **User**: ユーザー情報
   - id: ユーザーID（Replit認証から）
   - email: メールアドレス
   - firstName, lastName: 氏名
   - profileImageUrl: プロフィール画像
   - createdAt, updatedAt: タイムスタンプ

2. **Puzzle**: 数独パズルの定義
   - id: パズルID
   - initialBoard: 初期ボード状態
   - solvedBoard: 解答ボード状態
   - difficultyLevel: 難易度レベル (1-10)
   - createdAt: 作成日時

3. **Game**: ユーザーのゲームインスタンス
   - id: ゲームID
   - userId: プレイヤーID
   - puzzleId: 使用パズルID
   - currentBoard: 現在のボード状態
   - isCompleted: 完了フラグ
   - timeSpent: プレイ時間（秒）
   - startedAt, completedAt: タイムスタンプ
   - createdAt, updatedAt: タイムスタンプ

4. **SharedPuzzle**: パズル共有情報
   - id: 共有ID
   - senderId: 送信者ID
   - receiverId: 受信者ID
   - puzzleId: 共有パズルID
   - message: メッセージ
   - isPlayed: プレイ済みフラグ
   - sharedAt: 共有日時

5. **Friend**: 友達関係
   - id: 関係ID
   - userId: ユーザーID
   - friendId: 友達ID
   - createdAt: 作成日時

## 認証システム

このアプリはReplit認証サービス（OpenID Connect）を使用してユーザー認証を実装しています。

1. **セットアップ**: `server/replitAuth.ts` でOpenID Connect設定
2. **認証フロー**:
   - `/api/login`: 認証開始
   - `/api/callback`: 認証コールバック
   - `/api/logout`: ログアウト処理
3. **セッション**: PostgreSQLベースのセッションストア

## 数独ゲームエンジン

ゲームロジックは `server/sudoku.ts` に実装されています：

1. **パズル生成**: 異なる難易度のパズルを動的に生成
2. **検証ロジック**: ボードの有効性確認
3. **複雑度アルゴリズム**: 難易度を評価するためのアルゴリズム

## API設計

APIエンドポイントは `server/routes.ts` で定義されています：

### 主要なエンドポイント

#### 認証
- `GET /api/login`: 認証フロー開始
- `GET /api/callback`: 認証コールバック
- `GET /api/logout`: ログアウト
- `GET /api/auth/user`: 現在のユーザー情報取得

#### ゲーム
- `GET /api/games`: ゲーム一覧取得
- `GET /api/games/:id`: 特定ゲーム取得
- `GET /api/games/active`: アクティブゲーム取得
- `POST /api/games`: 新規ゲーム作成
- `PATCH /api/games/:id`: ゲーム更新（進行状況保存）

#### ソーシャル
- `GET /api/friends`: 友達一覧取得
- `POST /api/friends`: 友達追加
- `DELETE /api/friends/:id`: 友達削除
- `GET /api/shared-puzzles`: 共有パズル一覧取得
- `POST /api/shared-puzzles`: パズル共有

#### 統計
- `GET /api/stats`: ユーザー統計取得

## フロントエンド実装

### 状態管理

ゲーム状態は `client/src/context/game-context.tsx` でReactコンテキストを使って管理されています。主な状態：

1. **ゲームボード**: 現在のボード状態
2. **選択セル**: 現在選択されているセル
3. **タイマー**: ゲームプレイ時間
4. **フラグ**: 完了フラグ、コンフリクト等

### コンポーネント構造

1. **SudokuBoard**: ゲームボード表示と操作
2. **NumberPad**: 数字入力パッド
3. **GameControls**: ゲームコントロール（リセット等）
4. **Tabs**: ナビゲーションタブ
5. **CelebrationOverlay**: 完了時のお祝い表示

### レスポンシブデザイン

モバイルとデスクトップの両方に対応した設計：

1. **MobileTabs**: モバイル用下部タブナビゲーション
2. **デスクトップレイアウト**: 上部タブと広いゲームボード

## キャッシング戦略

TanStack Query (React Query) を使用したキャッシング：

1. **キャッシュ無効化**: データ更新後の適切なキャッシュ無効化
2. **リフェッチ**: 必要に応じてデータの再取得
3. **エラーハンドリング**: エラー状態の管理と表示

## データベースアクセス

Drizzle ORMを使用したデータベース操作：

1. **型安全なクエリ**: TypeScriptの型システムを活用
2. **トランザクション**: 必要に応じたトランザクション処理
3. **リレーションシップ**: テーブル間の関連を表現

## パフォーマンス最適化

1. **メモ化**: 不要な再レンダリングを防止
2. **遅延ローディング**: 必要に応じたデータ読み込み
3. **サーバー側レンダリング**: 初期ロード高速化

## セキュリティ

1. **入力検証**: Zodを使用したリクエストデータの検証
2. **認証ミドルウェア**: 保護されたルートのアクセス制御
3. **CSRF保護**: クロスサイトリクエストフォージェリ対策

## 環境変数

本アプリケーションは以下の環境変数を使用します：

```
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your_session_secret
REPLIT_DOMAINS=your.domain.com
REPL_ID=your_repl_id
```

## 開発環境のセットアップ

1. リポジトリをクローン
   ```
   git clone <repository-url>
   cd sudoku-app
   ```

2. 依存関係のインストール
   ```
   npm install
   ```

3. PostgreSQLデータベース設定
   ```
   // スキーマ生成
   npm run db:push
   ```

4. 開発サーバーの起動
   ```
   npm run dev
   ```

## テスト

現在、以下のテスト戦略を検討中：

1. **ユニットテスト**: 個別関数とコンポーネントのテスト
2. **インテグレーションテスト**: APIとデータフローのテスト
3. **エンドツーエンドテスト**: ユーザーフローの完全テスト

## 今後の開発予定

1. **ヒント機能**: 困難なパズルのヒント提供
2. **UIの改善**: よりモダンで使いやすいインターフェース
3. **モバイルアプリ**: iOS/Androidネイティブアプリ
4. **オフラインモード**: オフライン時のプレイ対応
5. **マルチプレイヤー**: リアルタイム対戦モード

## 既知の問題と対応

1. **日付処理**: タイムゾーンとフォーマット統一
2. **HTMLの入れ子**: ナビゲーションのDOM構造改善
3. **自動保存エラー**: 非アクティブ時の保存処理改善

## コントリビューションガイドライン

1. イシューを作成して変更を提案
2. フォークしてプルリクエストを作成
3. コーディング規約に従う
4. テストを追加・更新する

## ライセンス

[MIT License](LICENSE)
# Bolt LP Integration

このプロジェクトは、Boltで作成したランディングページをNext.jsの`/lp`ルートで表示し、自動同期機能を提供します。

## 🎯 機能

- **Bolt LP表示**: `/lp`ルートでBoltアプリを表示
- **リバースプロキシ**: Next.js経由での配信
- **自動同期**: Boltの変更を自動検知・同期
- **GitHub管理**: 変更をGitHubで管理

## 🚀 セットアップ

### 1. プロジェクトの起動

```bash
npm install
npm run dev
```

### 2. アクセス

- **Bolt LP**: http://localhost:3000/lp
- **メインアプリ**: http://localhost:3000

## 🔄 Bolt同期

### 手動同期

```bash
# Boltプロジェクトの変更をチェック
npm run bolt:check

# 同期を実行
npm run bolt:sync

# エクスポートガイドを表示
npm run bolt:export
```

### 自動同期（cron）

```bash
# 5分ごとに同期をチェック
*/5 * * * * cd /path/to/project && npm run bolt:check
```

## 📁 プロジェクト構造

```
stabo.dev/
├── public/lp/           # Boltアプリの静的ファイル
├── scripts/
│   └── sync-bolt.js     # 自動同期スクリプト
├── next.config.ts       # リバースプロキシ設定
└── BOLT_INTEGRATION.md  # このファイル
```

## 🔧 設定

### Boltプロジェクト設定

`scripts/sync-bolt.js`で以下の設定を変更できます：

```javascript
const BOLT_PROJECT_ID = 'sb1-jsns8dmm';  // あなたのBoltプロジェクトID
const BOLT_URL = `https://bolt.new/~/${BOLT_PROJECT_ID}`;
```

## 📝 手動エクスポート手順

BoltのAPIが利用できない場合の手動エクスポート手順：

1. **Boltプロジェクトを開く**: https://bolt.new/~/sb1-jsns8dmm
2. **エクスポート**: "Export"または"Download"ボタンをクリック
3. **ファイル展開**: ダウンロードしたファイルを展開
4. **コピー**: 内容を`public/lp/`にコピー
5. **パス修正**: `index.html`のアセットパスを`/lp/`プレフィックスに修正

## 🔍 トラブルシューティング

### 同期エラー

```bash
# ログを確認
npm run bolt:check

# 手動でエクスポートガイドを表示
npm run bolt:export
```

### 表示エラー

1. `public/lp/`ディレクトリの存在確認
2. `index.html`のアセットパス確認
3. Next.jsサーバーの再起動

## 🤝 貢献

1. このブランチで作業: `bolt-lp-integration`
2. 変更をコミット
3. GitHubにプッシュ

## 📚 参考リンク

- [Bolt Project](https://bolt.new/~/sb1-jsns8dmm)
- [GitHub Repository](https://github.com/Ayth-bit/stabo.dev)
- [Next.js Documentation](https://nextjs.org/docs)

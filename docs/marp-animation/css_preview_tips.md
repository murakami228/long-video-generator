# CSS変更をプレビューに反映させるためのルール

## 重要なポイント

### なぜ即時反映されないのか
CSSファイル（`slide.css` など）はプロジェクトフォルダに保存されていますが、
Remotionが読み込むのは `public/data.json` に埋め込まれた `customCss` です。
このため、CSSファイルを編集しただけでは変更はプレビューに反映されません。

### 反映手順
1. CSSファイル（例: `projects/my_project/slide.css`）を編集
2. 以下のコマンドを実行：
   ```bash
   npx tsx scripts/sync_audio.ts [project_name]
   ```
3. Remotion Studio（ブラウザ）をリロード

### 自動化のヒント
開発中は、ファイル監視ツール（nodemon など）を使って `sync_audio.ts` を自動実行することも可能：
```bash
npx nodemon --watch projects/my_project/*.css --exec "npx tsx scripts/sync_audio.ts my_project"
```

## 関連ドキュメント
- [実装ガイド](./implementation_guide.md) - 全体的な使い方
- [タスク管理](./task.md) - 進捗状況

# Marpスライド動画生成システム - 実装ガイド

## 概要
Remotionを使用してMarp風のスライドをアニメーション付きで動画化するシステムです。

## ファイル構成

### プロジェクトフォルダ構成
```
projects/[project_name]/
├── input.json           # 台本・設定ファイル
├── slide.html           # デフォルトのスライドHTML
├── slide.css            # デフォルトのスライドCSS
├── slide_split.html     # Splitレイアウト用HTML
├── slide_split.css      # Splitレイアウト用CSS
├── slide_grid.html      # Gridレイアウト用HTML
├── slide_grid.css       # Gridレイアウト用CSS
├── data.json            # 生成されたデータ（sync_audio.tsで生成）
└── assets/
    └── audio/           # 音声ファイル
```

## input.json の書き方

### 基本構造
```json
{
    "project_name": "プロジェクト名",
    "theme": "テーマ",
    "platform": "YouTube Shorts",
    "customScript": {
        "title": "タイトル",
        "title_speech": "音声読み上げ用タイトル",
        "slideTemplate": "split",  // テンプレート名（省略可）
        "sections": [...]
    }
}
```

### slideTemplate オプション
| 値 | 使用ファイル | 説明 |
|---|---|---|
| (省略) | `slide.html` + `slide.css` | デフォルト |
| `"split"` | `slide_split.html` + `slide_split.css` | 左右分割レイアウト |
| `"grid"` | `slide_grid.html` + `slide_grid.css` | グリッドレイアウト |

### sections の書き方
```json
{
    "id": "step1",
    "text": "表示するテロップ（音声読み上げ内容）",
    "speaker": "zundamon",
    "type": "content",
    "step": true  // これがあるとスライド要素が順番に表示される
}
```

- `step: true` を設定すると、そのセクションの開始時に対応するスライド要素（`#item-1`, `#item-2`...）が表示されます

## スライドHTML/CSSの作成ルール

### HTML要素のID規則
- ステップ表示させたい要素には `id="item-1"`, `id="item-2"`, `id="item-3"`, `id="item-4"` などを付ける
- 最大対応数: 4個（拡張可能）

### CSS必須ルール
```css
/* 各要素は初期状態で非表示 */
#item-1, #item-2, #item-3, #item-4 {
    opacity: 0;
}

/* 下部にテロップ表示用の余白を確保 */
.your-slide-class {
    padding: 100px 100px 150px 100px !important;
    /* padding-bottom: 150px がテロップエリア */
}
```

### 推奨CSSプロパティ
```css
.your-slide-class {
    height: 100%;
    box-sizing: border-box !important;
    /* ...その他のレイアウト */
}
```

## 動画生成フロー

### 1. プロジェクト作成
```bash
mkdir -p projects/[project_name]/assets/audio
```

### 2. ファイル作成
- `input.json` - 台本
- `slide_[template].html` - スライドHTML
- `slide_[template].css` - スライドCSS

### 3. 音声生成
```bash
npx tsx scripts/generate_audio_batch.ts [project_name]
```

### 4. データ同期
```bash
npx tsx scripts/sync_audio.ts [project_name]
```
**重要**: CSSを変更した場合も必ずこのコマンドを実行すること（CSSはdata.jsonに埋め込まれるため）
**ヒント**: macOSでは、同期完了後に自動的にブラウザでプレビューページが開きます。

### 5. プレビュー確認
```bash
npx remotion studio
# ブラウザで http://localhost:3000 を開く（自動で開かない場合）
```

### 6. レンダリング
```bash
npx remotion render MarpExperiment out/[output_name].mp4
```

## 注意事項

### CSSがプレビューに反映されない場合
CSSファイル（`slide.css` など）を編集しても、Remotion Studioには即時反映されません。
必ず `npx tsx scripts/sync_audio.ts [project_name]` を実行してから、ブラウザをリロードしてください。

### 動画時間について
動画の長さは `data.json` の `durationInFrames` から自動計算されます。
`sync_audio.ts` が各音声ファイルの長さを計測し、合計時間を算出します。

### テロップと重ならないようにするには
スライドCSSで `padding-bottom` を十分に確保してください（推奨: 150px以上）。

## 現在利用可能なレイアウト

### 1. シンプルリスト型（デフォルト）
縦並びのカード式リスト。各ステップが順番に表示される。

### 2. 左右分割型（split）
左パネルにビジュアル、右パネルにステップリスト。比較や対照的な内容に最適。

### 3. グリッド型（grid）
2x2などのグリッド配置。複数の項目を一覧で見せたい場合に最適。

### スライドレイアウトの整合性維持（重要）
- **勝手な画像追加の禁止**: `MarpExperiment.tsx` やスライドHTML以外に、キャラクター画像や背景画像を勝手に追加・重畳してはいけません。スライドのデザインはHTML/CSS内で完結させる必要があります。
- **背景の透過性**: スライドコンポーネントは背景を透過（`background: transparent`）にし、下層のレイヤーを隠さないように設計してください。

### 検証フローの厳守
- **プレビュー優先**: 開発・修正段階では勝手にレンダリング（`render.ts`）を開始してはいけません。必ず `sync_audio.ts` でデータを同期し、`remotion studio` のプレビューでユーザーと内容を確認してください。
- **レンダリングの実行**: レンダリングはユーザーの指示があるまで、または最終確認が取れるまで実行しないでください。

## トラブルシューティング

| 問題 | 原因 | 解決方法 |
|---|---|---|
| CSS変更が反映されない | data.jsonが古い | `sync_audio.ts` を再実行 |
| 動画が途中で切れる | durationInFramesが固定 | Root.tsxを確認、data.durationInFramesを使用 |
| 要素が表示されない | opacityが0のまま | HTMLのid属性とCSSのセレクタを確認 |
| テロップとスライドが重なる | padding-bottomが不足 | CSSでpadding-bottomを150px以上に |

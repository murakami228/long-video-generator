# Long Video Generator - スライド作成ルール

## 概要
このドキュメントは、long-video-generatorでスライドを作成する際のルールを定義します。

## スライド形式

### 基本方針
- **Marpは使用しない**
- **HTML + CSS形式で一枚のスライドを作成**する
- スライドはRemotionコンポーネント内で動的にレンダリングされる

### ファイル構成
各プロジェクトディレクトリに以下のファイルを配置：

```
projects/
└── {project_name}/
    ├── input.json
    ├── slide_{template}.html  # 例: slide_grid.html
    └── slide_{template}.css   # 例: slide_grid.css
```

### テンプレート種類
`input.json`の`slideTemplate`フィールドで指定：

| テンプレート名 | 用途 | ファイル名 |
|---|---|---|
| `grid` | 2カラムのグリッドレイアウト | `slide_grid.html/css` |
| `split` | 左右分割レイアウト | `slide_split.html/css` |

---

## HTML構造

### 基本構造
```html
<section class="{template}-slide">
    <div class="slide-header">
        <h1>📋 スライドタイトル</h1>
    </div>

    <div class="grid-container">
        <!-- コンテンツセクション -->
        <div class="grid-section {section-class}">
            <div class="section-header">
                <span class="period-badge {color}">カテゴリ名</span>
            </div>
            <div class="record-list">
                <div class="record-item" id="item-1">
                    <span class="record-icon">📝</span>
                    <span class="record-name">項目名</span>
                </div>
                <!-- 追加項目... -->
            </div>
        </div>
    </div>

    <div class="tip-box" id="item-{n}">
        <span class="tip-icon">💡</span>
        <span class="tip-text">まとめ・ポイント</span>
    </div>
</section>
```

### アニメーション用ID
- 各項目には`id="item-1"`, `id="item-2"`...のIDを付与
- CSSで`opacity: 0`を設定し、Remotionで動的に表示制御

---

## CSS設計

### 必須スタイル
```css
.{template}-slide {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 60px 80px 150px 80px !important;  /* 字幕用の下余白 */
    box-sizing: border-box !important;
    background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
    font-family: 'Noto Sans JP', sans-serif;
    color: white;
}

/* アニメーション用：初期状態で非表示 */
#item-1, #item-2, #item-3, #item-4, #item-5, #item-6 {
    opacity: 0;
}
```

### 推奨デザイン要素
- **グラデーション背景**: 視覚的な深みを出す
- **カード形式**: 各項目は白背景のカードで表示
- **アイコン**: 絵文字を活用して視認性向上
- **バッジ**: カテゴリを色分けしたバッジで表示

---

## input.json設定

```json
{
    "customScript": {
        "slideTemplate": "grid",
        "sections": [
            {
                "id": "step1",
                "text": "表示テキスト",
                "step": true  // アニメーション対象
            }
        ]
    }
}
```

### フィールド説明
| フィールド | 説明 |
|---|---|
| `slideTemplate` | 使用するテンプレート名（`grid`, `split`など） |
| `step` | `true`にすると、そのセクションでスライドアイテムが表示される |

---

## サンプルプロジェクト
- `projects/unkou_kanri_kiroku/` - gridテンプレートの実例
- `projects/white_number_dump/` - splitテンプレートの実例

---

## 注意事項

### ⚠️ 必須ファイル（これがないとエラーになります）
| ファイル | 説明 |
|---|---|
| `input.json` | 台本・設定ファイル |
| `slide.html` または `slide_{template}.html` | スライドのHTML構造 |
| `slide.css` または `slide_{template}.css` | スライドのスタイル |

> **重要**: スライドファイルがない状態で `sync_audio.ts` を実行すると、エラーが出てそのプロジェクトはスキップされます。

### ⚠️ 必須フィールド（input.json内）
```json
{
    "customScript": {
        "slideTemplate": "grid",  // または "split"（省略時は slide.html を探す）
        "sections": [
            {
                "step": true  // アニメーション対象のセクションに設定
            }
        ]
    }
}
```

### チェックリスト
新しいプロジェクトを作成する際は、以下を確認してください：

- [ ] `projects/{project_name}/` フォルダを作成した
- [ ] `input.json` を作成した
- [ ] `slideTemplate` を指定した（または `slide.html` を用意した）
- [ ] 対応する `slide_{template}.html` と `slide_{template}.css` を作成した
- [ ] アニメーション対象のセクションに `step: true` を設定した

### よくあるエラーと対処法

| エラーメッセージ | 原因 | 対処法 |
|---|---|---|
| `✗ ERROR: Slide HTML file not found!` | スライドHTMLがない | `slide.html` を作成 |
| `✗ ERROR: Slide CSS file not found!` | スライドCSSがない | `slide.css` を作成 |
| スライドが表示されない | `step: true` がない | input.jsonに追加 |
| デザインが期待と違う | 間違ったテンプレート | `slideTemplate` を確認 |

### その他の注意点
1. **Marpは使用しない** - 画像出力ではなくHTML/CSSで直接レンダリング
2. **一枚スライド** - 複数ページではなく、情報を一枚にまとめる
3. **下部余白** - 字幕表示用に`padding-bottom: 150px`を確保
4. **アニメーション対応** - 各アイテムにIDを付与し、初期`opacity: 0`


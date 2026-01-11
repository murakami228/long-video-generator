# 動画制作ワークフロー (Production Workflow)

本プロジェクトにおける、原稿作成から動画書き出しまでの標準ワークフローです。
高品質な動画を安定して制作するため、以下の手順を遵守してください。

## 全体フロー
1. **Scripting** (原稿作成)
2. **Visual Design** (デザイン設計・実装)
3. **Validation** (品質チェック)
4. **Optimization** (データ統合・同期)
5. **Preview** (プレビュー確認)
6. **Render** (書き出し)

---

## 1. Scripting Phase (原稿作成)

まず、デザインを意識せずに「何を伝えるか」に集中して原稿を作成します。

### 1-1. `input.json` の作成
- `projects/<project_name>/input.json` を作成します。
- 長尺動画の場合は、管理しやすいように分割ファイル（`input_part1.json`など）での作成を推奨します。

### 1-2. 構成のルール
- **Introduction**: 3セクション程度
- **Body**: 6の倍数のセクション数（例: 6, 12, 18...）
- **Outro**: 3〜6セクション程度
- **Highlight**: 強調したい単語を `highlight` 配列に指定。

**Tip**: 詳細は `docs/script_generation_rules.md` を参照。

---

## 2. Visual Design Phase (デザインフェーズ)

原稿が固まったら、プロジェクトのテーマや内容に合わせてデザインを作成します。
**既存テンプレート (`01_std_list` 等) の安易な流用は禁止です。**
> [!WARNING]
> **Strict Rule: No Blind Copying**
> 既存の `slide_templates` をそのままコピーして使用することは**厳禁**です。
> 必ずプロジェクトの内容（Calculation, Timeline, Contrast等）に合わせて、HTML構造とCSSを**個別に修正・設計**してください。
> 手抜きをして標準テンプレートをそのまま適用した場合、その成果物は**拒否**されます。


### 2-1. コンセプト・配色の決定
- **テーマカラー**: メインカラー、サブカラー、アクセントカラー（強調色）を定義します。
    - 例: `Deep Navy` (メイン), `Royal Blue` (サブ), `Gold` (アクセント)
- **フォント**: 動画の雰囲気に適したフォントセットを選定します（Google Fonts推奨）。
    - 例: タイトル「Zen Kaku Gothic New」、本文「Noto Sans JP」


### 2-2. レイアウトパターンの選定 (CoT Recommendation)
スライドの品質を安定させるため、いきなりコードを書かず、**まず以下の「デザイン設計プロセス」を思考（出力）してください。**

1.  **各スライドの目的定義**: 「このスライドは何を伝えるものか？（比較？手順？警告？）」
2.  **パターンの決定**: `docs/slide_design_patterns.md` から最適なものを1つ選ぶ。
3.  **情報マッピング**: テキストデータをパターンのどのパーツ（Main Item, Sub Item, Badge etc.）に当てはめるか決める。

**例:**
> "Slide 3 is about cost breakdown. Pattern: Calculation. 'Building' -> Item 1, 'Vehicle' -> Item 2..."

| レイアウト名 | 適したコンテンツ | 特徴 |
| :--- | :--- | :--- |
| **Grid / List** | 並列の項目 (3〜4個) | 基本形。カードを均等に配置。 |
| **Calculation** | 費用内訳、合計 | `+` 記号や下線を使い、計算過程を可視化。 |
| **Timeline** | 手順、時系列、進化 | 矢印やステップ番号で「流れ」を強調。 |
| **Warning** | 禁止事項、リスク | 黒×赤・警戒色・斜体を使用し、危機感を演出。 |


### 2-3. 個別CSSの実装ルール (Technical)
- **ファイル分離**: 原則として `slide_1.css`, `slide_2.css` のようにスライド単位でCSSを作成します。
- **Scoped Variables**: 色やグラデーションは `:root` で定義し、再利用性を高めます。
- **Import Order**: フォントの `@import` は必ずファイルの**最上部**に記述してください（プレビュー生成時のエラー防止）。

```css
/* Good Example */
@import url('...'); /* Font */
@import url('...'); /* Icon */

:root { --primary: #0A244A; }
section.premium-slide { ... }
```

### 2-4. クオリティチェックリスト
実装後、以下の観点でセルフチェックを行ってください。
- [ ] **脱・デフォルト感**: 「パワポのデフォルトテンプレート」に見えないか？
- [ ] **情報の構造化**: 何が重要か（Highlight）が一目でわかるか？
- [ ] **余白の美学**: 詰め込みすぎていないか？ padding/gap は十分か？
- [ ] **動きの演出**: `animate-item` クラスなどで適切な出現アニメーションがあるか？

---

## 3. Validation Phase (バリデーション)

実装したファイルにミスがないか、ツールで自動チェックします。

### 3-1. バリデーション実行
```bash
npx tsx scripts/validate_input.ts <project_slug>
```
- **チェック項目**:
    - CSSファイルの存在
    - アイコンフォント定義 (`font-family`) の有無
    - テキストの文字数、禁則文字

---

## 4. Optimization Phase (データ統合・同期)

分割されたファイルの結合や、音声データの生成・同期を行います。

### 4-1. マージと音声生成
```bash
# 原稿が分割されている場合
npx tsx scripts/merge_scripts.ts <project_slug>

# 音声生成
npx tsx scripts/generate_audio_batch.ts <project_slug>
```

### 4-2. データ同期
```bash
npx tsx scripts/sync_audio.ts <project_slug>
```
- これにより、`input.json` と生成された音声ファイルの長さ情報が `data.json` に統合されます。

---

## 5. Preview Phase (プレビュー確認)

ブラウザ上で実際の動きやデザインを確認します。

### 5-1. プレビュー用HTML生成
```bash
npx tsx scripts/generate_html_previews.ts <project_slug>
```

### 5-2. ブラウザ確認 (Dashboard)
- 生成された `projects/<project_slug>/index.html` をブラウザで開きます。
- **Preview Modes**:
    1. **Static Slide Design (推奨)**:
       - スライドのデザイン、レイアウト、文字サイズを静止画として確認できます。
       - 「Back to Index」や「Next/Prev」ボタンで効率よく全スライドを巡回可能です。
    2. **Audio Scenes (Step-by-Step)**:
       - 音声とテロップのタイミング、要素が表示される順序を確認できます。

- **チェック項目**:
    - **デザイン**: テキストの改行位置、はみ出し、配色のバランス (`Static Mode` で確認)
    - **動き**: アニメーションのタイミング、音声との同期 (`Audio Mode` で確認)
    - **アイコン**: 意図した通りに表示されているか

---

## 6. Render Phase (書き出し)

全ての確認が完了したら、最終的な動画ファイルを出力します。

### 6-1. レンダリング実行
```bash
npx tsx scripts/render_batch.ts <project_slug>
```

### 6-2. 成果物の確認
- 出力先: `out/<project_slug>.mp4`
- 動画を再生し、音声と映像のズレやノイズがないか最終確認します。

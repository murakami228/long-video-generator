# Slide Design Patterns (Verified)

このドキュメントは、`unsou_permission_fund` プロジェクトで検証された、高品質なスライドデザインパターンをまとめたものです。
今後のスライド作成時は、単なるリスト形式（`01_std_list`）に逃げず、内容に応じて以下のパターンを積極的に使用してください。

## 1. Calculation Logic (計算・内訳)
**用途**: 費用内訳、合計金額、足し算のロジックを見せる場合。

### HTML Structure
```html
<div class="calc-container">
    <div class="calc-row">
        <div class="calc-label"><span class="icon">icon_name</span>項目名</div>
        <div class="calc-value">100<span>万円</span></div>
    </div>
    <div class="calc-op">+</div>
    <!-- ... repeat ... -->
    <div class="divider-line"></div>
    <div class="calc-total">
        <div class="total-label">合計</div>
        <div class="total-value">1,000<span>万円</span></div>
    </div>
</div>
```

### Key CSS Features
- `calc-row`: 背景色をつけてカード化、左側にアクセントカラーのボーダー(`border-left`)
- `calc-op`: 大きな「+」記号で演算を視覚化
- `calc-total`: 赤文字や大きなフォントでインパクトを出す

## 2. Timeline Process (時系列・流れ)
**用途**: 手順、期間、変化の流れ（過去→未来）を見せる場合。

### HTML Structure
```html
<div class="timeline-container">
    <div class="time-step">
        <div class="step-circle">1</div>
        <div class="step-content">
            <h3>Step Name</h3>
            <p>Description</p>
        </div>
    </div>
    <div class="arrow"></div>
    <!-- ... repeat ... -->
</div>
```

### Key CSS Features
- `step-circle`: 番号を丸で囲み、グラデーションで立体感を出す。コンテンツの上に少しはみ出させる(`margin-top: -60px`)とデザイン性が上がる。
- `arrow`: CSSのborder等で作った矢印をステップ間に配置。

## 3. Warning / Danger (警告・禁止事項)
**用途**: 「やってはいけないこと」「注意点」「リスク」を強調する場合。

### HTML Structure
```html
<section class="premium-slide warning-slide">
    <div class="danger-header">
        <span class="icon">warning</span>
        <h1>NG TITLE</h1>
    </div>
    <div class="main-warning">DO NOT DO THIS</div>
    <div class="consequence-box">
        <h3>Why?</h3>
        <ul>...</ul>
    </div>
</section>
```

### Key CSS Features
- **Color**: 黒背景(`black` or dark red)に赤文字(`red`)、黄色(`yellow`)の警告色。
- **Border**: 太い枠線や斜めのストライプ背景(`repeating-linear-gradient`)で「立入禁止」感を演出。
- **Transform**: テキストを少し傾ける(`rotate(-3deg)`)と不安感やインパクトが出る。

## 4. 3-Column Cards (並列・比較)
**用途**: 3つのポイント、メリット、要素を並列で紹介する場合。

### HTML Structure
```html
<div class="three-columns">
    <div class="column-card">
        <div class="icon">...</div>
        <h3>Title</h3>
        <div class="badge">Tag</div>
        <ul>...</ul>
    </div>
    <!-- ... repeat ... -->
</div>
```

### Key CSS Features
- `three-columns`: `display: flex; gap: 30px;` で均等配置。
- `column-card`: 枠線(`border`)と軽い背景色でエリアを区切る。
- `badge`: カプセル型のバッジで補足情報を目立たせる。

---

## 共通ルール (Common Rules)
1. **Google Fonts活用**: タイトルには `Zen Kaku Gothic New (900)`, 本文には `Noto Sans JP` を使用。
2. **Material Symbols**: アイコンは必ず正しいCSSクラス(`material-symbols-outlined`)で使用。
3. **Animation**: 各要素（`.calc-row`, `.time-step` 等）には `id="item-n"` を付与し、初期 `opacity: 0` にする（Remotion側で制御するため）。

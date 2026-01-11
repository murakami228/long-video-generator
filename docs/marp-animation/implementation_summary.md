# Marpスライド動的アニメーション実装まとめ

## 1. 概要
Remotion動画内でMarpのようなスライドを表示し、音声に合わせて要素を順次表示（ステップ表示）させる機能を実装しました。
スライド自体はHTMLとしてレンダリングされるため、クリアな画質を保ちつつ、CSSによるデザイン制御が可能です。

## 2. 実装されたファイル構成と役割

### コンポーネント
*   **`src/components/MarpReactSlide.tsx`**
    *   スライドを表示するReactコンポーネント。
    *   親から `htmlContent` (スライドのHTML文字列) と `steps` (表示タイミングのフレーム配列) を受け取ります。
    *   `useCurrentFrame` を使用して、現在のフレームに応じたCSSクラスやスタイルを適用し、要素の表示/非表示（opacity切り替え）を制御します。
    *   **現状の課題**: CSSがこのファイル内にハードコードされており、特定のデモ（Excelメリット）専用のスタイルになっています。

*   **`src/components/MarpExperiment.tsx`**
    *   動画全体の構成を定義するコンポーネント。
    *   `data.json` を読み込み、音声ファイル、スライド、テロップを配置します。
    *   シーンごとのフレーム数を計算し、スライドのステップ表示タイミングを動的に生成します。

*   **`src/components/OutlinedText.tsx`**
    *   テロップ用の袋文字コンポーネント。画面下部にオーバーレイ表示されます。

### データ管理
*   **`projects/[project_name]/slide.html`**
    *   スライドの中身（HTML形式）。ここに `<h1>` や `<div id="item-1">` などを記述します。
    *   各要素にはステップ表示制御用のID（`item-1`, `item-2`...）を付与します。

*   **`projects/[project_name]/input.json`**
    *   動画の構成情報（セリフ、スピーカー、タイプなど）を定義。
    *   `customScript.title` フィールドが動画のタイトルテロップとして使用されます。

### 処理スクリプト
*   **`scripts/sync_audio.ts`**
    *   プロジェクトフォルダ内の `input.json` とアセットを読み込み、Remotion用の `data.json` を生成するスクリプト。
    *   **新機能**: `slide.html` が存在する場合、その内容を読み込んで `data.json` の `slideHtml` プロパティに追加する処理を追加しました。

## 3. データフロー
1.  ユーザーが `projects/xxx/slide.html` と `input.json` を作成。
2.  `npx tsx scripts/sync_audio.ts xxx` を実行。
3.  `input.json` の情報と `slide.html` の中身が結合され、`data.json` が生成される。
4.  Remotion (`MarpExperiment`) が `data.json` を読み込む。
5.  動画レンダリング時、スライドHTMLが表示され、音声に合わせて要素が出現する。

## 4. デザインとスタイル
*   **フォント**: `src/index.css` にてGoogle Fonts (`Noto Sans JP`) を読み込み、プロジェクト全体で統一。
*   **テロップ**: 黒い縁取りの白文字で、画面下部に常時表示。
*   **レイアウト**: スライド下部に十分なパディング（余白）を設け、テロップとスライド内容が重ならないように調整済み。

## 5. 今後の課題とネクストステップ
1.  **CSSの汎用化**:
    *   現在は `MarpReactSlide.tsx` 内に特定のデザイン（カード型、バッジ色など）が直接書かれています。
    *   他のスライド（箇条書きリスト、左右レイアウトなど）にも対応できるよう、CSSを外部ファイル（例: `slide.css`）に切り出し、クラス名を汎用化する必要があります。
    
2.  **Markdown対応の自動化**:
    *   現在は手動で `slide.html` を書いていますが、本来はMarp Markdown (`slide.md`) から自動変換してHTMLを生成するのが理想です。
    *   `generate_slides.ts` を拡張し、Markdown -> HTML変換処理を組み込む必要があります。

3.  **文字サイズ調整**:
    *   汎用CSS作成時に、ベースとなるフォントサイズや見出しサイズを調整しやすいように設計します。

# 実装計画: FXの危険性スライド動画制作

FX取引の危険性（レバレッジ、強制ロスカット、スリッページ等）を解説するスライド動画を制作します。

## 構成案

- **タイトル**: FX取引の潜む罠
- **スライドテンプレート**: `01_std_list` (リスト形式)
- **解説項目**:
    1. ハイ・レバレッジの恐怖
    2. 強制ロスカットの仕組み
    3. 急変動時のスリッページ
    4. 感情トレードの罠

## 提案される変更

### [Component Name]

#### [NEW] [input.json](file:///Users/murakamikei/projects/long-video-generator/projects/fx_danger/input.json)
- 動画の構成、台本、スライド項目の定義。

#### [NEW] [slide.html](file:///Users/murakamikei/projects/long-video-generator/projects/fx_danger/slide.html)
- `01_std_list` をベースに、4つの項目を表示するように調整。
- 絵文字の代わりに Material Symbols を使用。

#### [NEW] [slide.css](file:///Users/murakamikei/projects/long-video-generator/projects/fx_danger/slide.css)
- `01_std_list.css` をベースにスタイルを適用。

## 検証計画

### 自動テスト
- `npx tsx scripts/validate_input.ts fx_danger` で `input.json` の整合性チェック。

### 手動検証
- `npx tsx scripts/sync_audio.ts fx_danger` を実行し、Remotion Studio (`http://localhost:3000`) でプレビューを確認。

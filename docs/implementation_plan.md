# テロップルール追加と強調表示機能の実装計画

## 概要
ユーザーからのリクエストに基づき、テロップ（字幕）に関する以下のルールを追加・実装します。
1. **文字数制限**: テロップは1行以内（約35文字目安）に収める。
2. **強調表示**: 重要な単語を強調（色付け）する。

これに伴い、`input.json` の `highlight` フィールドを実際に画面に反映させるため、Remotionコンポーネントの修正も行います。

## User Review Required
- 特になし（ユーザーリクエストに基づく改善）

## Proposed Changes

### Documentation
#### [NEW] [docs/script_generation_rules.md](file:///Users/murakamikei/Desktop/AIG検証/ショート動画自動生成/long-video-generator/docs/script_generation_rules.md)
以下のルールを定義した新規ドキュメントを作成します。
- **テロップの長さ**: 最大35文字程度（1行に収まる長さ）。
- **強調表示**: `highlight` フィールドに重要単語のリストを指定することで、黄色で強調表示される。

### Remotion Components
#### [MODIFY] [src/components/MarpExperiment.tsx](file:///Users/murakamikei/Desktop/AIG検証/ショート動画自動生成/long-video-generator/src/components/MarpExperiment.tsx)
- `data.scenes` から `highlight` 配列を受け取り、`OutlinedText` コンポーネントの `highlightKeywords` プロパティに渡すように修正します。

```tsx
<OutlinedText
    text={scene.text}
    // ...
    highlightKeywords={scene.highlight} // 追加
/>
```

### Scripts
#### [MODIFY] [scripts/validate_input.ts](file:///Users/murakamikei/Desktop/AIG検証/ショート動画自動生成/long-video-generator/scripts/validate_input.ts)
- `input.json` のバリデーションルールに、各セクションの `text` フィールドの文字数チェックを追加します。
- 35文字を超える場合、警告（Warning）を出力します（エラーにするかどうかは既存実装に合わせる）。

#### [MODIFY] [scripts/sync_audio.ts](file:///Users/murakamikei/Desktop/AIG検証/ショート動画自動生成/long-video-generator/scripts/sync_audio.ts)
- 処理開始時に `validate_input.ts` の機能を呼び出すか、統合することを検討（今回は `validate_input.ts` の修正のみで対応し、手動実行またはパイプライン組み込みを想定）。

## Mass Production Plan (10 Projects)

User has requested 10 videos with different patterns.

### Topics & Templates Mapping
1.  **11_excel_shortcuts**
    *   **Topic**: Job Efficiency (Excel)
    *   **Template**: `grid_blue` (Standard Grid)
    *   **Structure**: 3 Key Shortcuts
2.  **12_ai_tools_2026**
    *   **Topic**: Latest Tech
    *   **Template**: `grid_cyber` (Dark, Neon, Grid)
    *   **Structure**: 3 Top AI Tools
3.  **13_remote_work_pros_cons**
    *   **Topic**: Work Style
    *   **Template**: `split_minimal` (White/Clean, Left: Pros, Right: Cons)
    *   **Structure**: Comparison
4.  **14_side_hustle_steps**
    *   **Topic**: Career
    *   **Template**: `step_flow` (Vertical timeline/arrows)
    *   **Structure**: Step 1 -> Step 2 -> Step 3
5.  **15_python_list_comprehension**
    *   **Topic**: Programming
    *   **Template**: `code_dark` (Monospace, dark bg, syntax highlight look)
    *   **Structure**: Before (Loop) vs After (List Comp)
6.  **16_pareto_principle**
    *   **Topic**: Mental Model
    *   **Template**: `big_impact` (Huge text, bold colors)
    *   **Structure**: 80 vs 20 Visual
7.  **17_essentialism_book**
    *   **Topic**: Book Review
    *   **Template**: `book_summary` (Serif font, paper texture feel)
    *   **Structure**: 3 Core Lessons
8.  **18_morning_routine**
    *   **Topic**: Lifestyle
    *   **Template**: `list_pop` (Orange/Yellow, bouncy feel)
    *   **Structure**: 5 Habits list
9.  **19_security_mistakes**
    *   **Topic**: Security Awareness
    *   **Template**: `warning_alert` (Red/Black diagonal stripes)
    *   **Structure**: 3 Bad Habits
10. **20_ios_vs_android**
    *   **Topic**: Tech Debate
    *   **Template**: `split_dark` (Dark mode comparison)
    *   **Structure**: Left: iOS, Right: Android

## Verification Plan

### Manual Verification
1. Run `./scripts/auto_all.sh 11 12 13 14 15 16 17 18 19 20`
2. Check `out/` folder for 10 generated MP4 files.
3. Verify visual variety (designs should look distinct).


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

## Verification Plan

### Automated Tests
- なし

### Manual Verification
1. **コード修正後**: `sync_audio.ts` を実行。
2. **動作確認**: わざと長いテキストを含む `input.json` を用意し、コンソールに警告が出ることを確認する。
3. **動画確認**: `MarpExperiment` のハイライト機能が動作することを確認（プレビューまたはレンダリング）。

# Marpスライド動画生成 - タスク管理

## 完了タスク ✅

### Phase 1: 基盤構築
- [x] `MarpReactSlide` コンポーネントの作成
- [x] `MarpExperiment` コンポジションの作成
- [x] HTMLコンテンツの動的読み込み
- [x] CSSの動的読み込み（customCss）
- [x] ステップ表示機能（opacity制御）

### Phase 2: テンプレート機能
- [x] `slideTemplate` によるテンプレート切り替え
- [x] Splitレイアウト（左右分割）の実装
- [x] Gridレイアウト（グリッド配置）の実装
- [x] `sync_audio.ts` のテンプレート対応

### Phase 3: 動画時間の動的計算
- [x] `Root.tsx` の `durationInFrames` を動的化
- [x] `data.json` から自動的に動画長を取得

### Phase 4: 検証
- [x] `excel_vlookup_demo` プロジェクトで検証
- [x] `white_number_dump` プロジェクトで検証
- [x] `unkou_kanri_kiroku` プロジェクトで検証

## 今後の改善候補 📋

### 短期
- [ ] さらに多くのレイアウトテンプレートの追加
- [ ] フォントサイズ調整用のCSS変数導入
- [ ] BGM対応

### 中期
- [ ] Marp Markdownからの自動HTML生成
- [ ] 画像アセットの自動配置
- [ ] キャラクター画像の表示

### 長期
- [ ] テンプレートのGUIエディタ
- [ ] AIによる台本からスライド自動生成

## 作成済みプロジェクト

| プロジェクト | テンプレート | 出力ファイル |
|---|---|---|
| excel_vlookup_demo | split/grid | excel_vlookup_split.mp4, excel_vlookup_grid.mp4 |
| white_number_dump | split | white_number_dump.mp4 |
| unkou_kanri_kiroku | grid | unkou_kanri_kiroku.mp4 |

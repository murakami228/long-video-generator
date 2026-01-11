# HTML Slide Video Generator

HTMLとCSSで作成したスライドを、Remotionを使ってショート動画（縦型）に変換するツールです。

## 特徴
- **HTML/CSSでデザイン**: 使い慣れたWeb技術でスライドをデザインできます。
- **自動音声同期**: `input.json` に記述した台本からAI音声（VoiceVox）を生成し、スライドの表示タイミングを自動で合わせます。
- **ステップアニメーション**: スライド内の箇条書きなどを、台本の進行に合わせて順番に表示できます。

## 使い方

1. **プロジェクト作成**
   `projects/` フォルダ内に新しいフォルダを作成します。（例: `projects/01_my_slide`）

2. **必須ファイルの配置**
   作成したフォルダに以下の3つのファイルを配置します。
   - `input.json`: 台本と設定
   - `slide_default.html`: スライドのHTML構造
   - `slide_default.css`: スライドのスタイル
   
   ※ `projects/00_example_slide` をコピーして使うと便利です。

3. **動画生成**
   以下のコマンドを実行します。
   ```bash
   ./scripts/auto_all.sh 01
   ```
   （`01` はプロジェクトフォルダ名の一部）

4. **出力確認**
   `out/01_my_slide.mp4` に動画が出力されます。

## input.json の書き方

```json
{
    "project_name": "プロジェクト名",
    "theme": "テーマ",
    "platform": "YouTube Shorts",
    "customScript": {
        "title": "タイトル",
        "title_speech": "読み上げ用タイトル",
        "slideTemplate": "default",
        "sections": [
            {
                "id": "intro",
                "text": "冒頭の挨拶など",
                "speaker": "zundamon",
                "type": "intro"
            },
            {
                "id": "step1",
                "text": "1つ目のポイント",
                "speaker": "zundamon",
                "type": "content",
                "step": true  // trueにするとスライドの次の項目が表示されます
            }
        ]
    }
}
```

## ドキュメント
詳細は `docs/` フォルダ内のドキュメントを参照してください。
- `docs/slide_creation_rules.md`: スライド（HTML/CSS）の作成ルール
- `docs/script_generation_rules.md`: input.json の作成ルール

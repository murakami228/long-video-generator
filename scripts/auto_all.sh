#!/bin/bash

# scripts/auto_all.sh
# 画像生成 -> 音声生成 -> 同期 -> 出力 を一括で行うマスタースクリプト

# 引数がない場合は "all" をデフォルトにする
PROJECTS=${@:-"all"}

echo "==========================================="
echo "   🚀 Shorts Video Full Auto Pipeline"
echo "==========================================="

# 1. 環境チェック
echo "🔍 実行環境をチェックしています..."

# VOICEVOXチェック
if ! curl -s http://localhost:50021/version > /dev/null; then
    echo "❌ エラー: VOICEVOX が起動していません。"
    echo "音声生成を行うには、VOICEVOX アプリを立ち上げてください。"
    exit 1
fi

# Python venvチェック
if [ ! -d "./venv" ]; then
    echo "❌ エラー: Python仮想環境 (./venv) が見つかりません。"
    echo "画像生成には仮想環境が必要です。"
    exit 1
fi

# projects フォルダの存在チェック
PROJECTS_DIR="./projects"
if [ ! -d "$PROJECTS_DIR" ]; then
    echo "❌ エラー: projects フォルダが見つかりません。"
    exit 1
fi

# input.json の存在をざっくり確認
if [ "$PROJECTS" == "all" ]; then
    COUNT=$(find "$PROJECTS_DIR" -maxdepth 2 -name "input.json" | wc -l)
    if [ "$COUNT" -eq 0 ]; then
        echo "⚠️  警告: input.json を持つプロジェクトが見つかりません。"
        exit 0
    fi
    echo "📂 全 ${COUNT} プロジェクトを対象に開始します。"
else
    echo "📂 指定されたプロジェクト (${PROJECTS}) を対象に開始します。"
fi

# 2. 画像生成
echo ""
echo "🎨 [Step 1/4] 画像の一括生成を開始します..."
./venv/bin/python3 scripts/generate_images.py $PROJECTS

# 3. 音声生成 + ノーマライズ
echo ""
echo "🔊 [Step 2/4] 音声の一括生成とノーマライズを開始します..."
npx tsx scripts/generate_audio_batch.ts $PROJECTS

# 4. データ同期 (JSON作成)
echo ""
echo "🖇️  [Step 3/4] データの同期 (data.json作成) を開始します..."
npx tsx scripts/sync_audio.ts $PROJECTS

# 5. レンダリング + フォルダ移動
echo ""
echo "🎬 [Step 4/4] 動画の出力とフォルダ整理を開始します..."
npx tsx scripts/render_batch.ts $PROJECTS

echo ""
echo "==========================================="
echo "✅ すべての行程が完了しました！"
echo "作成された動画は 'out/' フォルダを、"
echo "完了したプロジェクトは 'completed_projects/' をご確認ください。"
echo "==========================================="

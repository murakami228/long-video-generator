#!/bin/bash

# Projects 01-07
PROJECTS=(
"01_集計作業が爆速に！条件付き計算3選"
"02_エクセルでデータ操作を自動化！動的配列関数3選"
"03_エクセルでVLOOKUPはもう古い？検索関数3選"
"04_エクセルで！文字入力の手間削減！文字列関数3選"
"05_エクセルで！複雑な判定を一発解決！条件分岐関数3選"
"06_エクセルで！納期のミスが消える！日付関数3選"
"07_エクセルで！汚い表が一瞬で綺麗に！データ整理関数3選"
)

BASE_DIR="/Users/murakamikei/Desktop/AIG検証/ショート動画自動生成/video-generator"
COMPLETED_DIR="$BASE_DIR/completed_projects"
PROJECTS_DIR="$BASE_DIR/projects"
OUT_DIR="$BASE_DIR/out"

cd "$BASE_DIR"

for proj in "${PROJECTS[@]}"; do
    echo "=================================================="
    echo "Processing: $proj"
    echo "=================================================="

    # 1. Move from completed_projects to projects
    if [ -d "$COMPLETED_DIR/$proj" ]; then
        echo "Moving $proj back to projects/..."
        mv "$COMPLETED_DIR/$proj" "$PROJECTS_DIR/"
    else
        echo "Warning: $proj not found in completed_projects. Checking projects/..."
        if [ ! -d "$PROJECTS_DIR/$proj" ]; then
            echo "Error: Project $proj not found anywhere. Skipping."
            continue
        fi
    fi

    # 2. Delete existing output
    if [ -f "$OUT_DIR/$proj.mp4" ]; then
        echo "Deleting existing video: $OUT_DIR/$proj.mp4"
        rm "$OUT_DIR/$proj.mp4"
    fi

    # 3. Normalize Audio
    echo "Normalizing Audio..."
    npx tsx scripts/normalize_audio.ts "$proj"

    # 4. Sync Audio (to update durations if needed)
    echo "Syncing Audio..."
    npx tsx scripts/sync_audio.ts "$proj"

    # 5. Render Video
    echo "Rendering Video..."
    npx tsx scripts/render.ts "$proj"

    # 6. Move back to completed_projects
    echo "Moving $proj back to completed_projects/..."
    mv "$PROJECTS_DIR/$proj" "$COMPLETED_DIR/"

    echo "Done with $proj"
    echo ""
done

echo "Batch reprocessing complete!"

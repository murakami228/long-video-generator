#!/usr/bin/env python3
"""
プロジェクトの画像を自動生成するスクリプト
SDXL-Turboを使用してinput.jsonのvisualプロンプトから画像を生成
"""

import json
import sys
import os
from pathlib import Path
import argparse
import torch
from diffusers import AutoPipelineForText2Image
from tqdm import tqdm

def load_input_json(project_path: Path) -> dict:
    """input.jsonを読み込む"""
    input_file = project_path / "input.json"
    if not input_file.exists():
        raise FileNotFoundError(f"input.json not found: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def setup_pipeline():
    """SDXL-Turboパイプラインをセットアップ"""
    print("モデルをロード中...")
    device = "cpu"  # MPSでは真っ黒な画像が生成されるためCPUを使用
    
    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float32
    )
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()
    
    return pipe, device

def generate_image(pipe, device: str, prompt: str, output_path: Path, steps: int = 2):
    """画像を生成して保存"""
    image = pipe(
        prompt=prompt,
        num_inference_steps=steps,
        guidance_scale=0.0,
        width=512,
        height=512
    ).images[0]
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)
    
    return output_path

def main():
    parser = argparse.ArgumentParser(description='プロジェクトの画像を自動生成')
    parser.add_argument('project_numbers', type=str, nargs='+', help='プロジェクト番号（例: 02 03）または "all"')
    parser.add_argument('--steps', type=int, default=2, help='生成ステップ数（デフォルト: 2）')
    parser.add_argument('--limit', type=int, default=None, help='生成する画像の最大数（テスト用）')
    parser.add_argument('--start-from', type=int, default=0, help='開始セクション番号（0から）')
    parser.add_argument('--force', action='store_true', help='既存の画像を上書きする')
    
    args = parser.parse_args()
    
    # プロジェクトパスを構築
    script_dir = Path(__file__).parent.parent
    projects_dir = script_dir / "projects"

    # プロジェクトリストの作成
    target_projects = []
    if 'all' in args.project_numbers:
        # すべてのプロジェクトフォルダを取得（数字で始まるもの）
        target_projects = sorted([p for p in projects_dir.iterdir() if p.is_dir() and p.name[0].isdigit()])
    else:
        for num in args.project_numbers:
            project_folders = list(projects_dir.glob(f"{num}_*"))
            if not project_folders:
                print(f"警告: プロジェクト {num} が見つかりません")
                continue
            target_projects.append(project_folders[0])

    if not target_projects:
        print("エラー: 処理対象のプロジェクトが見つかりません")
        sys.exit(1)

    print(f"処理対象プロジェクト数: {len(target_projects)}")
    
    # パイプラインをセットアップ（一度だけ実行）
    pipe, device = setup_pipeline()
    
    # 各プロジェクトを処理
    for project_path in target_projects:
        print(f"\n--- 処理中: {project_path.name} ---")
        
        # input.jsonを読み込む
        try:
            data = load_input_json(project_path)
            sections = data['customScript']['sections']
        except Exception as e:
            print(f"✗ エラー: {project_path.name} の読み込みに失敗: {e}")
            continue

        # 画像出力フォルダを作成
        images_dir = project_path / "images"
        images_dir.mkdir(exist_ok=True)
        
        # 生成する画像数を決定
        total_sections = len(sections)
        if args.limit:
            total_sections = min(total_sections, args.start_from + args.limit)
        
        print(f"生成する画像数: {max(0, total_sections - args.start_from)}/{len(sections)}")
        
        # タイトル画像を生成
        title_file = images_dir / "title.png"
        if not title_file.exists() or args.force:
            title_prompt = f"Professional title card for a video about: {data.get('topic', 'Excel Tutorial')}. High quality, 4k, clean typography style."
            try:
                generate_image(pipe, device, title_prompt, title_file, args.steps)
                print(f"✓ {project_path.name} タイトル画像生成完了")
            except Exception as e:
                print(f"✗ エラー: {project_path.name} タイトル画像の生成に失敗: {e}")

        # 各セクションの画像を生成
        for i in range(args.start_from, total_sections):
            section = sections[i]
            visual_prompt = section.get('visual', '')
            
            if not visual_prompt:
                print(f"警告: セクション {i} にvisualプロンプトがありません")
                continue
            
            # 出力ファイル名
            output_file = images_dir / f"section_{i:02d}.png"
            
            # 既に存在する場合はスキップ
            if output_file.exists() and not args.force:
                # ログを簡略化
                continue
            
            # 画像を生成
            try:
                generate_image(pipe, device, visual_prompt, output_file, args.steps)
                print(f"✓ {project_path.name} セクション {i:02d} 生成完了")
            except Exception as e:
                print(f"✗ エラー: {project_path.name} セクション {i} の生成に失敗: {e}")
                continue
    
    print(f"\nすべての処理が完了しました！")

if __name__ == "__main__":
    main()

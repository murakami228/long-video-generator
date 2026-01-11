import fs from 'fs';
import path from 'path';

/**
 * 複数の分割された台本ファイルを1つの input.json に統合するスクリプト
 * 長尺動画制作時の管理を容易にするために使用する
 */

interface Section {
    id: string;
    text: string;
    speechText: string;
    speaker: string;
    type: string;
    slideId?: string;
    step?: boolean;
    highlight?: string[];
}

interface Slide {
    id: string;
    html: string;
    css: string;
}

interface InputJson {
    project_name: string;
    theme: string;
    customScript: {
        title: string;
        title_speech?: string;
        title_split?: string[];
        slides?: Slide[];
        sections: Section[];
    };
}

const projectSlug = process.argv[2];
if (!projectSlug) {
    console.error("Please provide a project slug. Usage: npx tsx scripts/merge_scripts.ts <slug>");
    process.exit(1);
}

const projectDir = path.join(process.cwd(), 'projects', projectSlug);
if (!fs.existsSync(projectDir)) {
    console.error(`Project directory not found: ${projectDir}`);
    process.exit(1);
}

// 分割されたファイルを検索 (prefix: input_)
const files = fs.readdirSync(projectDir)
    .filter(f => f.startsWith('input_') && f.endsWith('.json'))
    .sort();

if (files.length === 0) {
    console.log("No partial input files (input_*.json) found. Looking for main input.json...");
    process.exit(0);
}

console.log(`Merging ${files.length} script parts for project: ${projectSlug}`);

let combinedSections: Section[] = [];
let combinedSlides: Slide[] = [];
let baseData: Partial<InputJson> = {};

files.forEach((file, index) => {
    const filePath = path.join(projectDir, file);
    const data: InputJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (index === 0) {
        // 最初の方から基本情報を取得
        baseData = {
            project_name: data.project_name,
            theme: data.theme,
            customScript: {
                title: data.customScript.title,
                title_speech: data.customScript.title_speech,
                title_split: data.customScript.title_split || [data.customScript.title],
                sections: []
            }
        };
    }

    // セクションを結合
    combinedSections = combinedSections.concat(data.customScript.sections);

    // スライド定義を結合 (重複排除)
    if (data.customScript.slides) {
        data.customScript.slides.forEach(newSlide => {
            if (!combinedSlides.find(s => s.id === newSlide.id)) {
                combinedSlides.push(newSlide);
            }
        });
    }
});

if (baseData.customScript) {
    baseData.customScript.sections = combinedSections;
    baseData.customScript.slides = combinedSlides;

    const outputPath = path.join(projectDir, 'input.json');
    fs.writeFileSync(outputPath, JSON.stringify(baseData, null, 2));
    console.log(`✅ Successfully merged scripts into ${outputPath}`);
}

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const projectSlug = process.argv[2];
if (!projectSlug) {
    console.error("Usage: npx tsx scripts/analyze_audio.ts <project_slug>");
    process.exit(1);
}

async function getLoudnessInfo(filePath: string) {
    const command = `ffmpeg -i "${filePath}" -af "loudnorm=I=-14:TP=-1:print_format=json" -f null - 2>&1`;
    try {
        const { stdout, stderr } = await execPromise(command);
        const output = stdout + stderr;

        // Find the start and end of the JSON block
        const startIdx = output.lastIndexOf('{');
        const endIdx = output.lastIndexOf('}');

        if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
            const jsonStr = output.substring(startIdx, endIdx + 1);
            try {
                return JSON.parse(jsonStr);
            } catch (err) {
                // console.error("Parse error", err);
            }
        }
    } catch (e) {
        // console.error(`  ✗ Error analyzing ${path.basename(filePath)}:`, e);
    }
    return null;
}

async function analyzeProject(projectSlug: string) {
    const projectsBaseDir = path.join(process.cwd(), 'projects');
    const completedBaseDir = path.join(process.cwd(), 'completed_projects');

    // Find project folder
    let targetProjectDir = '';
    const searchDirs = [projectsBaseDir, completedBaseDir];

    for (const baseDir of searchDirs) {
        if (!fs.existsSync(baseDir)) continue;
        if (fs.existsSync(path.join(baseDir, projectSlug))) {
            targetProjectDir = path.join(baseDir, projectSlug);
            break;
        } else {
            const folders = fs.readdirSync(baseDir).filter(f => f.startsWith(`${projectSlug}_`));
            if (folders.length > 0) {
                targetProjectDir = path.join(baseDir, folders[0]);
                break;
            }
        }
    }

    if (!targetProjectDir) {
        console.warn(`⚠️ Project not found: ${projectSlug}`);
        return;
    }

    console.log(`\n--- 分析中: ${path.basename(targetProjectDir)} ---`);
    const audioDir = path.join(targetProjectDir, 'assets', 'audio');

    if (!fs.existsSync(audioDir)) {
        console.error("✗ Audio directory not found");
        return;
    }

    const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    console.log(`🔍 Found ${files.length} files in ${audioDir}`);
    console.log(`| ファイル名 | 入力音量 (LUFS) | 目標偏差 (LU) | 真のピーク (dB) |`);
    console.log(`| :--- | :---: | :---: | :---: |`);

    for (const file of files) {
        const filePath = path.join(audioDir, file);
        try {
            const info = await getLoudnessInfo(filePath);
            if (info) {
                const inputI = info.input_i;
                const targetOffset = parseFloat(info.target_offset);
                const inputTp = info.input_tp;

                const status = (parseFloat(inputI) > -15.5 && parseFloat(inputI) < -12.5) ? "✅" : "⚠️";
                console.log(`| ${file} | ${inputI} ${status} | ${targetOffset >= 0 ? '+' : ''}${targetOffset} | ${inputTp} |`);
            } else {
                console.log(`| ${file} | 取得失敗 | - | - |`);
            }
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
}

analyzeProject(projectSlug);

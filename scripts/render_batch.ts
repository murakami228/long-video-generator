import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const projectSlugs = process.argv.slice(2);
if (projectSlugs.length === 0) {
    console.error("Please provide project slugs. Usage: npx tsx scripts/render_batch.ts <slug1> <slug2> ... or \"all\"");
    process.exit(1);
}

const BASE_DIR = process.cwd();
const PROJECTS_DIR = path.join(BASE_DIR, 'projects');
const COMPLETED_DIR = path.join(BASE_DIR, 'completed_projects');
const OUT_DIR = path.join(BASE_DIR, 'out');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(COMPLETED_DIR)) fs.mkdirSync(COMPLETED_DIR, { recursive: true });

async function processProject(projectSlug: string) {
    // Find project folder
    let targetProjectDir = '';
    if (fs.existsSync(path.join(PROJECTS_DIR, projectSlug))) {
        targetProjectDir = path.join(PROJECTS_DIR, projectSlug);
    } else {
        const folders = fs.readdirSync(PROJECTS_DIR).filter(f => f.startsWith(`${projectSlug}_`));
        if (folders.length > 0) {
            targetProjectDir = path.join(PROJECTS_DIR, folders[0]);
        }
    }

    if (!targetProjectDir) {
        console.warn(`  ⚠️ Project not found: ${projectSlug}`);
        return;
    }

    const currentProjectName = path.basename(targetProjectDir);
    console.log(`\n--- 処理中: ${currentProjectName} ---`);

    const dataFile = path.join(targetProjectDir, 'data.json');
    const outputFile = path.join(OUT_DIR, `${currentProjectName}.mp4`);

    if (!fs.existsSync(dataFile)) {
        console.error(`  ✗ data.json not found in ${currentProjectName}. Please run sync_audio first.`);
        return;
    }

    try {
        // 1. Update public/data.json (Remotion reads from here)
        console.log(`  Updating public/data.json...`);
        fs.copyFileSync(dataFile, path.join(BASE_DIR, 'public', 'data.json'));

        // 2. Render Video
        console.log(`  Rendering video to ${outputFile}...`);
        execSync(`npx remotion render MarpExperiment "${outputFile}"`, { stdio: 'inherit' });

        // 3. Move to completed_projects
        console.log(`  Moving project to completed_projects/...`);
        fs.renameSync(targetProjectDir, path.join(COMPLETED_DIR, currentProjectName));

        console.log(`  ✓ Done!`);
    } catch (e) {
        console.error(`  ✗ Failed to process ${currentProjectName}:`, e);
    }
}

async function main() {
    let slugsToProcess = projectSlugs;

    if (projectSlugs.includes('all')) {
        slugsToProcess = fs.readdirSync(PROJECTS_DIR)
            .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory() && /^\d+/.test(f));
    }

    console.log(`一括レンダリングを開始します。対象プロジェクト数: ${slugsToProcess.length}`);

    for (const slug of slugsToProcess) {
        await processProject(slug);
    }

    console.log("\nすべての処理が完了しました！");
}

main();

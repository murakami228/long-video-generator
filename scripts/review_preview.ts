
import { execSync } from 'child_process';
import * as readline from 'readline';
import fs from 'fs';
import path from 'path';

function findProjectDir(projectSlug: string): string {
    const projectsBaseDir = path.join(process.cwd(), 'projects');

    if (fs.existsSync(path.join(projectsBaseDir, projectSlug))) {
        return path.join(projectsBaseDir, projectSlug);
    }

    const folders = fs.readdirSync(projectsBaseDir).filter(f => f.startsWith(`${projectSlug}_`));
    if (folders.length > 0) {
        return path.join(projectsBaseDir, folders[0]);
    }

    throw new Error(`Project not found: ${projectSlug}`);
}

function generatePreviews(projectName: string): void {
    console.log('\n🎬 シーンプレビューを生成中 (using new generator)...\n');

    try {
        // Use the new script
        execSync(`npx tsx scripts/generate_html_previews.ts ${projectName}`, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
    } catch (error) {
        console.error('\n❌ プレビュー生成に失敗しました');
        throw error;
    }
}

function openBrowser(indexPath: string): void {
    console.log('\n🌐 ブラウザでプレビューを開いています...\n');

    try {
        execSync(`open "${indexPath}"`, { stdio: 'ignore' });
        console.log('✅ ブラウザで index.html を開きました\n');
    } catch (error) {
        console.error('⚠️ ブラウザを自動で開けませんでした');
        console.log(`手動で開いてください: ${indexPath}\n`);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: npx tsx scripts/review_preview.ts <project_name>');
        process.exit(1);
    }

    const projectName = args[0];

    console.log('\n🚀 Preview Review: ' + projectName);
    console.log('━'.repeat(60));

    try {
        const projectDir = findProjectDir(projectName);
        console.log(`📁 プロジェクト: ${path.basename(projectDir)}`);

        // Step 1: Generate previews
        generatePreviews(projectName);

        // Step 2: Open browser (opening scene_00 directly is often more useful)
        const scene0Path = path.join(projectDir, 'scenes', 'scene_00.html');
        // Check if index exists, else open scene 00
        const indexPath = path.join(projectDir, 'index.html');

        if (fs.existsSync(indexPath)) {
            openBrowser(indexPath);
        } else {
            openBrowser(scene0Path);
        }

        console.log('━'.repeat(60));
        console.log('✨ 完了しました!');
        console.log('  確認後、問題なければレンダリングに進んでください:');
        console.log(`  npm run video ${projectName}`);
        console.log('━'.repeat(60));
        console.log('');

    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error);
        process.exit(1);
    }
}

main();

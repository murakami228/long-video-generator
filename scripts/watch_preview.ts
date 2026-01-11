
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectSlug = process.argv[2];
if (!projectSlug) {
    console.error("Usage: npx tsx scripts/watch_preview.ts <project_slug>");
    process.exit(1);
}

const projectsDir = path.join(process.cwd(), 'projects');
const projectDir = path.join(projectsDir, projectSlug);

if (!fs.existsSync(projectDir)) {
    console.error(`Project not found: ${projectSlug}`);
    process.exit(1);
}

console.log(`👀 Watching for changes in ${projectSlug}...`);
console.log(`   (Edit input_*.json, *.html, or *.css to trigger update)`);

let debounceTimer: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 500;

function runUpdate(changedFile: string) {
    console.log(`\n🔄 Detect change: ${path.basename(changedFile)}`);
    const fileName = path.basename(changedFile);

    try {
        // 1. If input partials changed, merge them
        if (fileName.startsWith('input_') && fileName.endsWith('.json')) {
            console.log('   Merging scripts...');
            execSync(`npx tsx scripts/merge_scripts.ts ${projectSlug}`, { stdio: 'inherit' });
        }

        // Always sync data because HTML/CSS content needs embedding into data.json
        console.log('   Syncing data...');
        execSync(`npx tsx scripts/sync_audio.ts ${projectSlug}`, { stdio: 'inherit' });

        // Always regenerate previews
        console.log('   Updating preview HTMLs...');
        execSync(`npx tsx scripts/generate_html_previews.ts ${projectSlug}`, { stdio: 'inherit' });

        console.log('✅ Preview updated! Refresh your browser.');
    } catch (error) {
        console.error('❌ Update failed:', error);
    }
}

fs.watch(projectDir, { recursive: false }, (eventType, filename) => {
    if (!filename) return;
    if (filename.startsWith('.')) return; // ignore hidden
    if (filename === 'data.json') return; // ignore output
    if (filename.startsWith('scene_')) return; // ignore output
    if (fs.statSync(path.join(projectDir, filename)).isDirectory()) return; // ignore dirs

    // Debounce
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runUpdate(path.join(projectDir, filename)), DEBOUNCE_MS);
});

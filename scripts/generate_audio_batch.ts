import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const VOICEVOX_URL = 'http://localhost:50021';
const SPEAKER_ID = 1;
const SPEED_SCALE = 1.4;

const projectSlugs = process.argv.slice(2);
if (projectSlugs.length === 0) {
    console.error("Usage: npx tsx scripts/generate_audio_batch.ts <project_slug1> <project_slug2> ... or \"all\"");
    process.exit(1);
}

async function generateAudio(text: string, outputPath: string) {
    if (fs.existsSync(outputPath)) {
        // Skip if already exists
        return;
    }
    try {
        // 1. Audio Query
        const queryUrl = `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER_ID}`;
        const queryRes = await fetch(queryUrl, { method: 'POST' });
        if (!queryRes.ok) throw new Error(`Query failed: ${queryRes.statusText}`);

        const queryJson = await queryRes.json();

        // 2. Adjust Speed
        queryJson.speedScale = SPEED_SCALE;

        // 3. Synthesis
        const synthUrl = `${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}`;
        const synthRes = await fetch(synthUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryJson)
        });
        if (!synthRes.ok) throw new Error(`Synthesis failed: ${synthRes.statusText}`);

        const arrayBuffer = await synthRes.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
        console.log(`  ✓ Generated: ${path.basename(outputPath)} (${text.length} chars)`);

    } catch (e) {
        console.error(`  ✗ Error generating audio for "${text}":`, e);
    }
}

async function normalizeAudioFile(filePath: string) {
    const tempPath = filePath.replace('.mp3', '_temp.mp3');
    const fileName = path.basename(filePath);

    try {
        // Pass 1: Measure with pre-compression (speechnorm)
        // We use speechnorm to level the voice and avoid spiky peaks stopping loudnorm from boosting.
        const measureCmd = `ffmpeg -i "${filePath}" -af "speechnorm=e=4:p=0.9,loudnorm=I=-14:TP=-1:print_format=json" -f null - 2>&1`;
        const { stdout, stderr } = await execPromise(measureCmd);
        const output = stdout + stderr;

        const startIdx = output.lastIndexOf('{');
        const endIdx = output.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1) throw new Error("Could not parse measurement output");

        const stats = JSON.parse(output.substring(startIdx, endIdx + 1));

        // Pass 2: Apply with the same filter chain
        const applyCmd = `ffmpeg -i "${filePath}" -af "speechnorm=e=4:p=0.9,loudnorm=I=-14:TP=-1:measured_i=${stats.input_i}:measured_tp=${stats.input_tp}:measured_lra=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true" -ar 44100 -y "${tempPath}"`;
        await execPromise(applyCmd);

        fs.renameSync(tempPath, filePath);
        console.log(`  ✨ Normalized (Speech-Optimized): ${fileName} (${stats.input_i} -> -14.0)`);
    } catch (error) {
        console.error(`  ✗ Error normalizing ${fileName}:`, error);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

async function processProject(projectSlug: string) {
    const projectsBaseDir = path.join(process.cwd(), 'projects');

    // Find project folder
    let targetProjectDir = '';
    if (fs.existsSync(path.join(projectsBaseDir, projectSlug))) {
        targetProjectDir = path.join(projectsBaseDir, projectSlug);
    } else {
        const folders = fs.readdirSync(projectsBaseDir).filter(f => f.startsWith(`${projectSlug}_`));
        if (folders.length > 0) {
            targetProjectDir = path.join(projectsBaseDir, folders[0]);
        }
    }

    if (!targetProjectDir) {
        console.warn(`  ⚠️ Project not found: ${projectSlug}`);
        return;
    }

    console.log(`\n--- 処理中: ${path.basename(targetProjectDir)} ---`);
    const audioDir = path.join(targetProjectDir, 'assets', 'audio');
    const inputFile = path.join(targetProjectDir, 'input.json');

    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    if (!fs.existsSync(inputFile)) {
        console.error("  ✗ Input file not found:", inputFile);
        return;
    }

    const inputData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    const script = inputData.customScript;

    // Title
    const titleText = script.title_speech || script.title_split.join(" ");
    const titlePath = path.join(audioDir, 'title.mp3');
    if (!fs.existsSync(titlePath)) {
        console.log(`  Processing Title...`);
        await generateAudio(titleText, titlePath);
    }

    // Sections
    if (script.sections) {
        for (let i = 0; i < script.sections.length; i++) {
            const section = script.sections[i];
            const text = section.speechText || section.text;
            const sectionPath = path.join(audioDir, `${i}.mp3`);

            if (!fs.existsSync(sectionPath)) {
                console.log(`  Processing Section ${i}...`);
                await generateAudio(text, sectionPath);
                // Respect API rate limits gently
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    // --- Normalize all files in this project ---
    console.log(`  Normalizing all audio files in ${path.basename(targetProjectDir)}...`);
    const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') && !f.includes('_temp'));
    for (const file of files) {
        await normalizeAudioFile(path.join(audioDir, file));
    }
}

async function main() {
    let slugsToProcess = projectSlugs;
    const projectsBaseDir = path.join(process.cwd(), 'projects');

    if (projectSlugs.includes('all')) {
        slugsToProcess = fs.readdirSync(projectsBaseDir)
            .filter(f => fs.statSync(path.join(projectsBaseDir, f)).isDirectory() && /^\d+/.test(f));
    }

    console.log(`一括音声生成を開始します。対象プロジェクト数: ${slugsToProcess.length}`);

    for (const slug of slugsToProcess) {
        await processProject(slug);
    }

    console.log("\nすべての処理が完了しました！");
}

main();

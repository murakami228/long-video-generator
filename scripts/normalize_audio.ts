
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

async function normalizeAudioFile(filePath: string) {
    const tempPath = filePath.replace('.mp3', '_temp.mp3');
    const fileName = path.basename(filePath);

    try {
        // Pass 1: Measure with pre-compression (speechnorm)
        const measureCmd = `ffmpeg -i "${filePath}" -af "speechnorm=e=4:p=0.9,loudnorm=I=-14:TP=-1:print_format=json" -f null - 2>&1`;
        const { stdout, stderr } = await execPromise(measureCmd);
        const output = stdout + stderr;

        const startIdx = output.lastIndexOf('{');
        const endIdx = output.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1) throw new Error("Could not parse measurement output");

        const stats = JSON.parse(output.substring(startIdx, endIdx + 1));

        // Pass 2: Apply
        const applyCmd = `ffmpeg -i "${filePath}" -af "speechnorm=e=4:p=0.9,loudnorm=I=-14:TP=-1:measured_i=${stats.input_i}:measured_tp=${stats.input_tp}:measured_lra=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true" -ar 44100 -y "${tempPath}"`;
        await execPromise(applyCmd);

        fs.renameSync(tempPath, filePath);
        console.log(`  ✨ Normalized: ${fileName} (${stats.input_i} -> -14.0)`);
    } catch (error) {
        console.error(`  ✗ Error normalizing ${fileName}:`, error);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

async function normalizeAudio(projectDir: string) {
    const projectsBaseDir = path.join(process.cwd(), 'projects');
    const completedBaseDir = path.join(process.cwd(), 'completed_projects');

    // Find project folder
    let targetProjectDir = '';
    const searchDirs = [projectsBaseDir, completedBaseDir];

    for (const baseDir of searchDirs) {
        if (!fs.existsSync(baseDir)) continue;
        if (fs.existsSync(path.join(baseDir, projectDir))) {
            targetProjectDir = path.join(baseDir, projectDir);
            break;
        } else {
            const folders = fs.readdirSync(baseDir).filter(f => f.startsWith(`${projectDir}_`));
            if (folders.length > 0) {
                targetProjectDir = path.join(baseDir, folders[0]);
                break;
            }
        }
    }

    if (!targetProjectDir) {
        console.error(`Project directory not found: ${projectDir}`);
        process.exit(1);
    }

    const audioDir = path.join(targetProjectDir, 'assets', 'audio');

    if (!fs.existsSync(audioDir)) {
        console.error(`Audio directory not found: ${audioDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
    console.log(`Found ${files.length} audio files to normalize in ${path.basename(targetProjectDir)}`);

    for (const file of files) {
        await normalizeAudioFile(path.join(audioDir, file));
    }
    console.log('Audio normalization complete!');
}

const projectName = process.argv[2];
if (!projectName) {
    console.error('Please provide a project name.');
    process.exit(1);
}

normalizeAudio(projectName);

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectSlugs = process.argv.slice(2);
if (projectSlugs.length === 0) {
    console.error("Please provide project slugs. Usage: npx tsx scripts/sync_audio.ts <slug1> <slug2> ... or \"all\"");
    process.exit(1);
}

function getAudioDuration(filePath: string): number {
    try {
        const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
        const output = execSync(cmd).toString().trim();
        return parseFloat(output);
    } catch (e) {
        console.error(`  ✗ Error getting duration for ${filePath}:`, e);
        return 5; // Fallback default
    }
}

async function processProject(projectSlug: string, isLast: boolean, projectsBaseDir: string): Promise<void> {
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

    const currentProjectName = path.basename(targetProjectDir);
    console.log(`\n--- 処理中: ${currentProjectName} ---`);

    const assetsDir = path.join(targetProjectDir, 'assets');
    const audioDir = path.join(assetsDir, 'audio');
    const inputFile = path.join(targetProjectDir, 'input.json');
    const outputFile = path.join(targetProjectDir, 'data.json');

    // Public assets path for serving
    const publicAssetsDir = path.join(process.cwd(), 'public', 'generated_assets', currentProjectName);
    if (!fs.existsSync(publicAssetsDir)) fs.mkdirSync(publicAssetsDir, { recursive: true });

    if (!fs.existsSync(inputFile)) {
        console.error("  ✗ Input file not found");
        return;
    }

    const inputData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    const scriptData = inputData.customScript;

    const fps = 30;

    // --- Slide Handling Prep ---
    const slideCache: Record<string, { html: string, css: string }> = {};
    if (scriptData.slides && Array.isArray(scriptData.slides)) {
        console.log(`  ℹ Found ${scriptData.slides.length} slide definitions. Loading...`);
        for (const s of scriptData.slides) {
            const hPath = path.join(targetProjectDir, s.html);
            const cPath = path.join(targetProjectDir, s.css);
            if (fs.existsSync(hPath) && fs.existsSync(cPath)) {
                slideCache[s.id] = {
                    html: fs.readFileSync(hPath, 'utf-8'),
                    css: fs.readFileSync(cPath, 'utf-8')
                };
                console.log(`    ✓ Loaded slide: ${s.id} (${s.html})`);
            } else {
                console.warn(`    ⚠️ Slide files not found for ID ${s.id}: ${s.html} or ${s.css}`);
            }
        }
    }

    let defaultSlide = undefined;
    if (!scriptData.slides) {
        const templateName = scriptData.slideTemplate;
        const htmlFilename = templateName ? `slide_${templateName}.html` : 'slide.html';
        const cssFilename = templateName ? `slide_${templateName}.css` : 'slide.css';
        const slideHtmlPath = path.join(targetProjectDir, htmlFilename);
        const slideCssPath = path.join(targetProjectDir, cssFilename);

        if (fs.existsSync(slideHtmlPath) && fs.existsSync(slideCssPath)) {
            defaultSlide = {
                html: fs.readFileSync(slideHtmlPath, 'utf-8'),
                css: fs.readFileSync(slideCssPath, 'utf-8')
            };
            console.log(`  ℹ Using default slide template: ${htmlFilename}`);
        }
    }

    const scenes = [];
    const captions = [];
    let currentMs = 0;
    let slideStepCounter: Record<string, number> = {};

    // 1. Process Title
    const titleAudioName = "title.mp3";
    const titleAudioPath = path.join(audioDir, titleAudioName);
    let titleDuration = 5;

    if (fs.existsSync(titleAudioPath)) {
        titleDuration = getAudioDuration(titleAudioPath);
        fs.copyFileSync(titleAudioPath, path.join(publicAssetsDir, titleAudioName));
    }

    const titleDurationFrames = Math.ceil(titleDuration * fps) + 15;
    const titleDurationMs = Math.ceil((titleDurationFrames / fps) * 1000);

    const titleImageName = "title.png";
    const possibleTitleDirs = [assetsDir, path.join(targetProjectDir, 'images')];
    let titleImageUrl = `https://placehold.co/1080x1920/007ACC/FFFFFF/png?text=Title`;

    for (const dir of possibleTitleDirs) {
        const fullPath = path.join(dir, titleImageName);
        if (fs.existsSync(fullPath)) {
            fs.copyFileSync(fullPath, path.join(publicAssetsDir, titleImageName));
            titleImageUrl = `/generated_assets/${currentProjectName}/${titleImageName}`;
            break;
        }
    }

    scenes.push({
        text: scriptData.title || "Title",
        imageUrl: titleImageUrl,
        durationInFrames: titleDurationFrames,
        audioUrl: `/generated_assets/${currentProjectName}/${titleAudioName}`,
        highlight: []
    });

    currentMs += titleDurationMs;

    // 2. Process Sections
    for (let i = 0; i < scriptData.sections.length; i++) {
        const section = scriptData.sections[i];
        const audioName = `${i}.mp3`;
        const audioPath = path.join(audioDir, audioName);

        let duration = 5;
        if (fs.existsSync(audioPath)) {
            duration = getAudioDuration(audioPath);
            fs.copyFileSync(audioPath, path.join(publicAssetsDir, audioName));
        }

        const durationFrames = Math.ceil(duration * fps) + 10;
        const durationMs = Math.ceil((durationFrames / fps) * 1000);

        let imageUrl = '';
        if (section.type === 'slide') {
            const slideName = `slide_${i}.png`;
            if (fs.existsSync(path.join(publicAssetsDir, 'slides', slideName))) {
                imageUrl = `/generated_assets/${currentProjectName}/slides/${slideName}`;
            } else {
                imageUrl = `https://placehold.co/1920x1080/CCCCCC/666666/png?text=Slide+Missing`;
            }
        } else {
            // Pick an image
            const possibleNames = [`section_${String(i).padStart(2, '0')}.png`, `scene_${i}.png`];
            const possibleDirs = [assetsDir, path.join(targetProjectDir, 'images')];
            let foundImage = '';
            for (const name of possibleNames) {
                for (const dir of possibleDirs) {
                    const fullPath = path.join(dir, name);
                    if (fs.existsSync(fullPath)) {
                        fs.copyFileSync(fullPath, path.join(publicAssetsDir, name));
                        foundImage = name;
                        break;
                    }
                }
                if (foundImage) break;
            }

            if (foundImage) {
                imageUrl = `/generated_assets/${currentProjectName}/${foundImage}`;
            } else {
                imageUrl = `/generated_assets/${currentProjectName}/placeholder.png`;
            }
        }

        // Attach Multi-slide Data
        let currentSlideHtml = undefined;
        let currentCustomCss = undefined;
        let currentStepIndex = 0;

        if (section.slideId && slideCache[section.slideId]) {
            currentSlideHtml = slideCache[section.slideId].html;
            currentCustomCss = slideCache[section.slideId].css;

            const currentCount = slideStepCounter[section.slideId] || 0;
            if (section.step) {
                slideStepCounter[section.slideId] = currentCount + 1;
                currentStepIndex = slideStepCounter[section.slideId];
            } else {
                currentStepIndex = currentCount;
            }
        } else if (defaultSlide) {
            currentSlideHtml = defaultSlide.html;
            currentCustomCss = defaultSlide.css;

            const currentCount = slideStepCounter['default'] || 0;
            if (section.step) {
                slideStepCounter['default'] = currentCount + 1;
                currentStepIndex = slideStepCounter['default'];
            } else {
                currentStepIndex = currentCount;
            }
        }

        scenes.push({
            type: section.type || 'image',
            text: section.text,
            imageUrl: imageUrl,
            durationInFrames: durationFrames,
            audioUrl: `/generated_assets/${currentProjectName}/${audioName}`,
            highlight: section.highlight || [],
            step: section.step,
            slideHtml: currentSlideHtml,
            customCss: currentCustomCss,
            stepIndex: currentStepIndex,
            slideId: section.slideId
        });

        captions.push({
            text: section.text,
            startMs: currentMs,
            endMs: currentMs + durationMs
        });

        currentMs += durationMs;
    }

    const totalDurationFrames = Math.ceil((currentMs / 1000) * fps);

    // Metadata Assets (BGM, Character, BG)
    const getGlobalAsset = (dirName: string, fileName: string) => {
        const p = path.join(process.cwd(), 'assets', dirName, fileName);
        if (fs.existsSync(p)) {
            fs.copyFileSync(p, path.join(publicAssetsDir, fileName));
            return `/generated_assets/${currentProjectName}/${fileName}`;
        }
        return undefined;
    };

    // BGM
    let bgmUrl = undefined;
    const bgmDir = path.join(process.cwd(), 'assets', 'bgm');
    if (fs.existsSync(bgmDir)) {
        const bgmFiles = fs.readdirSync(bgmDir).filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));
        if (bgmFiles.length > 0) {
            const randomBgm = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
            fs.copyFileSync(path.join(bgmDir, randomBgm), path.join(publicAssetsDir, 'bgm' + path.extname(randomBgm)));
            bgmUrl = `/generated_assets/${currentProjectName}/bgm` + path.extname(randomBgm);
        }
    }

    const characterImageUrl = getGlobalAsset('', 'character.png');
    const backgroundImageUrl = getGlobalAsset('', 'background.png');

    // Calculate Global Slide Steps (For backward compatibility in components if needed)
    const slideSteps: number[] = [];
    let currentFrame = 0;
    scenes.forEach((scene, index) => {
        if (index > 0) { // Skip title
            const sectionIndex = index - 1;
            const section = scriptData.sections[sectionIndex];
            if (section && section.step) {
                slideSteps.push(currentFrame);
            }
        }
        currentFrame += scene.durationInFrames;
    });

    const finalData = {
        bgmUrl,
        scenes,
        captions,
        durationInFrames: totalDurationFrames,
        titleSplit: scriptData.title_split,
        backgroundImageUrl,
        characterImageUrl,
        slideHtml: defaultSlide?.html,
        customCss: defaultSlide?.css,
        slideSteps
    };

    fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
    if (isLast) fs.writeFileSync(path.join(process.cwd(), 'public', 'data.json'), JSON.stringify(finalData, null, 2));
    console.log(`  ✓ Saved: data.json`);
}

async function main() {
    const projectsBaseDir = path.join(process.cwd(), 'projects');
    const slugsToProcess = projectSlugs.includes('all')
        ? fs.readdirSync(projectsBaseDir).filter(f => fs.statSync(path.join(projectsBaseDir, f)).isDirectory() && /^\d+/.test(f))
        : projectSlugs;

    for (let i = 0; i < slugsToProcess.length; i++) {
        await processProject(slugsToProcess[i], i === slugsToProcess.length - 1, projectsBaseDir);
    }
}

main();

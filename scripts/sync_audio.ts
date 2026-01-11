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

    const scenes = [];
    const captions = [];
    let currentMs = 0;
    const fps = 30;

    // 1. Process Title
    const titleAudioName = "title.mp3";
    const titleAudioPath = path.join(audioDir, titleAudioName);
    let titleDuration = 5;

    if (fs.existsSync(titleAudioPath)) {
        titleDuration = getAudioDuration(titleAudioPath);
        fs.copyFileSync(titleAudioPath, path.join(publicAssetsDir, titleAudioName));
    } else {
        console.warn("  ⚠️ Title audio missing!");
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
        } else {
            console.warn(`  ⚠️ Audio missing for section ${i}`);
        }

        const durationFrames = Math.ceil(duration * fps) + 10;
        const durationMs = Math.ceil((durationFrames / fps) * 1000);

        let imageUrl = '';

        // Image Handling based on type
        if (section.type === 'slide') {
            // Check for generated slide image
            const slideName = `slide_${i}.png`;
            // const slidePath = path.join(publicAssetsDir, 'slides', slideName);
            // We assume generate_slides.ts has already run and placed files in public/generated_assets/.../slides/
            // But wait, generate_slides puts them in public/generated_assets/... directly? 
            // In generate_slides.ts I set it to: path.join(publicAssetsDir, projectName, 'slides');
            // So here we should look there.

            // publicAssetsDir here is `public/generated_assets/99_test_project`
            // So slide check should be:
            if (fs.existsSync(path.join(publicAssetsDir, 'slides', slideName))) {
                imageUrl = `/generated_assets/${currentProjectName}/slides/${slideName}`;
            } else {
                console.warn(`  ⚠️ Slide image missing: ${slideName}`);
                imageUrl = `https://placehold.co/1920x1080/CCCCCC/666666/png?text=Slide+Missing`;
            }
        } else {
            // Standard Image Handling
            const possibleNames = [
                `section_${String(i).padStart(2, '0')}.png`,
                `scene_${i}.png`
            ];
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
                if (section.type === 'intro' || section.type === 'outro') {
                    // Maybe defaults for intro/outro?
                    imageUrl = `https://placehold.co/1920x1080/007ACC/FFFFFF/png?text=${section.type}`;
                } else {
                    imageUrl = `/generated_assets/${currentProjectName}/placeholder.png`;
                }
            }
        }

        scenes.push({
            type: section.type || 'image', // Pass type to component
            text: section.text,
            imageUrl: imageUrl,
            durationInFrames: durationFrames,
            audioUrl: `/generated_assets/${currentProjectName}/${audioName}`,
            highlight: section.highlight || [],
            markdown: section.markdown, // Pass markdown if needed (though we use image)
            step: section.step // Pass step property for slide animation
        });

        captions.push({
            text: section.text,
            startMs: currentMs,
            endMs: currentMs + durationMs
        });

        currentMs += durationMs;
    }

    const totalDurationFrames = Math.ceil((currentMs / 1000) * fps);

    // BGM Handling
    const bgmDir = path.join(process.cwd(), 'assets', 'bgm');
    let bgmUrl = undefined;

    if (fs.existsSync(bgmDir)) {
        const bgmFiles = fs.readdirSync(bgmDir).filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));
        if (bgmFiles.length > 0) {
            const randomBgm = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
            const bgmPath = path.join(bgmDir, randomBgm);
            const targetBgmName = 'bgm' + path.extname(randomBgm);
            fs.copyFileSync(bgmPath, path.join(publicAssetsDir, targetBgmName));
            bgmUrl = `/generated_assets/${currentProjectName}/${targetBgmName}`;
        }
    }

    // Character Image (Fixed)
    let characterImageUrl = undefined;
    const charName = 'character.png';
    // Look in project assets first, then global assets
    const charPaths = [
        path.join(assetsDir, charName),
        path.join(process.cwd(), 'assets', charName)
    ];
    for (const p of charPaths) {
        if (fs.existsSync(p)) {
            fs.copyFileSync(p, path.join(publicAssetsDir, charName));
            characterImageUrl = `/generated_assets/${currentProjectName}/${charName}`;
            break;
        }
    }
    // Fallback if not found, use a placeholder or none
    if (!characterImageUrl) {
        // Option: Use a placeholder from placehold.co
        // characterImageUrl = `https://placehold.co/600x900/44AA44/FFFFFF/png?text=Zundamon`;
    }

    // Background Image (Fixed)
    let backgroundImageUrl = undefined;
    const bgName = 'background.png';
    const bgPaths = [
        path.join(assetsDir, bgName),
        path.join(process.cwd(), 'assets', bgName)
    ];
    for (const p of bgPaths) {
        if (fs.existsSync(p)) {
            fs.copyFileSync(p, path.join(publicAssetsDir, bgName));
            backgroundImageUrl = `/generated_assets/${currentProjectName}/${bgName}`;
            break;
        }
    }

    // Slide HTML & CSS Handling - Dynamic Template Support
    let slideHtml = undefined;
    const templateName = (scriptData && (scriptData as any).slideTemplate)
        ? (scriptData as any).slideTemplate
        : undefined;

    const htmlFilename = templateName ? `slide_${templateName}.html` : 'slide.html';
    const cssFilename = templateName ? `slide_${templateName}.css` : 'slide.css';

    console.log(`  ℹ Using slide template: ${templateName || 'default'} (${htmlFilename})`);

    const slideHtmlPath = path.join(targetProjectDir, htmlFilename);
    if (fs.existsSync(slideHtmlPath)) {
        slideHtml = fs.readFileSync(slideHtmlPath, 'utf-8');
        console.log(`  ✓ Loaded slide HTML: ${htmlFilename}`);
    } else {
        console.error(`  ✗ ERROR: Slide HTML file not found!`);
        console.error(`    Expected: ${slideHtmlPath}`);
        console.error(`    Hint: Create ${htmlFilename} in your project folder, or specify a valid slideTemplate in input.json`);
        console.error(`    Skipping this project...`);
        return; // Skip this project
    }

    let customCss = undefined;
    const slideCssPath = path.join(targetProjectDir, cssFilename);
    if (fs.existsSync(slideCssPath)) {
        customCss = fs.readFileSync(slideCssPath, 'utf-8');
        console.log(`  ✓ Loaded slide CSS: ${cssFilename}`);
    } else {
        console.error(`  ✗ ERROR: Slide CSS file not found!`);
        console.error(`    Expected: ${slideCssPath}`);
        console.error(`    Hint: Create ${cssFilename} in your project folder`);
        console.error(`    Skipping this project...`);
        return; // Skip this project
    }

    // Calculate Slide Steps based on 'step' property in input.json
    const slideSteps: number[] = [];
    // frameAccumulator was intended for reference but unused - removed to fix TS6133

    // Note: This loop was kept for reference but is unused - actual step calculation below
    for (let i = 0; i < scriptData.sections.length; i++) {
        // section iteration - actual processing done in scenes.forEach below
        // Note: The duration of THIS section contributes to the accumulation AFTER this check for the NEXT section
        // BUT we want the start time of THIS section if it's a step.

        // Wait, we need accurate start frames.
        // Let's recalculate start frames based on the scenes array we just built.
        // Or retrieve from captions startMs?
    }

    // Easier way: iterate scenes array which has accurate durationInFrames
    let currentFrame = 0;
    scenes.forEach((scene, index) => {
        // scene index 0 is title.
        // scenes array includes Title (index 0).
        // scriptData.sections[0] matches scenes[1] (Intro), etc.

        if (index === 0) {
            currentFrame += scene.durationInFrames;
            return;
        }

        const sectionIndex = index - 1;
        if (sectionIndex < scriptData.sections.length) {
            const section = scriptData.sections[sectionIndex];
            if (section.step) {
                slideSteps.push(currentFrame);
            }
        }
        currentFrame += scene.durationInFrames;
    });


    const finalData = {
        bgmUrl: bgmUrl,
        scenes: scenes,
        captions: captions,
        durationInFrames: totalDurationFrames,
        titleSplit: scriptData.title_split,
        backgroundImageUrl: backgroundImageUrl,
        characterImageUrl: characterImageUrl,
        slideHtml: slideHtml,
        customCss: customCss,
        slideSteps: slideSteps
    };

    fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
    console.log(`  ✓ Saved: data.json`);

    if (isLast) {
        fs.writeFileSync(path.join(process.cwd(), 'public', 'data.json'), JSON.stringify(finalData, null, 2));
        console.log(`  🚀 Updated public/data.json for preview`);
    }
}

async function main() {
    const projectsBaseDir = path.join(process.cwd(), 'projects');
    let slugsToProcess = projectSlugs;

    if (projectSlugs.includes('all')) {
        slugsToProcess = fs.readdirSync(projectsBaseDir)
            .filter(f => fs.statSync(path.join(projectsBaseDir, f)).isDirectory() && /^\d+/.test(f));
    }

    console.log(`データ同期を開始します。対象プロジェクト数: ${slugsToProcess.length}`);

    for (let i = 0; i < slugsToProcess.length; i++) {
        const isLast = i === slugsToProcess.length - 1;
        await processProject(slugsToProcess[i], isLast, projectsBaseDir);
    }

    console.log("\nすべての処理が完了しました！");

    // Automatically open preview (macOS)
    try {
        console.log("  🚀 Opening preview in browser...");
        execSync('open "http://localhost:3000/?composition=MarpExperiment"');
    } catch (e) {
        // Ignore errors if browser open fails
    }
}

main();

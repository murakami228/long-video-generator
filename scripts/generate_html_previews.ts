
import fs from 'fs';
import path from 'path';

const projectSlug = process.argv[2];
if (!projectSlug) {
    console.error("Usage: npx tsx scripts/generate_scene_previews.ts <project_slug>");
    process.exit(1);
}

const projectsDir = path.join(process.cwd(), 'projects');
const projectDir = path.join(projectsDir, projectSlug);

if (!fs.existsSync(projectDir)) {
    console.error(`Project not found: ${projectSlug}`);
    process.exit(1);
}

const dataPath = path.join(projectDir, 'data.json');
if (!fs.existsSync(dataPath)) {
    console.error(`data.json not found in ${projectSlug}. Run generate_audio_batch and sync_audio first.`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const scenes = data.scenes;
const scenesDir = path.join(projectDir, 'scenes');

if (!fs.existsSync(scenesDir)) {
    fs.mkdirSync(scenesDir, { recursive: true });
}

function generateSceneHtml(index: number, scene: any, totalScenes: number) {
    const slideId = `slide_${Math.floor(index / 6) + 1}`; // Approximation if not in scene, but scene has slideHtml
    const currentStep = scene.stepIndex || 0;

    // Fallback if slideHtml is not embedded in scene (though sync_audio puts it there)
    const slideHtml = scene.slideHtml || '<!-- No Slide Content -->';
    const customCss = scene.customCss || '';

    const prevLink = index > 0 ? `scene_${String(index - 1).padStart(2, '0')}.html` : '#';
    const nextLink = index < totalScenes - 1 ? `scene_${String(index + 1).padStart(2, '0')}.html` : '#';

    // Generate visibility CSS
    const visibilitySelectors = [];
    for (let i = 1; i <= currentStep; i++) {
        visibilitySelectors.push(`#item-${i}`);
    }
    const visibilityCss = visibilitySelectors.length > 0
        ? `${visibilitySelectors.join(', ')} { opacity: 1 !important; transform: none !important; }`
        : '';

    // Fix Audio Path for local preview (data.json has /generated_assets/... needs relative or absolute for local open)
    // Actually, simply pointing to the file in public is fine if serving, but for file:// protocol, we need relative path to assets.
    // scene file is in projects/<slug>/scenes/scene_XX.html
    // audio is in projects/<slug>/assets/audio/XX.mp3
    // url in data.json is /generated_assets/<slug>/XX.mp3 (which is mapped to public/generated_assets/<slug>)

    // We'll rely on relative path from scene file to project root.
    // ../assets/audio/

    const audioFileName = path.basename(scene.audioUrl);
    const relativeAudioPath = `../assets/audio/${audioFileName}`;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet">
    <title>Scene ${index}</title>
    <style>
        /* Base Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 1920px; height: 1080px; overflow: hidden; background: #2d3748; }
        
        /* Slide Styles Injection */
        ${customCss}

        /* Step Visibility */
        ${visibilityCss}

        /* Overlays */
        .caption-overlay {
            position: absolute;
            bottom: 40px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            z-index: 1000;
        }
        .caption-box {
            background: rgba(0, 0, 0, 0.7);
            padding: 16px 32px;
            border-radius: 12px;
        }
        .caption-text {
            font-size: 42px;
            font-weight: bold;
            color: white;
            font-family: "Noto Sans JP", sans-serif;
            text-shadow: 0px 4px 10px rgba(0,0,0,0.5);
            -webkit-text-stroke: 4px black;
            paint-order: stroke fill;
            -webkit-text-fill-color: white;
        }

        .scene-info {
            position: fixed;
            top: 0; left: 0; right: 0;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 9999;
            font-family: sans-serif;
        }
        .nav-link {
            color: white;
            text-decoration: none;
            padding: 5px 15px;
            background: #4299e1;
            border-radius: 5px;
            margin-left: 10px;
        }
        .play-btn {
            background: #48bb78;
            border: none;
            color: white;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="scene-info">
        <div>Scene ${index} / ${totalScenes} | Step: ${currentStep}</div>
        <div>
            <button id="playBtn" class="play-btn">▶ Play Audio</button>
            <a href="${prevLink}" class="nav-link">← Prev</a>
            <a href="${nextLink}" class="nav-link">Next →</a>
        </div>
    </div>

    <!-- Slide Content -->
    ${slideHtml}

    <!-- Caption -->
    <div class="caption-overlay">
        <div class="caption-box">
            <div class="caption-text">${scene.text}</div>
        </div>
    </div>

    <script>
        const audio = new Audio('${relativeAudioPath}');
        const btn = document.getElementById('playBtn');
        
        btn.onclick = () => {
            audio.play();
        };

        // Auto-play attempt (often blocked by browser policy without interaction, but worth a try)
        // audio.play().catch(e => console.log('Autoplay blocked'));

        // Keyboard Nav
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') window.location.href = '${nextLink}';
            if (e.key === 'ArrowLeft') window.location.href = '${prevLink}';
            if (e.key === ' ') audio.play();
        });
    </script>
</body>
</html>`;
}

// Generate Scenes
console.log(`Generatng ${scenes.length} scenes from data.json...`);
scenes.forEach((scene: any, idx: number) => {
    // skip title (scene 0 usually) logic if title is special, but here we treat all as scenes
    const html = generateSceneHtml(idx, scene, scenes.length);
    const fileName = `scene_${String(idx).padStart(2, '0')}.html`;
    fs.writeFileSync(path.join(scenesDir, fileName), html);
});

console.log('Scenes generated in', scenesDir);

// NEW: Generate Full Slide Previews (Static, all items visible)
// This allows verifying the "Design" without stepping through scenes
const uniqueSlides = new Set(scenes.map((s: any) => s.slideId));
const uniqueSlideList = Array.from(uniqueSlides).sort();
console.log(`Generating full previews for ${uniqueSlideList.length} unique slides...`);

uniqueSlideList.forEach((slideId: string, index: number) => {
    // Find the first scene that uses this slide to get the template content
    const representativeScene = scenes.find((s: any) => s.slideId === slideId);
    if (!representativeScene) return;

    const slideHtml = representativeScene.slideHtml || '<!-- No Content -->';
    const customCss = representativeScene.customCss || '';

    // Navigation Logic
    const prevSlide = index > 0 ? uniqueSlideList[index - 1] : null;
    const nextSlide = index < uniqueSlideList.length - 1 ? uniqueSlideList[index + 1] : null;

    const prevLink = prevSlide ? `<a href="${prevSlide}_preview.html" class="nav-btn prev-btn"><span class="material-icons">arrow_back_ios</span> ${prevSlide}</a>` : '';
    const nextLink = nextSlide ? `<a href="${nextSlide}_preview.html" class="nav-btn next-btn">${nextSlide} <span class="material-icons">arrow_forward_ios</span></a>` : '';

    // Force all item steps to be visible
    const forceVisibleCss = `
        [id^='item-'] { opacity: 1 !important; transform: none !important; }
        .danger-zone .main-warning { opacity: 1 !important; } /* Specific fix for warning slide */
        
        .nav-ui {
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            z-index: 9999;
            pointer-events: none; /* Let clicks pass through empty space */
        }
        .nav-group-left { display: flex; gap: 10px; pointer-events: auto; }
        .nav-group-right { display: flex; gap: 10px; pointer-events: auto; }

        .nav-btn {
            background: rgba(0,0,0,0.6);
            color: white;
            padding: 10px 16px;
            text-decoration: none;
            border-radius: 8px;
            font-family: sans-serif;
            font-weight: bold;
            border: 1px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            backdrop-filter: blur(4px);
        }
        .nav-btn:hover { background: rgba(0,0,0,0.9); border-color: rgba(255,255,255,0.6); transform: translateY(-2px); }
        .index-btn { background: rgba(30, 60, 90, 0.8); }
    `;

    const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet">
    <title>${slideId} Full Preview</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 1920px; height: 1080px; overflow: hidden; background: #2d3748; }
        /* Injected CSS */
        ${customCss}
        /* Force Visibility */
        ${forceVisibleCss}
    </style>
</head>
<body>
    <div class="nav-ui">
        <div class="nav-group-left">
            <a href="../index.html" class="nav-btn index-btn"><span class="material-icons">grid_view</span> Index</a>
            ${prevLink}
        </div>
        <div class="nav-group-right">
            ${nextLink}
        </div>
    </div>
    
    ${slideHtml}
    
    <script>
        // Keyboard Nav
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' && '${nextSlide}') window.location.href = '${nextSlide}_preview.html';
            if (e.key === 'ArrowLeft' && '${prevSlide}') window.location.href = '${prevSlide}_preview.html';
            if (e.key === 'Escape') window.location.href = '../index.html';
        });
    </script>
</body>
</html>`;

    // Save as slide_X_preview.html in scenes
    fs.writeFileSync(path.join(scenesDir, `${slideId}_preview.html`), fullHtml);
});


// Generate Index/Dashboard HTML
// uniqueSlideList is already defined above

const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Dashboard - ${projectSlug}</title>
    <style>
        body { font-family: sans-serif; background: #1a202c; color: white; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { border-bottom: 2px solid #4a5568; padding-bottom: 10px; margin-bottom: 30px; }
        h2 { color: #a0aec0; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #2d3748; padding-bottom: 10px; }
        
        .grid-layout { display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        
        .scene-item, .slide-item {
            background: #2d3748;
            padding: 15px;
            border-radius: 8px;
            text-decoration: none;
            color: white;
            transition: all 0.2s;
            display: block;
        }
        .scene-item:hover, .slide-item:hover { background: #4a5568; transform: translateY(-2px); }
        
        .scene-meta { font-size: 0.85em; color: #a0aec0; margin-top: 5px; }
        
        .flex-row { display: flex; justify-content: space-between; align-items: center; }
        
        .play-all { display: inline-block; margin-bottom: 20px; padding: 10px 20px; background: #48bb78; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .slide-badge { background: #4299e1; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; margin-bottom: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Project Preview: ${projectSlug}</h1>
        
        <h2>Static Slide Design Previews</h2>
        <div class="grid-layout">
            ${uniqueSlideList.map(slideId => `
                <a href="scenes/${slideId}_preview.html" class="slide-item">
                    <span class="slide-badge">Design</span>
                    <div style="font-size: 1.2em; font-weight: bold;">${slideId}</div>
                    <div class="scene-meta">Click to view full static design</div>
                </a>
            `).join('')}
        </div>

        <h2>Audio Scenes (Step-by-Step)</h2>
        <a href="scenes/scene_00.html" class="play-all">▶ Start Sequence</a>
        
        <div class="grid-layout">
            ${scenes.map((s: any, i: number) => `
                <a href="scenes/scene_${String(i).padStart(2, '0')}.html" class="scene-item">
                    <div class="flex-row">
                        <strong>Scene ${i}</strong>
                        <span style="background: #2b6cb0; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">Step ${s.stepIndex || 0}</span>
                    </div>
                    <div class="scene-meta">${s.slideId || 'No Slide'}</div>
                    <div style="font-size: 0.8em; color: #718096; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.text}</div>
                </a>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(projectDir, 'index.html'), indexHtml);
console.log('Dashboard generated: index.html');


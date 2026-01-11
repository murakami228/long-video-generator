
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Marp } from '@marp-team/marp-core';

// Ensure the script is called with a project slug
const projectSlugs = process.argv.slice(2);
if (projectSlugs.length === 0) {
    console.error("Usage: npx tsx scripts/generate_slides.ts <slug> [slug2 ...]");
    process.exit(1);
}

const projectsBaseDir = path.join(process.cwd(), 'projects');
const publicAssetsDir = path.join(process.cwd(), 'public', 'generated_assets');

async function processProject(slug: string) {
    console.log(`\nProcessing slides for: ${slug}`);

    // Locate project directory
    let projectDir = '';
    if (fs.existsSync(path.join(projectsBaseDir, slug))) {
        projectDir = path.join(projectsBaseDir, slug);
    } else {
        const dirs = fs.readdirSync(projectsBaseDir).filter(d => d.startsWith(slug + '_'));
        if (dirs.length > 0) projectDir = path.join(projectsBaseDir, dirs[0]);
    }

    if (!projectDir) {
        console.error(`Project not found: ${slug}`);
        return;
    }

    const inputPath = path.join(projectDir, 'input.json');
    if (!fs.existsSync(inputPath)) {
        console.error(`input.json not found in ${projectDir}`);
        return;
    }

    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const sections = inputData.customScript.sections;
    const projectName = path.basename(projectDir);
    const outputDir = path.join(publicAssetsDir, projectName, 'slides');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Default Marp theme config
    const theme = `
/* @theme long-video */
@import 'default';

section {
    width: 1920px;
    height: 1080px;
    font-size: 60px;
    background-color: white;
    padding: 80px;
    padding-right: 650px; /* Space for character overlay */
    justify-content: center;
}

h1 {
    font-size: 120px;
    color: #333;
}
`;

    // Initialize Marp (Core is used for some internal logic if needed, but we mostly use CLI for easy image output)
    // Actually, shelling out to marp-cli is often easier for file generation.
    // But let's verify we have the command.

    // We will generate a temporary markdown file for EACH slide section to render them individually using CLI
    // Or we can generate one big MD and render to images. Marp CLI renders "slide.md" -> "slide.png" (first page) or "slide.001.png" etc.

    let slideIndex = 0;

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        // Only process sections that are explicitly marked as 'slide' or imply it
        // For now, let's assume if it has 'markdown' field or type is 'slide'
        const isSlide = section.type === 'slide' || !!section.markdown;

        if (isSlide) {
            const markdownContent = section.markdown || `# ${section.text}`;

            // Construct full markdown with theme
            const fullMd = `---
theme: long-video
width: 1920px
height: 1080px
style: |
  ${theme}
---

${markdownContent}
`;

            const tempMdPath = path.join(outputDir, `temp_${i}.md`);
            fs.writeFileSync(tempMdPath, fullMd);

            const outputPngPath = path.join(outputDir, `slide_${i}.png`);

            try {
                // Run marp-cli
                // npx marp <input> -o <output> --allow-local-files
                execSync(`npx marp "${tempMdPath}" -o "${outputPngPath}" --allow-local-files`, { stdio: 'inherit' });
                console.log(`  ✓ Generated: slide_${i}.png`);

                // Cleanup temp
                fs.unlinkSync(tempMdPath);

                // Update the input.json (in memory for now, or sync script will handle mapping)
                // Actually, sync script logic should find these files. 
                // We don't update input.json here, just generate assets.

            } catch (e) {
                console.error(`  ✗ Failed to generate slide for section ${i}`, e);
            }
        }
    }
}

// Run
(async () => {
    for (const slug of projectSlugs) {
        await processProject(slug);
    }
})();

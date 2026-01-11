import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: npx tsx scripts/validate_input.ts <project_slug>');
    process.exit(1);
}

const projectSlug = args[0];
const SEARCH_DIRS = [
    path.join(process.cwd(), 'projects'),
    path.join(process.cwd(), 'completed_projects'),
    path.join(process.cwd(), 'uploaded_projects')
];

function findProjectDir(slug: string): string | null {
    for (const dir of SEARCH_DIRS) {
        const fullPath = path.join(dir, slug);
        if (fs.existsSync(fullPath)) return fullPath;
    }
    return null;
}

const projectDir = findProjectDir(projectSlug);
if (!projectDir) {
    console.error(`Project not found: ${projectSlug}`);
    process.exit(1);
}

const inputJsonPath = path.join(projectDir, 'input.json');
const inputData = JSON.parse(fs.readFileSync(inputJsonPath, 'utf-8'));

// ... existing code ...

const sections = inputData.customScript.sections;
const slides = inputData.slides || [];

console.log(`\n🔍 Validating project: ${projectSlug}\n`);

let hasError = false;

// --- CSS Validation ---
console.log('Validating CSS files...');
slides.forEach((slide: any, idx: number) => {
    if (!slide.css) return;

    // Resolve CSS path
    // CSS path in input.json is relative to the project directory (e.g. "slide_1.css" or "../../slide_templates/...")
    const cssPath = path.resolve(projectDir, slide.css);

    if (!fs.existsSync(cssPath)) {
        console.error(`❌ Slide ${slide.id}: CSS file not found at ${cssPath}`);
        hasError = true;
        return;
    }

    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Check 1: Material Symbols Font Family
    // If the CSS explicitly styles .material-symbols-outlined, it MUST define font-family.
    // We check this because just importing the font isn't enough; the class needs to use it.
    if (cssContent.includes('.material-symbols-outlined')) {
        // Simple check for the class definition block
        const match = cssContent.match(/\.material-symbols-outlined\s*{([^}]*)}/);
        if (match) {
            const body = match[1];
            if (!body.includes("font-family: 'Material Symbols Outlined'") && !body.includes('font-family: "Material Symbols Outlined"')) {
                console.error(`❌ Slide ${slide.id} (${slide.css}): .material-symbols-outlined class missing 'font-family'. Icons will not render.`);
                hasError = true;
            }
        }
    }
});
console.log('CSS validation complete.\n');

// --- Section Validation ---
sections.forEach((section: any, idx: number) => {
    // ... existing code ...
    const text = section.text || '';
    const lines = text.split('\n');

    // 0. Total Length Check (Warning for > 35 chars for single-line captions)
    if (text.replace(/\n/g, '').length > 35) {
        console.warn(`⚠️  Section ${idx}: Text length (${text.length}) exceeds 35 chars. Consider shortening.`);
    }

    // 1. Line Length Check (Relaxed to 35 chars for horizontal captions)
    lines.forEach((line: string, lineIdx: number) => {
        if (line.length > 35) {
            console.error(`❌ Section ${idx} [Line ${lineIdx + 1}]: Too long (${line.length} chars). Max 35 allowed.`);
            console.error(`   Content: "${line}"`);
            hasError = true;
        }
    });

    // 2. Prohibited Characters Check
    if (text.match(/[、。？?！!]/)) {
        console.error(`❌ Section ${idx}: Contains prohibited punctuation (、。？?！!).`);
        console.error(`   Content: "${text.replace(/\n/g, ' ')}"`);
        hasError = true;
    }

    // 3. Half-width Space Check (Lowered to Warning)
    if (text.includes(' ') || text.includes('　')) {
        console.warn(`⚠️  Section ${idx}: Contains spaces.`);
        // hasError = false; // No longer blocking
    }

    // 4. Alphabet Check (Lowered to Warning)
    if (text.match(/[a-zA-Z]/)) {
        console.warn(`⚠️  Section ${idx}: Contains alphabet characters. Consider using Katakana.`);
        // hasError = false;
    }

    // 5. Line break trailing particles (Optional but recommended)
    lines.forEach((line: string, lineIdx: number) => {
        if (lineIdx < lines.length - 1) {
            const particles = ['は', 'を', 'が', 'に', 'と', 'で', 'も', 'の', 'か'];
            const lastChar = line.slice(-1);
            if (!particles.includes(lastChar)) {
                // console.warn(`⚠️  Section ${idx} [Line ${lineIdx + 1}]: Line does not end with a particle. Current: "${lastChar}"`);
            }
        }
    });

    // 7. speechText Punctuation Check (New)
    const speechText = section.speechText || '';
    if (speechText) {
        const punctuationCount = (speechText.match(/[、。]/g) || []).length;
        if (punctuationCount >= 2) {
            console.warn(`⚠️  Section ${idx}: high punctuation count in speechText (${punctuationCount}). This may cause unnatural gaps.`);
        }
        if (speechText.match(/[、。]{2,}/)) {
            console.error(`❌ Section ${idx}: Consecutive punctuation in speechText. This causes long silence gaps.`);
            hasError = true;
        }
    }
});

// 6. Section Count Check (Relaxed for Long Videos)
const minSections = 3; // OP + at least 1 content + ED
if (sections.length < minSections) {
    console.error(`❌ Total sections (${sections.length}) is too short. Minimum ${minSections} required.`);
    hasError = true;
}
// 6-step structure is now a recommendation for shorts, not strict for all
const opCount = 1;
const edCount = 1;
// 6-step structure is now optional for flexibility.
/*
const itemContentCount = sections.length - opCount - edCount;
if (itemContentCount % 6 !== 0) {
    console.warn(`⚠️  Current content section count (${itemContentCount}) is not a multiple of 6. (Recommended but not required)`);
}
*/

if (!hasError) {
    console.log('✅ All checks passed! The script is ready for production.');
} else {
    console.log('\n🚨 Validation failed. Please fix the errors above.');
    process.exit(1);
}

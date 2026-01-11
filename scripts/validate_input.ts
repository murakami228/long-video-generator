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
const sections = inputData.customScript.sections;

console.log(`\n🔍 Validating project: ${projectSlug}\n`);

let hasError = false;

sections.forEach((section: any, idx: number) => {
    const text = section.text || '';
    const lines = text.split('\n');

    // 0. Total Length Check (Warning for > 35 chars for single-line captions)
    if (text.replace(/\n/g, '').length > 35) {
        console.warn(`⚠️  Section ${idx}: Text length (${text.length}) exceeds 35 chars. Consider shortening.`);
    }

    // 1. Line Length Check (Max 12 chars)
    lines.forEach((line: string, lineIdx: number) => {
        if (line.length > 12) {
            console.error(`❌ Section ${idx} [Line ${lineIdx + 1}]: Too long (${line.length} chars). Max 12 allowed.`);
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

    // 3. Half-width Space Check
    if (text.includes(' ') || text.includes('　')) {
        console.error(`❌ Section ${idx}: Contains spaces.`);
        console.error(`   Content: "${text.replace(/\n/g, ' ')}"`);
        hasError = true;
    }

    // 4. Alphabet Check (Should be Katakana)
    if (text.match(/[a-zA-Z]/)) {
        console.error(`❌ Section ${idx}: Contains alphabet characters. Use Katakana.`);
        console.error(`   Content: "${text.replace(/\n/g, ' ')}"`);
        hasError = true;
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
});

// 6. 6-Step Structure Check
const opCount = 1;
const edCount = 1;
const itemContentCount = sections.length - opCount - edCount;
if (itemContentCount % 6 !== 0) {
    console.error(`❌ Total sections (${sections.length}) doesn't follow 6-step structure (OP + 6*N + ED/CTA).`);
    hasError = true;
}

if (!hasError) {
    console.log('✅ All checks passed! The script is ready for production.');
} else {
    console.log('\n🚨 Validation failed. Please fix the errors above.');
    process.exit(1);
}

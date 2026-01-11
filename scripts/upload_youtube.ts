
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');
const CLIENT_SECRET_PATH = path.join(process.cwd(), 'client_secret.json');
const LOG_PATH = path.join(process.cwd(), 'docs', 'upload_log.json');
const UPLOADED_DIR = path.join(process.cwd(), 'uploaded_projects');

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: npx tsx scripts/upload_youtube.ts <project_slug> [--metadata-only]');
    process.exit(1);
}

const projectSlug = args[0];
const metadataOnly = args.includes('--metadata-only');

// Directories to search for the project
const SEARCH_DIRS = [
    path.join(process.cwd(), 'projects'),
    path.join(process.cwd(), 'completed_projects')
];

function findProjectDir(slug: string): string | null {
    for (const dir of SEARCH_DIRS) {
        const fullPath = path.join(dir, slug);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

const projectDir = findProjectDir(projectSlug);
if (!projectDir) {
    console.error(`Project not found: ${projectSlug}`);
    process.exit(1);
}

const videoPath = path.join(process.cwd(), 'out', `${projectSlug}.mp4`);
if (!metadataOnly && !fs.existsSync(videoPath)) {
    console.error(`Video file not found at: ${videoPath}`);
    console.error('Please render the video first.');
    process.exit(1);
}


const inputJsonPath = path.join(projectDir, 'input.json');
if (!fs.existsSync(inputJsonPath)) {
    console.error(`input.json not found at: ${inputJsonPath}`);
    process.exit(1);
}

const inputData = JSON.parse(fs.readFileSync(inputJsonPath, 'utf-8'));
const customScript = inputData.customScript;

// --- Load Log & Quota Check ---
let uploadLog: any[] = [];
if (fs.existsSync(LOG_PATH)) {
    uploadLog = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

// 1. Quota Check (Daily Limit & 24h Check)
function checkQuota() {
    const now = new Date();
    // Check uploads in the last 24 hours
    const recentUploads = uploadLog.filter(entry => {
        // Handle ISO strings and potentially invalid dates
        try {
            const upDate = new Date(entry.uploadedAt);
            const diffMs = now.getTime() - upDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            return diffHours < 24;
        } catch {
            return false;
        }
    });

    if (recentUploads.length >= 6) {
        console.error('ERROR: Daily upload limit (6 videos) reached within the last 24 hours.');
        process.exit(1);
    }

    if (recentUploads.length > 0) {
        const lastUpload = new Date(recentUploads[recentUploads.length - 1].uploadedAt);
        console.log(`Last upload was at: ${lastUpload.toLocaleString()}`);
        console.log(`Uploads in last 24h: ${recentUploads.length}/6`);
    } else {
        console.log('No uploads in the last 24 hours. Quota is clear.');
    }
}
checkQuota();


// --- Smart Scheduling ---
// Target slots: 07:00, 12:00, 20:00 (JST)
function getSmartPublishDate(): string {
    const now = new Date();

    // Get all future scheduled times from log
    const scheduledTimes = uploadLog
        .map(e => e.scheduledFor ? new Date(e.scheduledFor).getTime() : 0)
        .filter(t => t > now.getTime());

    // Generate candidates for the next 7 days to cover enough slots
    let candidates: Date[] = [];
    for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() + d);

        const slot1 = new Date(date); slot1.setHours(7, 0, 0, 0);
        const slot2 = new Date(date); slot2.setHours(12, 0, 0, 0);
        const slot3 = new Date(date); slot3.setHours(20, 0, 0, 0);

        candidates.push(slot1, slot2, slot3);
    }

    // Filter out candidates that are in the past OR already taken
    const availableSlots = candidates.filter(slot => {
        if (slot <= now) return false; // Past
        // Check collision (within 1 hour margin to be safe)
        const isTaken = scheduledTimes.some(t => Math.abs(t - slot.getTime()) < 60 * 60 * 1000);
        return !isTaken;
    });

    if (availableSlots.length === 0) {
        console.warn('No available smart slots found in next 7 days. Defaulting to 24h from now.');
        const fallback = new Date(now);
        fallback.setDate(fallback.getDate() + 1);
        return fallback.toISOString();
    }

    return availableSlots[0].toISOString();
}


// --- Metadata Construction ---

let title = '';
let description = '';
let tags: string[] = [];
let privacyStatus = 'private'; // Default
let publishAt = '';

if (inputData.youtube) {
    // Priority: custom youtube block
    title = inputData.youtube.title || `【${inputData.topic.split('！')[0].replace('で', '')}】${inputData.topic}`;
    description = inputData.youtube.description;
    tags = inputData.youtube.tags || [];
    privacyStatus = inputData.youtube.privacyStatus || 'private';
    publishAt = inputData.youtube.publishAt;
}

// --- Dynamic Metadata Generation based on Rules ---

// 1. Extract Items (Functions/Features)
const items: string[] = [];
const itemDescriptions: { name: string, detail: string }[] = [];

customScript.sections.forEach((section: any, idx: number) => {
    // Look for "1つ目は", "1. ", "① ", etc.
    if (section.text.match(/^([1-3１-３一二三]\s*[\.．]|[1-3１-３一二三]つ目は|①|②|③)/)) {
        const nameCandidate = section.highlight?.[0] || section.text.split('\n')[1] || '';
        const name = nameCandidate.replace(/[！!]/g, '').trim();
        if (name && !items.includes(name)) {
            items.push(name);

            // Look ahead for a Result/Benefit section (usually 5-6 sections ahead)
            let detail = '';
            for (let i = 1; i <= 6; i++) {
                const futureSection = customScript.sections[idx + i];
                if (futureSection && (futureSection.text.includes('結果') || futureSection.text.includes('！') || i === 6)) {
                    detail = futureSection.text.replace(/\n/g, '').split('！')[0];
                    if (detail.length > 5) break;
                }
            }
            itemDescriptions.push({ name, detail: detail || '業務を効率化します' });
        }
    }
});

// 2. Fallback / Auto-Generation if fields are missing
const softwareMatch = inputData.topic.match(/(エクセル|パワポ|Word|Excel|PowerPoint)/);
const software = softwareMatch ? softwareMatch[0] : 'Office';
const keywordSuffix = items.length > 0 ? `【${items.join('/')}】` : '';

if (!title) {
    // Format: 【ソフト名】メインコピー！サブコピー【キーワード】
    // Remove redundant software name from topic if already in 【】
    let cleanTopic = inputData.topic;
    if (software && cleanTopic.includes(software)) {
        cleanTopic = cleanTopic.replace(new RegExp(`${software}(で！|で)?`), '').trim();
    }
    title = `【${software}】${cleanTopic}${keywordSuffix}`;
}

if (!description) {
    // Auto-generate description strictly following rules
    let intro = customScript.sections[0].text.replace(/\n/g, '');
    if (intro.endsWith('？') || intro.endsWith('?')) {
        intro = intro.slice(0, -1);
    }
    const badHabit = customScript.sections[3]?.text.replace(/\n/g, '') || 'その作業、もっと楽にしませんか？';

    description = `
${intro}で困っていませんか？
${badHabit}…その作業、この動画で紹介する技を使えば一瞬で終わります！

今回は、${software}の作業を劇的に効率化する「${inputData.topic.replace(/.*！/, '')}」を3つ紹介します。
これらを使いこなして、業務効率をアップさせましょう！

■紹介するアイテム
${itemDescriptions.map((item, i) => `${['①', '②', '③'][i]} ${item.name}：${item.detail}`).join('\n')}

この動画が役に立ったら「いいね」とチャンネル登録をお願いします！

■音声
VOICEVOX:ずんだもん

#${software} #${software === 'エクセル' ? 'Excel' : software} #業務効率化 #時短テクニック ${items.map(it => `#${it}`).join(' ')} #ずんだもん
    `.trim();
}

if (!publishAt && !inputData.youtube?.publishAt) {
    // If user didn't specify, use Smart Scheduling
    publishAt = getSmartPublishDate();
    console.log(`Auto-Scheduled for: ${publishAt} (Smart Scheduling)`);
    privacyStatus = 'private'; // Must be private for scheduling
}

// 3. Write back to input.json if youtube block is missing or empty OR if metadataOnly is true
if (!inputData.youtube || metadataOnly) {
    inputData.youtube = {
        title,
        description,
        tags,
        privacyStatus: inputData.youtube?.privacyStatus || privacyStatus,
        publishAt: inputData.youtube?.publishAt || publishAt
    };
    fs.writeFileSync(inputJsonPath, JSON.stringify(inputData, null, 4));
    console.log(`Metadata ${inputData.youtube ? 'updated' : 'written back'} to input.json.`);
} else {
    // Optionally update fields if they were auto-generated but missing in the block
    let updated = false;
    if (!inputData.youtube.title) { inputData.youtube.title = title; updated = true; }
    if (!inputData.youtube.description) { inputData.youtube.description = description; updated = true; }
    if (tags.length > 0 && (!inputData.youtube.tags || inputData.youtube.tags.length === 0)) { inputData.youtube.tags = tags; updated = true; }
    if (!inputData.youtube.publishAt && publishAt) { inputData.youtube.publishAt = publishAt; updated = true; }
    if (updated) {
        fs.writeFileSync(inputJsonPath, JSON.stringify(inputData, null, 4));
        console.log('Missing metadata fields updated in input.json.');
    }
}


console.log('--- Upload Metadata ---');
console.log(`Title: ${title}`);
console.log(`Privacy: ${privacyStatus}`);
if (publishAt) console.log(`PublishAt: ${publishAt}`);
console.log(`Video: ${videoPath}`);
console.log('--- Description ---');
console.log(description);
console.log('-----------------------');

async function upload() {
    if (!fs.existsSync(CLIENT_SECRET_PATH)) {
        console.error('client_secret.json not found.');
        process.exit(1);
    }
    if (!fs.existsSync(TOKEN_PATH)) {
        console.error('tokens.json not found. Run scripts/auth_youtube.ts first.');
        process.exit(1);
    }

    const content = fs.readFileSync(CLIENT_SECRET_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8')));

    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

    console.log('Starting upload...');

    try {
        const uniqueTitle = title;

        const requestBody: any = {
            snippet: {
                title: uniqueTitle.substring(0, 100),
                description: description.substring(0, 5000),
                categoryId: '22',
                tags: tags
            },
            status: {
                privacyStatus: privacyStatus,
            },
        };

        if (publishAt) {
            requestBody.status.publishAt = publishAt;
        }

        const res = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: requestBody,
            media: {
                body: fs.createReadStream(videoPath),
            },
        });

        console.log('\nUpload complete!');
        console.log(`Video ID: ${res.data.id}`);
        console.log(`URL: https://youtu.be/${res.data.id}`);

        // --- Post-Upload Logging & Moving ---

        // 1. Update Log
        const newLogEntry = {
            projectId: projectSlug,
            uploadedAt: new Date().toISOString(),
            videoId: res.data.id,
            title: title,
            description: description,
            scheduledFor: publishAt || 'Immediate'
        };
        uploadLog.push(newLogEntry);
        fs.writeFileSync(LOG_PATH, JSON.stringify(uploadLog, null, 2));
        console.log('Log updated.');

        // 2. Move Project
        const destDir = path.join(UPLOADED_DIR, projectSlug);
        console.log(`Moving ${projectDir} to ${destDir}...`);
        if (!fs.existsSync(UPLOADED_DIR)) {
            fs.mkdirSync(UPLOADED_DIR, { recursive: true });
        }
        try {
            fs.renameSync(projectDir, destDir);
            console.log(`Project moved successfully.`);
        } catch (err) {
            console.error(`Failed to move project: ${err}`);
            console.warn('Please move the folder manually if needed.');
        }

        // 3. Update input.json with final metadata (if not already done or if fields were missing)
        let finalMetadataUpdated = false;
        if (!inputData.youtube) {
            inputData.youtube = { title, description, tags, privacyStatus, publishAt };
            finalMetadataUpdated = true;
        } else {
            if (inputData.youtube.title !== title) { inputData.youtube.title = title; finalMetadataUpdated = true; }
            if (inputData.youtube.description !== description) { inputData.youtube.description = description; finalMetadataUpdated = true; }
            // Only update tags if they were empty or significantly different (simple check)
            if (tags.length > 0 && (!inputData.youtube.tags || inputData.youtube.tags.length === 0 || JSON.stringify(inputData.youtube.tags) !== JSON.stringify(tags))) { inputData.youtube.tags = tags; finalMetadataUpdated = true; }
            if (inputData.youtube.privacyStatus !== privacyStatus) { inputData.youtube.privacyStatus = privacyStatus; finalMetadataUpdated = true; }
            if (inputData.youtube.publishAt !== publishAt) { inputData.youtube.publishAt = publishAt; finalMetadataUpdated = true; }
        }
        if (finalMetadataUpdated) {
            fs.writeFileSync(inputJsonPath, JSON.stringify(inputData, null, 4));
            console.log('Final metadata written back to input.json after upload.');
        }


    } catch (error: any) {
        console.error('Upload failed:', error.message);
        if (error.errors) {
            error.errors.forEach((e: any) => console.error(e));
        }
    }
}

if (metadataOnly) {
    console.log('\nMetadata Only mode: Metadata has been generated and written back to input.json.');
    process.exit(0);
}

upload();

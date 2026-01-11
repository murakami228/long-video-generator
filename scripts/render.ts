import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const projectSlug = process.argv[2];
if (!projectSlug) {
    console.error("Please provide a project slug. Usage: npx tsx scripts/render.ts <project_slug>");
    process.exit(1);
}

const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const outputFile = path.join(outDir, `${projectSlug}.mp4`);

console.log(`Rendering project: ${projectSlug} to ${outputFile}`);

// We rely on public/data.json being updated by build.ts.
// In a more advanced setup, we would pass data via input props to Remotion.
// For now, ensuring build.ts was run recently or running it here?
// Better to just run render commands.

try {
    // Run Remotion Render
    // We assume Root.tsx reads from public/data.json, which build.ts updates.
    // So the workflow is: build -> render.
    execSync(`npx remotion render ShortsVideo "${outputFile}"`, { stdio: 'inherit' });
    console.log("Render complete!");
} catch (e) {
    console.error("Render failed", e);
    process.exit(1);
}

# G-Mark 2025 Video Implementation Plan

Create a long-form video explaining the G-Mark certification based on the provided transcript.

## User Review Required
- **Script Structure**: The body is adjusted to 24 sections to fit the "multiple of 6" rule.
- **Slide Template**: Using `02_std_grid` (Grid Layout) as the base.

## Proposed Changes

### `projects/g_mark_2025`
#### [NEW] [input.json](file:///Users/murakamikei/projects/long-video-generator/projects/g_mark_2025/input.json)
- Contains the full script with `highlight` fields.
- Structure:
    - Intro: 3 sections
    - Body: 24 sections (Risk, Cost, Efficiency, Not Needed)
    - Outro: 6 sections (Total 33 sections? No, Outro rule is loose, but let's aim for consistency. Actually rule says "Intro + Body(6n) + End". Intro/End lengths are flexible but Body must be 6n. Wait, "Intro + (Body: 6 multiple) + End". If Intro=3, End is usually short.
- **Refined Section Count Plan**:
    - Intro: 3
    - Body: 24 (4 parts x 6 sections)
    - Outro: 3 (Summary, CTA, Closing)
    - Total: 30 sections.

#### [NEW] [slide_grid.html](file:///Users/murakamikei/projects/long-video-generator/projects/g_mark_2025/slide_grid.html)
- Copied from `slide_templates/02_std_grid.html`.
- IDs `item-1` to `item-6` used for animations.

#### [NEW] [slide_grid.css](file:///Users/murakamikei/projects/long-video-generator/projects/g_mark_2025/slide_grid.css)
- Copied from `slide_templates/02_std_grid.css`.

## Verification Plan

### Automated Verification
- Run validator: `npx tsx scripts/validate_input.ts g_mark_2025`
    - Must pass without errors (Body % 6 == 0).

### Manual Verification
- Run preview: `npx tsx scripts/review_preview.ts g_mark_2025` (if script exists) or open in Remotion Preview.
- Check if text fits in captions (approx 35 chars).
- Check if slides animate correctly with the steps.

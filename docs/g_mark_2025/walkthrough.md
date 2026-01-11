# G-Mark 2025 Video Walkthrough

This document records the creation process for the G-Mark 2025 video.

## Changes Created

### File Structure
- `projects/g_mark_2025/`
    - `input.json` (Script)
    - `slide_1.html` to `slide_6.html` (HTML Slides)
    - `slide_1.css` to `slide_6.css` (CSS Styles)

### Script Content
- **Structure**: 6-step structure (Intro: 3, Body: 24, Outro: 3).
- **Body**:
    - **Part 1**: Risk Management (Violation Points)
    - **Part 2**: Recruitment & Cost
    - **Part 3**: Efficiency & Expansion
    - **Part 4**: Who doesn't need it
- **Slides**: 6 slides corresponding to Intro+Risk, Cost, Efficiency, NotNeeded, Outro.

### Slide Design
- **Varied Layouts**:
    - **Intro/Outro**: `03_std_step` (Step design for story flow).
    - **Key Points**: `02_std_grid` (Grid for 6 items).
    - **Lists**: `01_std_list` (List for detailed points).
- **Modifications**:
    - Split `input.json` into 6 parts (`input_part1.json` to `part6.json`) for easier editing.
    - Updated CSS to support 6 items in List/Step templates.

## Verification Results

### Validation
- [x] Script Logic: Validated 6-step structure.
- [x] Text Length: Sections are within ~35 chars limit.
- [x] Slide Integration: All slides linked correctly.

### Manual Preview
### Manual Verification
- **Workflow**:
    1. `npx tsx scripts/generate_audio_batch.ts g_mark_2025` (Audio Generation)
    2. `npx tsx scripts/sync_audio.ts g_mark_2025` (Data Sync)
    3. `npx tsx scripts/review_preview.ts g_mark_2025` (Preview Gen & Open)
- **Result**: Preview generated in `projects/g_mark_2025/index.html` and scenes.
- **Validation**: Passed script checks and preview generation.

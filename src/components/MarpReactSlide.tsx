
import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

const SAMPLE_HTML = `
<section>
    <div class="header-group">
        <h1>Excelで広がるキャリア</h1>
        <p class="subtitle">習得レベルで変わる3つの段階</p>
    </div>
    
    <div class="content-container">
        <div class="item-card" id="item-1">
            <span class="badge">Leve.1</span>
            <div class="text-content">
                <h2>一般事務・営業アシスタント</h2>
                <p>基本操作・関数（SUM, VLOOKUP）で<br/><strong>業務効率化</strong>の即戦力に</p>
            </div>
        </div>

        <div class="item-card" id="item-2">
            <span class="badge blue">Level.2</span>
            <div class="text-content">
                <h2>データアナリスト</h2>
                <p>ピボットテーブル・統計分析で<br/><span class="highlight-text">「数字に強い」</span>人材へ</p>
            </div>
        </div>

        <div class="item-card" id="item-3">
            <span class="badge purple">Level.3</span>
            <div class="text-content">
                <h2>業務改善コンサルタント</h2>
                <p>VBA・マクロによる自動化で<br/>組織全体の生産性を向上</p>
            </div>
        </div>
    </div>
</section>
`;

const SAMPLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap');

section {
    width: 1920px;
    height: 1080px;
    background: transparent; /* Background handled by video component */
    padding: 120px 100px 350px 100px; /* Large bottom padding for captions */
    font-family: 'Noto Sans JP', sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Top align */
    box-sizing: border-box;
    color: #333;
}

.header-group {
    margin-bottom: 60px;
}

h1 {
    font-size: 80px;
    font-weight: 900;
    margin: 0;
    line-height: 1.2;
    color: #1a1a1a;
    letter-spacing: -0.02em;
}

.subtitle {
    font-size: 32px;
    color: #666;
    margin-top: 20px;
    font-weight: 700;
}

.content-container {
    display: flex;
    flex-direction: column;
    gap: 40px;
}

.item-card {
    display: flex;
    align-items: flex-start;
    padding: 30px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.badge {
    background: #4ade80; /* Green */
    color: white;
    padding: 8px 24px;
    border-radius: 50px;
    font-weight: 900;
    font-size: 24px;
    margin-right: 30px;
    margin-top: 5px;
    white-space: nowrap;
    box-shadow: 0 4px 10px rgba(74, 222, 128, 0.3);
}

.badge.blue { background: #60a5fa; box-shadow: 0 4px 10px rgba(96, 165, 250, 0.3); }
.badge.purple { background: #a78bfa; box-shadow: 0 4px 10px rgba(167, 139, 250, 0.3); }

.text-content h2 {
    font-size: 42px;
    margin: 0 0 10px 0;
    color: #333;
}

.text-content p {
    font-size: 28px;
    margin: 0;
    color: #555;
    line-height: 1.6;
}

strong {
    color: #166534; /* Dark green */
}

.highlight-text {
    position: relative;
    display: inline-block;
}

.highlight-text::after {
    content: '';
    position: absolute;
    bottom: 5px;
    left: 0;
    width: 100%;
    height: 12px;
    background: rgba(255, 230, 0, 0.6);
    z-index: -1;
}
`;

interface MarpReactSlideProps {
    htmlContent?: string;
    customCss?: string;
    steps?: number[];
    highlightStep?: number;
}

export const MarpReactSlide: React.FC<MarpReactSlideProps> = ({ htmlContent, customCss, steps = [], highlightStep = Infinity }) => {
    const frame = useCurrentFrame();

    // Determine visibility based on current frame and steps using dynamic mapping
    // steps[i] -> Show Item i+1
    const dynamicStyles = steps.map((stepFrame, index) => {
        const itemIndex = index + 1;
        const show = frame >= stepFrame;
        // Use attribute selector to match IDs starting with "item-N" (e.g. item-1_L, item-1_R)
        return show ? `[id^="item-${itemIndex}"] { opacity: 1 !important; transform: none !important; }` : '';
    }).join('\n');

    const showHighlight = frame >= highlightStep;
    const highlightStyle = showHighlight ? '.highlight-text::after { width: 100% !important; }' : '';
    const finalDynamicStyles = dynamicStyles + highlightStyle;

    return (
        <AbsoluteFill>
            {/* <style>{defaultStyles}</style> Removed defaultStyles to rely on customCss */}
            {customCss && <style>{customCss}</style>}
            <style>{finalDynamicStyles}</style>
            <div
                dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
                style={{ width: '100%', height: '100%' }}
            />
        </AbsoluteFill>
    );
};

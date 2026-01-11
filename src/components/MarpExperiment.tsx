import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { MarpReactSlide } from './MarpReactSlide';
import { OutlinedText } from './OutlinedText';
import { VideoData } from '../types';

// @ts-ignore
import generatedData from '../../public/data.json';

const data = generatedData as VideoData;

export const MarpExperiment: React.FC = () => {
    // Determine steps dynamically from scenes
    // We assume the first scene is Title, second is Intro.
    // Slide items appear starting from scene 2 (Level 1), 3 (Level 2), 4 (Level 3).
    // Indices in data.scenes:
    // 0: Title
    // 1: Intro (Text)
    // 2: Level 1 (Slide Item 1)
    // 3: Level 2 (Slide Item 2)
    // 4: Level 3 (Slide Item 3)

    let currentFrameCount = 0;
    const sceneStartFrames: number[] = [];

    data.scenes.forEach(scene => {
        sceneStartFrames.push(currentFrameCount);
        currentFrameCount += scene.durationInFrames;
    });

    // Custom mapping for steps
    // If slideSteps is provided in data, use it.
    // Otherwise fallback to scene start frames (legacy behavior for excel_benefits_demo)

    let steps: number[] = [];
    if (data.slideSteps && data.slideSteps.length > 0) {
        steps = data.slideSteps;
    } else {
        // Fallback for excel_benefits_demo structure
        steps = [
            sceneStartFrames[2] || 0,
            sceneStartFrames[3] || 0,
            sceneStartFrames[4] || 0
        ];
    }

    // Highlight logic: halfway through Scene 3
    const scene3Start = sceneStartFrames[3] || 0;
    const scene3Duration = data.scenes[3]?.durationInFrames || 0;
    const highlightStep = scene3Start + Math.floor(scene3Duration / 2);

    const htmlContent = data.slideHtml || '';
    const customCss = data.customCss;

    return (
        <AbsoluteFill>
            {/* Audio Loop ... */}
            {data.scenes.map((scene, index) => {
                // ...
                const audioSrc = scene.audioUrl ?
                    (scene.audioUrl.startsWith('/') ? scene.audioUrl.substring(1) : scene.audioUrl)
                    : '';

                if (!audioSrc) return null;

                return (
                    <Sequence key={`audio-${index}`} from={sceneStartFrames[index]} durationInFrames={scene.durationInFrames}>
                        <Audio src={staticFile(audioSrc)} />
                    </Sequence>
                );
            })}

            {/* Slide Component */}
            <MarpReactSlide
                htmlContent={htmlContent}
                customCss={customCss}
                steps={steps}
                highlightStep={highlightStep}
            />

            {/* Captions Overlay */}
            {data.scenes.map((scene, index) => (
                <Sequence key={`caption-${index}`} from={sceneStartFrames[index]} durationInFrames={scene.durationInFrames}>
                    <div className="absolute bottom-10 left-0 w-full flex justify-center items-center px-20">
                        <div className="bg-black/70 px-8 py-4 rounded-xl">
                            <OutlinedText
                                text={scene.text}
                                fontSize={42}
                                color="white"
                                outlineColor="black"
                                outlineWidth={4}
                                highlightKeywords={scene.highlight}
                            />
                        </div>
                    </div>
                </Sequence>
            ))}
        </AbsoluteFill>
    );
};

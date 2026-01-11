import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { MarpReactSlide } from './MarpReactSlide';
import { OutlinedText } from './OutlinedText';
import { VideoData } from '../types';

// @ts-ignore
import generatedData from '../../public/data.json';

const data = generatedData as VideoData;

const resolveSrc = (src: string) => {
    if (src.startsWith('http')) return src;
    return staticFile(src.startsWith('/') ? src.substring(1) : src);
};

export const MarpExperiment: React.FC = () => {
    let currentFrameCount = 0;
    const sceneStartFrames: number[] = [];

    data.scenes.forEach(scene => {
        sceneStartFrames.push(currentFrameCount);
        currentFrameCount += scene.durationInFrames;
    });

    let steps: number[] = [];
    if (data.slideSteps && data.slideSteps.length > 0) {
        steps = data.slideSteps;
    }

    const htmlContent = data.slideHtml || '';
    const customCss = data.customCss;

    return (
        <AbsoluteFill className="bg-white">
            {/* BGM */}
            {data.bgmUrl && (
                <Audio
                    src={resolveSrc(data.bgmUrl)}
                    volume={0.2}
                    loop
                />
            )}

            {/* Audio Series */}
            {data.scenes.map((scene, index) => {
                if (!scene.audioUrl) return null;
                const src = resolveSrc(scene.audioUrl);
                return (
                    <Sequence key={`audio-${index}`} from={sceneStartFrames[index]} durationInFrames={scene.durationInFrames}>
                        <Audio src={src} />
                    </Sequence>
                );
            })}

            {/* Slide Component - Multi-slide Support */}
            {data.scenes.map((scene, index) => (
                <Sequence key={`slide-${index}`} from={sceneStartFrames[index]} durationInFrames={scene.durationInFrames}>
                    <MarpReactSlide
                        htmlContent={scene.slideHtml || data.slideHtml || ''}
                        customCss={scene.customCss || data.customCss}
                        stepIndex={scene.stepIndex || 0}
                    />
                </Sequence>
            ))}

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

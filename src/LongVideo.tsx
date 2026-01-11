import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, Series, staticFile, useVideoConfig } from 'remotion';
import { OutlinedText } from './components/OutlinedText';
import { VideoData, Scene } from './types';

const resolveSrc = (src: string) => {
    if (src.startsWith('http')) return src;
    return staticFile(src);
};

export const LongVideo: React.FC<VideoData> = ({
    scenes,
    bgmUrl,
    backgroundImageUrl,
    characterImageUrl
}) => {
    return (
        <AbsoluteFill className="bg-white">
            {/* Background Music */}
            {bgmUrl && <Audio src={resolveSrc(bgmUrl)} loop volume={0.1} />}

            {/* Fixed Background Layer (if defined) */}
            {backgroundImageUrl && (
                <AbsoluteFill>
                    <Img src={resolveSrc(backgroundImageUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </AbsoluteFill>
            )}

            {/* Scenes Series */}
            <Series>
                {scenes.map((scene, index) => (
                    <Series.Sequence key={index} durationInFrames={scene.durationInFrames}>
                        {/* Audio for this scene */}
                        {scene.audioUrl && <Audio src={resolveSrc(scene.audioUrl)} />}

                        <AbsoluteFill>
                            {renderSceneContent(scene)}
                        </AbsoluteFill>
                    </Series.Sequence>
                ))}
            </Series>

            {/* Character Layer (Always on top, bottom right) */}
            {characterImageUrl && (
                <AbsoluteFill>
                    <div className="absolute bottom-0 right-10 w-[600px] h-[900px]">
                        <Img
                            src={resolveSrc(characterImageUrl)}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))'
                            }}
                        />
                    </div>
                </AbsoluteFill>
            )}

            {/* Captions Layer (for non-slide sections usually, or simplified) */}
            {/* Logic: If it's a slide, maybe we don't show large captions?
                Let's show captions in a "subtitle" style at the bottom for all sections for accessibility. */
            }
            <Series>
                {scenes.map((scene, index) => (
                    <Series.Sequence key={index} durationInFrames={scene.durationInFrames}>
                        <div className="absolute bottom-10 left-0 w-full flex justify-center items-center px-20">
                            <div className="bg-black/70 px-8 py-4 rounded-xl">
                                <OutlinedText
                                    text={scene.text}
                                    fontSize={50}
                                    color="white"
                                    outlineColor="black"
                                    outlineWidth={4}
                                />
                            </div>
                        </div>
                    </Series.Sequence>
                ))}
            </Series>
        </AbsoluteFill>
    );
};

// Helper to render specific content based on scene type
const renderSceneContent = (scene: Scene) => {
    const type = scene.type || 'image'; // default to image

    switch (type) {
        case 'slide':
            return (
                <AbsoluteFill className="justify-center items-center bg-white">
                    <Img
                        src={resolveSrc(scene.imageUrl)}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </AbsoluteFill>
            );
        case 'intro':
            // Intro could have a big title overlay
            return (
                <AbsoluteFill className="justify-center items-center">
                    {/* Intro specific title visualization if needed, assumes imageUrl is background or title card */}
                    <Img src={resolveSrc(scene.imageUrl)} style={{ opacity: 0.8 }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h1 className="text-9xl font-bold text-black bg-white/80 p-10 rounded-3xl shadow-lg leading-tight">
                            {scene.text}
                        </h1>
                    </div>
                </AbsoluteFill>
            );
        case 'outro':
            return (
                <AbsoluteFill className="justify-center items-center">
                    <Img src={resolveSrc(scene.imageUrl)} style={{ opacity: 0.8 }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h1 className="text-8xl font-bold text-white drop-shadow-lg">
                            {scene.text}
                        </h1>
                    </div>
                </AbsoluteFill>
            );
        case 'image':
        default:
            // Standard image display (maybe KenBurns or just fit)
            // User requested "Same background", so maybe 'image' type just shows the image overlaid on the fixed background?
            // If imageUrl is placeholder, maybe don't show it if we have fixed background.
            // But let's assume if imageUrl is provided, we show it.
            return (
                <AbsoluteFill className="justify-center items-center p-20">
                    <div className="w-full h-full flex items-center justify-center shadow-2xl bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <Img
                            src={resolveSrc(scene.imageUrl)}
                            style={{ maxHeight: '80%', maxWidth: '90%', objectFit: 'contain', borderRadius: '20px' }}
                        />
                    </div>
                </AbsoluteFill>
            );
    }
};

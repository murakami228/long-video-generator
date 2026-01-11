import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const KenBurnsBackground: React.FC<{
    src: string;
}> = ({ src }) => {
    const frame = useCurrentFrame();
    const { width, height, durationInFrames } = useVideoConfig();

    // Scale from 1.1 to 1.3 over the duration
    const scale = interpolate(
        frame,
        [0, durationInFrames],
        [1.1, 1.3]
    );

    // Slight pan effect
    const translateX = interpolate(
        frame,
        [0, durationInFrames],
        [0, -20]
    );
    const translateY = interpolate(
        frame,
        [0, durationInFrames],
        [0, -20]
    );

    const imageSource = src.startsWith('http') ? src : staticFile(src);

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
                src={imageSource}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                }}
            />
        </AbsoluteFill>
    );
};

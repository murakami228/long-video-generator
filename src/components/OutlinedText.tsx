import React from 'react';

export const OutlinedText: React.FC<{
    text: string;
    fontSize?: number;
    color?: string;
    outlineColor?: string;
    outlineWidth?: number;
    className?: string;
    style?: React.CSSProperties;
    highlightKeywords?: string[];
}> = ({
    text,
    fontSize = 60,
    color = 'white',
    outlineColor = 'black',
    outlineWidth = 8,
    className = '',
    style = {},
    highlightKeywords = [],
}) => {
        const renderText = () => {
            if (!highlightKeywords || highlightKeywords.length === 0) return text;

            const regex = new RegExp(`(${highlightKeywords.join('|')})`, 'gi');
            const parts = text.split(regex);

            return parts.map((part, index) => {
                const isHighlight = highlightKeywords.some(k => k.toLowerCase() === part.toLowerCase());
                return isHighlight ? (
                    <span key={index} style={{ color: '#FFD700', WebkitTextFillColor: '#FFD700' }}>{part}</span>
                ) : part;
            });
        };

        return (
            <div
                className={`font-bold ${className}`}
                style={{
                    fontSize,
                    color,
                    WebkitTextStroke: `${outlineWidth}px ${outlineColor}`,
                    paintOrder: 'stroke fill',
                    WebkitTextFillColor: color,
                    strokeLinejoin: 'round',
                    textShadow: '0px 4px 10px rgba(0,0,0,0.5)',
                    fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                    lineHeight: 1.2,
                    whiteSpace: 'pre-wrap',
                    ...style,
                }}
            >
                {renderText()}
            </div>
        );
    };

export type SceneType = 'intro' | 'slide' | 'image' | 'outro';

export type Scene = {
  type?: SceneType; // Default to 'image' if undefined for backward compatibility
  imageUrl: string;
  durationInFrames: number;
  text: string;           // Caption text or slide notes
  speechText?: string;    // Text for TTS
  audioUrl?: string;      // Per-scene audio
  highlight?: string[];   // For 'image' type overlays

  // For 'slide' type
  markdown?: string;      // Markdown content for Marp
};

export type Captions = {
  text: string;
  startMs: number;
  endMs: number;
}[];

export type VideoData = {
  audioUrl?: string;
  titleAudioUrl?: string;
  bgmUrl?: string;

  captions: Captions;
  scenes: Scene[];
  durationInFrames: number;
  titleSplit?: string[];

  // Metadata for consistent background
  backgroundImageUrl?: string;
  characterImageUrl?: string;
  slideHtml?: string;
  customCss?: string;
  slideSteps?: number[];
};

import "./index.css";
import { Composition } from "remotion";
import { VideoData } from "./types";
import { MarpExperiment } from "./components/MarpExperiment";

// @ts-ignore
import generatedData from "../public/data.json";

const data = generatedData as VideoData;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* LongVideo は廃止。MarpExperiment のみ使用 */}
      <Composition
        id="MarpExperiment"
        component={MarpExperiment}
        durationInFrames={data.durationInFrames || 1800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

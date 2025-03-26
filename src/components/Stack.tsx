"use client";

import Distortion from "./Distortion";
import Delay from "./Delay";
import BitCrush from "./BitCrush";
import AudioInput from "./AudioInput";
import Recorder from "./Recorder";

function Stack() {
  return (
    <div className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-2xl">
      <AudioInput index={0} />
      <Distortion index={1} />
      <Distortion index={2} />
      <BitCrush index={3} />
      <Delay index={4} />
      <Recorder index={5} />
    </div>
  );
}

export default Stack;

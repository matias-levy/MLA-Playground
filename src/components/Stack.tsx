"use client";

import MicInput from "./MicInput";
import Distortion from "./Distortion";
import Delay from "./Delay";
import BasicWorklet from "./BasicWorklet";

function Stack() {
  return (
    <div className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-2xl">
      <MicInput index={0} />
      <Distortion index={1} />
      <Distortion index={2} />
      <BasicWorklet index={3} />
      <Delay index={4} />
    </div>
  );
}

export default Stack;

"use client";

import { useState } from "react";

import AudioInput from "./AudioInput";
import Recorder from "./Recorder";
import AddModule from "./AddModule";

import Distortion from "./Distortion";
import Delay from "./Delay";
import BitCrush from "./BitCrush";

export interface AudioModuleProps {
  index: number;
  unregisterModule: Function;
}

export type AudioModuleComponent = React.FC<AudioModuleProps>;

function Stack() {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [modules, setModules] = useState<AudioModuleComponent[]>([
    // Distortion,
    // BitCrush,
    // BitCrush,
    // BitCrush,
  ]);

  function registerModule(Module: AudioModuleComponent) {
    setModules((prev) => [...prev, Module]);
  }

  function unregisterModule(index: number) {
    setModules((prevModules) => prevModules.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-2xl">
      <AudioInput
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        fileIsAudio={fileIsAudio}
        setFileIsAudio={setFileIsAudio}
      />
      {modules.map((Module, i) => {
        return <Module index={i} key={i} unregisterModule={unregisterModule} />;
      })}
      <AddModule registerModule={registerModule} />
      <Recorder
        // index={modules.length + 1}
        setCurrentFile={setCurrentFile}
        setFileIsAudio={setFileIsAudio}
      />
    </div>
  );
}

export default Stack;

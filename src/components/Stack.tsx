"use client";

import { useState } from "react";

import AudioInput from "@/components/AudioInput";
import Recorder from "@/components/Recorder";

import Chain from "./Chain";

function Stack() {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [fileMode, setFileMode] = useState("audio");

  const [input, setInput] = useState(null);
  const [output, setOutput] = useState(null);

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start w-2xl">
      <AudioInput
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        fileIsAudio={fileIsAudio}
        setFileIsAudio={setFileIsAudio}
        fileMode={fileMode}
        setFileMode={setFileMode}
        setInput={setInput}
      />
      <Chain shouldAllowSplitter input={input} output={output} />
      <Recorder
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        setFileIsAudio={setFileIsAudio}
        setOutput={setOutput}
        setFileMode={setFileMode}
      />
    </div>
  );
}

export default Stack;

"use client";

import { useState } from "react";

import AudioInput from "@/components/AudioInput";
import Recorder from "@/components/Recorder";

import Chain from "./Chain";

function Stack() {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);

  const [input, setInput] = useState(null);
  const [output, setOutput] = useState(null);

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start w-2xl">
      <AudioInput
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        fileIsAudio={fileIsAudio}
        setFileIsAudio={setFileIsAudio}
        setInput={setInput}
      />
      <Chain shouldAllowSplitter input={input} output={output} />
      <Recorder
        setCurrentFile={setCurrentFile}
        setFileIsAudio={setFileIsAudio}
        setOutput={setOutput}
      />
    </div>
  );
}

export default Stack;

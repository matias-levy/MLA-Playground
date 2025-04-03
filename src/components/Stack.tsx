"use client";

import { useState } from "react";

import dynamic from "next/dynamic";
import AudioInput from "@/components/AudioInput";

const Recorder = dynamic(() => import("@/components/Recorder"), {
  ssr: false,
});

import Chain from "./Chain";

function Stack() {
  const [currentFile, setCurrentFile] = useState<Blob | null>(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [fileMode, setFileMode] = useState("audio");
  const [downloadedSoundId, setDownloadedSoundId] = useState(-1);

  const [input, setInput] = useState<AudioNode | null>(null);
  const [output, setOutput] = useState<AudioNode | null>(null);

  return (
    <div className="flex flex-col gap-4 row-start-2 w-full">
      <AudioInput
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        fileIsAudio={fileIsAudio}
        setFileIsAudio={setFileIsAudio}
        fileMode={fileMode}
        setFileMode={setFileMode}
        setInput={setInput}
        downloadedSoundId={downloadedSoundId}
        setDownloadedSoundId={setDownloadedSoundId}
      />
      <Chain shouldAllowSplitter input={input} output={output} />
      <Recorder
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        setFileIsAudio={setFileIsAudio}
        setOutput={setOutput}
        setFileMode={setFileMode}
        setDownloadedSoundId={setDownloadedSoundId}
      />
    </div>
  );
}

export default Stack;

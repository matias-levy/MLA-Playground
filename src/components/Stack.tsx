"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";
import dynamic from "next/dynamic";
import AudioInput from "@/components/AudioInput";
import RecorderSkeleton from "./RecorderSkeleton";

const Recorder = dynamic(() => import("@/components/Recorder"), {
  ssr: false,
  loading: () => <RecorderSkeleton />,
});

import Chain from "./Chain";

function Stack() {
  const [currentFile, setCurrentFile] = useState<Blob | null>(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [fileMode, setFileMode] = useState("audio");
  const [downloadedSoundId, setDownloadedSoundId] = useState(-1);
  const [serializedString, setSerializedString] = useState<string | null>(null);
  const chainRef = useRef<any>(null);

  const [input, setInput] = useState<AudioNode | null>(null);
  const [output, setOutput] = useState<AudioNode | null>(null);

  const serialize = async () => {
    const serialized = await chainRef.current.serialize();
    setSerializedString(serialized);
  };

  const deserialize = () => {
    if (!serializedString) return;
    chainRef.current.deserialize(serializedString);
  };

  return (
    <div className="flex flex-col gap-4 row-start-2 w-full">
      <Button onClick={serialize}>Serialize</Button>
      <Button onClick={deserialize}>Deserialize</Button>
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
      <Chain shouldAllowSplitter input={input} output={output} ref={chainRef} />
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

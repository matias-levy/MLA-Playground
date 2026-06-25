"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";
import dynamic from "next/dynamic";
import AudioInput from "@/components/AudioInput";
import RecorderSkeleton from "./RecorderSkeleton";
import {
  serializeBlob,
  deserializeBlob,
  SerializedStack,
} from "@/lib/useSerialiazable";

const Recorder = dynamic(() => import("@/components/Recorder"), {
  ssr: false,
  loading: () => <RecorderSkeleton />,
});

import Chain from "./Chain";
import { FolderOpen, Save } from "lucide-react";
import { toast } from "sonner";

function Stack() {
  const [currentFile, setCurrentFile] = useState<Blob | null>(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [fileMode, setFileMode] = useState("audio");
  const [downloadedSoundId, setDownloadedSoundId] = useState(-1);
  const chainRef = useRef<any>(null);
  const audioInputRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState<AudioNode | null>(null);
  const [output, setOutput] = useState<AudioNode | null>(null);

  const serialize = async () => {
    const internal = await Promise.all([
      audioInputRef.current.serialize(),
      chainRef.current.serialize(),
    ]);
    const serialized: SerializedStack = {
      version: 1,
      createdAt: Date.now(),
      currentFile: currentFile ? await serializeBlob(currentFile) : null,
      fileIsAudio: fileIsAudio,
      fileMode: fileMode,
      audioInput: internal[0],
      chain: internal[1],
    };
    const stringified = JSON.stringify(serialized, null, 2);
    // download the stringified as a file
    const blob = new Blob([stringified], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    const formattedDate = date
      .toISOString()
      .replace(/:/g, "-")
      .split(".")
      .join("");
    a.download = `${formattedDate}.playgroundproject`;
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const deserializeFromFile = async (file: File) => {
    try {
      const deserialized: SerializedStack = JSON.parse(await file.text());
      setCurrentFile(
        deserialized.currentFile
          ? deserializeBlob(deserialized.currentFile)
          : null
      );
      setFileIsAudio(deserialized.fileIsAudio);
      setFileMode(deserialized.fileMode);
      audioInputRef.current.deserialize(deserialized.audioInput);
      chainRef.current.deserialize(deserialized.chain);
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Error loading project file", {
        position: "top-right",
        style: {
          color: "white",
          backgroundColor: "var(--destructive)",
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 row-start-2 w-full">
      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen />
        </Button>
        <Button variant="outline" className="rounded-full" onClick={serialize}>
          <Save />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".playgroundproject"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          deserializeFromFile(file);
          e.target.value = "";
        }}
      />
      <AudioInput
        ref={audioInputRef}
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

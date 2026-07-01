"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import AudioInput from "@/components/AudioInput";
import RecorderSkeleton from "./RecorderSkeleton";
import Snapshots, { type Snapshot, createDefaultSnapshots } from "./Snapshots";
import {
  serializeBlob,
  deserializeBlob,
  SerializedStack,
} from "@/lib/useSerialiazable";
import Header from "./Header";
import { useMidiMap } from "@/lib/useMidiMap";

const Recorder = dynamic(() => import("@/components/Recorder"), {
  ssr: false,
  loading: () => <RecorderSkeleton />,
});

import Chain from "./Chain";
import { toast } from "sonner";
import { getModulesUsedInChain } from "@/utils/utils";

function Stack() {
  const [currentFile, setCurrentFile] = useState<Blob | null>(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [fileMode, setFileMode] = useState("audio");
  const [downloadedSoundId, setDownloadedSoundId] = useState(-1);
  const chainRef = useRef<any>(null);
  const audioInputRef = useRef<any>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(
    createDefaultSnapshots(8)
  );
  const [currentSnapshot, setCurrentSnapshot] = useState(0); // index of snapshots array

  const [input, setInput] = useState<AudioNode | null>(null);
  const [output, setOutput] = useState<AudioNode | null>(null);

  const { mappings, setMappings, snapshotsRef, removeMappingByModuleId } =
    useMidiMap();

  const saveProjectFile = async () => {
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
      snapshots: snapshots,
      midiMappings: mappings ?? undefined,
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

  const openProjectFile = async (file: File) => {
    try {
      const deserialized: SerializedStack = JSON.parse(await file.text());
      setCurrentFile(
        deserialized.currentFile
          ? deserializeBlob(deserialized.currentFile)
          : null
      );
      setFileIsAudio(deserialized.fileIsAudio);
      setFileMode(deserialized.fileMode);
      if (deserialized.snapshots) {
        setSnapshots(deserialized.snapshots);
        snapshotsRef.current = deserialized.snapshots;
      }
      if (deserialized.midiMappings) {
        setMappings(deserialized.midiMappings);
      } else {
        setMappings([]);
      }
      chainRef.current.deserialize(deserialized.chain);
      audioInputRef.current.deserialize(deserialized.audioInput, {
        isFromSnapshot: false,
      });
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("There was an error loading the project file", {
        description: error instanceof Error ? error.message : "Unknown error",
        position: "top-right",
        classNames: {
          toast: "!bg-destructive !text-white",
          description: "!text-white",
        },
      });
    }
  };

  const handleSaveSnapshot = async (snapshot: number) => {
    const internal = await Promise.all([
      audioInputRef.current.serialize(),
      chainRef.current.serialize(),
    ]);
    const chain = internal[1];
    const newSnapshot: Snapshot = {
      isDefaultSnapshot: false,
      content: {
        currentFile: currentFile ? await serializeBlob(currentFile) : null,
        fileIsAudio: fileIsAudio,
        fileMode: fileMode,
        audioInput: internal[0],
        chain: chain,
      },
    };
    // If we are saving a new snapshot, we need to remove the midi mappings from the modules that are not used in the new snapshot
    const modulesUsedInSnapshotBeforeSaving = getModulesUsedInChain(
      snapshots[snapshot].content?.chain ?? []
    );

    const modulesUsedInChainAfterSaving = getModulesUsedInChain(chain);

    // Get the modules that are used in theprevious snapshot but not in the new one
    const modulesToRemove = modulesUsedInSnapshotBeforeSaving.filter(
      (module) => !modulesUsedInChainAfterSaving.some((m) => m.id === module.id)
    );

    const newSnapshots = [...snapshots];
    newSnapshots[snapshot] = newSnapshot;
    snapshotsRef.current = newSnapshots;
    // Remove the mappings for the modules that are not used in the new snapshot
    for (const module of modulesToRemove) {
      removeMappingByModuleId(module.id, newSnapshots);
    }
    setSnapshots(newSnapshots);
  };

  const handleLoadSnapshot = async (snapshotIndex: number) => {
    setCurrentSnapshot(snapshotIndex);
    const snapshot = snapshots[snapshotIndex];
    if (snapshot.isDefaultSnapshot) return;
    if (!snapshot.content) return;
    const { content } = snapshot;
    setCurrentFile(
      content.currentFile ? deserializeBlob(content.currentFile) : null
    );
    setFileIsAudio(content.fileIsAudio);
    setFileMode(content.fileMode);
    chainRef.current.deserialize(content.chain);
    audioInputRef.current.deserialize(content.audioInput, {
      isFromSnapshot: true,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openProjectFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4 row-start-2 w-full">
      <Header
        saveProjectFile={saveProjectFile}
        handleFileChange={handleFileChange}
      />
      <Snapshots
        snapshots={snapshots}
        currentSnapshot={currentSnapshot}
        onSaveSnapshot={handleSaveSnapshot}
        onLoadSnapshot={handleLoadSnapshot}
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

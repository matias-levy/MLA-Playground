"use client";

import { useEffect, useState, useRef } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { Label } from "./ui/label";
import { CircleStop, CirclePlay, Download } from "lucide-react";
import { Button } from "./ui/button";

let chunks = [];

export default function Recorder({ index }: { index: number }) {
  const audioRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const { audioContext: ctx, addNode, removeNode } = useAudioContext();
  const [mediaStreamAudioDestinationNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new MediaStreamAudioDestinationNode(ctx))
  );
  const [mediaRecorder, setMediaRecorder] = useState(null);

  function start() {
    setRecording(true);
    const recorder = new MediaRecorder(mediaStreamAudioDestinationNode.stream);
    setMediaRecorder(recorder);
    recorder.start();
    console.log(recorder);
    chunks = [];
    recorder.ondataavailable = (evt) => {
      // Push each chunk (blobs) in an array
      chunks.push(evt.data);
    };
    recorder.onstop = (evt) => {
      // Make blob out of our blobs, and open it.
      const blob = new Blob(chunks, { type: "audio/wav; codecs=opus" });
      setRecordingBlob(blob);
      audioRef.current.src = URL.createObjectURL(blob);
      console.log(audioRef);
    };
  }

  function stop() {
    console.log(mediaRecorder);
    mediaRecorder.stop();
    setRecording(false);
    console.log(mediaRecorder);
    console.log(audioRef);
  }

  function downloadRecording() {
    if (!recordingBlob) return;

    const date = new Date();
    const formattedDate = date.toISOString().replace(/:/g, "-").split(".")[0]; // Ensures a valid filename
    const filename = `recording-${formattedDate}.wav`;

    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    addNode(mediaStreamAudioDestinationNode, index);

    return () => {
      removeNode(mediaStreamAudioDestinationNode);
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <Label>Recorder</Label>
      <div className="flex flex-row gap-2 justify-between items-stretch">
        <Button className="grow" onClick={start} disabled={recording}>
          Start
          <CirclePlay />
        </Button>
        <Button className="grow" onClick={stop} disabled={!recording}>
          Stop
          <CircleStop />
        </Button>
      </div>
      <div className="flex flex-row justify-between items-center gap-2">
        <audio ref={audioRef} controls className="grow rounded-md" />
        <Button disabled={!recordingBlob} onClick={downloadRecording}>
          <Download />
        </Button>
      </div>
    </div>
  );
}

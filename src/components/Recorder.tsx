"use client";

import { useEffect, useState, useRef, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleStop, CirclePlay, Download, ArrowUpFromDot } from "lucide-react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import {
  MediaRecorder as WavMediaRecorder,
  IMediaRecorder,
  register,
} from "extendable-media-recorder";

import { connect } from "extendable-media-recorder-wav-encoder";

let chunks: Blob[] = [];

export interface RecorderProps {
  currentFile: Blob | null;
  setCurrentFile: React.Dispatch<SetStateAction<Blob | null>>;
  setFileIsAudio: React.Dispatch<SetStateAction<boolean>>;
  setOutput: React.Dispatch<SetStateAction<AudioNode | null>>;
  setFileMode: React.Dispatch<SetStateAction<string>>;
  setDownloadedSoundId: React.Dispatch<SetStateAction<number>>;
}

export default function Recorder({
  currentFile,
  setCurrentFile,
  setFileIsAudio,
  setOutput,
  setFileMode,
  setDownloadedSoundId,
}: RecorderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [recording, setRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const { audioContext: ctx } = useAudioContext();
  const [mediaStreamAudioDestinationNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new MediaStreamAudioDestinationNode(ctx))
  );
  const [mediaRecorder, setMediaRecorder] = useState<IMediaRecorder | null>(
    null
  );

  const [intervalID, setIntervalID] = useState<NodeJS.Timeout | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    async function reg() {
      await register(await connect()).catch((e) => console.log(e));
    }
    reg();
    setOutput(mediaStreamAudioDestinationNode);
  }, []);

  function start() {
    if (mediaStreamAudioDestinationNode) {
      setRecording(true);
      setRecordingDuration(0);
      const inter = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setIntervalID(inter);
      const recorder = new WavMediaRecorder(
        mediaStreamAudioDestinationNode.stream,
        { mimeType: "audio/wav" }
      );
      setMediaRecorder(recorder);
      recorder.start();
      chunks = [];
      recorder.ondataavailable = (evt) => {
        // Push each chunk (blobs) in an array
        chunks.push(evt.data);
      };
      recorder.onstop = () => {
        // Make blob out of our blobs, and open it.
        const blob = new Blob(chunks, { type: "audio/wav" });
        setRecordingBlob(blob);
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob);
        }
      };
    }
  }

  function stop() {
    if (intervalID) {
      clearInterval(intervalID);
      setIntervalID(null);
    }
    mediaRecorder?.stop();
    setRecording(false);
  }

  function downloadRecording() {
    if (!recordingBlob || !(recordingBlob instanceof Blob)) {
      console.error("Invalid recordingBlob");
      return;
    }

    // Ensure the Blob has the correct MIME type
    const wavBlob = new Blob([recordingBlob], { type: "audio/wav" });

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

  function feedbackRecording() {
    if (!recordingBlob) return;
    setCurrentFile(recordingBlob);
    setFileIsAudio(true);
    setFileMode("audio");
    setDownloadedSoundId(-1);
    toast("File loaded successfully");
  }

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl bg-white">
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
        <audio
          ref={audioRef}
          controls
          className="grow rounded-md invert min-w-0"
        />
        <Label className="w-14 text-center block">
          {formatTime(recordingDuration, false)}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled={!recordingBlob} onClick={downloadRecording}>
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download recording</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={!recordingBlob || currentFile == recordingBlob}
                onClick={feedbackRecording}
              >
                <ArrowUpFromDot />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Feedback into file input</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

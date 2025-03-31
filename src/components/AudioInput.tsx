"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertUint8ToFloat32 } from "@/utils/conversion";
import { createSafeAudioNode } from "@/utils/utils";
import { Loader2, CirclePlay, CircleStop } from "lucide-react";
import Waveform from "@/components/Waveform";
import FreeSound from "@/components/FreeSound";
import useFreeSoundQuery from "@/lib/useFreeSoundQuery";
import ParamSlider from "@/components/ParamSlider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import { formatTime } from "@/lib/utils";

export interface AudioInputProps {
  currentFile: Blob | null;
  setCurrentFile: React.Dispatch<SetStateAction<Blob | null>>;
  fileIsAudio: boolean;
  setFileIsAudio: React.Dispatch<SetStateAction<boolean>>;
  setInput: React.Dispatch<SetStateAction<AudioNode | null>>;
  fileMode: string;
  setFileMode: React.Dispatch<SetStateAction<string>>;
  downloadedSoundId: number;
  setDownloadedSoundId: React.Dispatch<SetStateAction<number>>;
}

export default function AudioInput({
  currentFile,
  setCurrentFile,
  fileIsAudio,
  setFileIsAudio,
  setInput,
  fileMode,
  setFileMode,
  downloadedSoundId,
  setDownloadedSoundId,
}: AudioInputProps) {
  // External Input Revelant State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [micNode, setMicNodeNode] = useState<MediaStreamAudioSourceNode | null>(
    null
  );

  // File Relevant State
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBufferNode, setAudioBufferNode] =
    useState<AudioBufferSourceNode | null>(null);
  const [cues, setCues] = useState([0, 100]);
  const [loop, setLoop] = useState(true);
  const [detune, setDetune] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Free Sound Relevant State
  const freeSoundObjectProps = useFreeSoundQuery();

  // General State
  const [selectedTab, setSelectedTab] = useState("File");
  const { audioContext: ctx } = useAudioContext();
  const [gainNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx))
  );
  const [volume, setVolume] = useState(1);

  async function scanDevices() {
    return await navigator.mediaDevices
      .enumerateDevices()
      .then((arraymedia) => {
        const validInputs = arraymedia.filter((info) => {
          return info.kind == "audioinput";
        });
        setDevices(validInputs);
      });
  }

  async function convert(file: Blob | null) {
    if (file) {
      setLoading(true);
      const buff = await file.arrayBuffer();
      switch (fileMode) {
        case "audio":
          ctx.decodeAudioData(buff).then((audio) => {
            setAudioBuffer(audio);
            setLoading(false);
          });
          break;

        case "1byte": {
          const float32 = convertUint8ToFloat32(new Uint8Array(buff), true);
          const myaudioBuffer = ctx.createBuffer(1, float32.length, 44100);
          myaudioBuffer.copyToChannel(float32, 0); // Copy PCM data into buffer
          setAudioBuffer(myaudioBuffer);
          setLoading(false);

          break;
        }

        case "4byte": {
          const float32 = convertUint8ToFloat32(new Uint8Array(buff), false);
          const myaudioBuffer = ctx.createBuffer(1, float32.length, 44100);
          myaudioBuffer.copyToChannel(float32, 0); // Copy PCM data into buffer
          setAudioBuffer(myaudioBuffer);
          setLoading(false);

          break;
        }
        default:
          break;
      }
    }
  }

  useEffect(() => {
    setInput(gainNode);
  }, []);

  useEffect(() => {
    ctx.resume();
    stream?.getTracks().forEach((track) => track.stop()); // Cleanup
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          deviceId: selectedDevice,
        },
      })
      .then((micStream) => {
        setStream(micStream);
        const source = ctx.createMediaStreamSource(micStream);
        setMicNodeNode(source);
        if (audioBufferNode) {
          audioBufferNode.disconnect();
          setPlaying(false);
        }
        if (gainNode) {
          source.connect(gainNode);
        }
      })
      .catch((err) => console.error("Microphone access denied:", err));

    return () => {
      stream?.getTracks().forEach((track) => track.stop()); // Cleanup on unmount
    };
  }, [selectedDevice]);

  useEffect(() => {
    convert(currentFile);
  }, [currentFile, fileMode]);

  useEffect(() => {
    if (playing) {
      restartBufferWithNewLoopPoints(cues[0], cues[1], loop);
    }
  }, [cues, playing, loop]);

  useEffect(() => {
    gainNode?.gain.setValueAtTime(volume, 0);
  }, [volume]);

  const restartBufferWithNewLoopPoints = (
    newStart: number,
    newEnd: number,
    loop: boolean
  ) => {
    if (audioBufferNode) {
      audioBufferNode.disconnect();
    }

    if (audioBuffer && gainNode) {
      const bufferNode = new AudioBufferSourceNode(ctx, {
        buffer: audioBuffer,
      });

      bufferNode.loop = loop;
      bufferNode.loopStart = (audioBuffer.duration * newStart) / 100;
      bufferNode.loopEnd = (audioBuffer.duration * newEnd) / 100;
      bufferNode.detune.setValueAtTime(detune, 0);
      bufferNode.playbackRate.setValueAtTime(playbackRate, 0);
      bufferNode.addEventListener("ended", () => {
        setPlaying(false);
      });
      bufferNode.connect(gainNode);
      bufferNode.start(0, bufferNode.loopStart);
      setAudioBufferNode(bufferNode);
    }
  };

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <Label>Input Module</Label>
      <Tabs
        defaultValue="External"
        className="w-full"
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList className="w-full">
          <TabsTrigger value="External">External</TabsTrigger>
          <TabsTrigger value="File">File</TabsTrigger>
          <TabsTrigger value="FreeSound">FreeSound</TabsTrigger>
        </TabsList>
        <TabsContent value="External">
          <div className="w-full flex flex-col items-stretch gap-5 rounded-3xl mt-4">
            <div className="flex gap-3">
              <Select
                onValueChange={setSelectedDevice}
                value={selectedDevice}
                onOpenChange={scanDevices}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Input" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d, i) => {
                    return (
                      <SelectItem key={i} value={d.deviceId ? d.deviceId : " "}>
                        {d.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <ParamSlider
              name="Volume"
              min={0}
              max={3}
              value={volume}
              defaultValue={1}
              step={0.001}
              setValue={setVolume}
              rep={(volume * 100).toFixed(0) + " %"}
            />
          </div>
        </TabsContent>
        <TabsContent value="File">
          <div className="w-full flex flex-col items-stretch gap-5 rounded-3xl mt-4">
            <div className="flex flex-row gap-6 items-center">
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;

                  const isAudio = file.type.startsWith("audio/");
                  setFileIsAudio(isAudio);

                  // Determine the correct mode before setting the file
                  setFileMode((prevMode) => {
                    if (!isAudio && prevMode === "audio") return "1byte";
                    return isAudio ? "audio" : prevMode;
                  });

                  // Set the file last, so fileMode updates first
                  setDownloadedSoundId(-1);
                  setCurrentFile(file);
                }}
              />
              {loading && <Loader2 className="animate-spin text-gray-400" />}
            </div>
            <div className="flex flex-wrap justify-between">
              <RadioGroup
                defaultValue="audio"
                value={fileMode}
                onValueChange={setFileMode}
                className="flex flex-wrap justify-start gap-x-6 gap-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="audio"
                    id="r1"
                    disabled={!fileIsAudio}
                  />
                  <Label
                    htmlFor="r1"
                    className={!fileIsAudio ? "text-gray-400" : ""}
                  >
                    Audio
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1byte" id="r2" />
                  <Label htmlFor="r2">Raw 1-byte to Float</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4byte" id="r3" />
                  <Label htmlFor="r3">Raw 4-byte to Clamped Float</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="c1"
                    checked={loop}
                    onCheckedChange={(e) => {
                      if (e !== "indeterminate") {
                        setLoop(e);
                      }
                    }}
                  />
                  <Label htmlFor="c1">Loop</Label>
                </div>
              </RadioGroup>
              <Label className="self-end">
                {audioBuffer && formatTime(audioBuffer?.duration)}
              </Label>
            </div>
            {audioBuffer && (
              <>
                <Waveform
                  audioBuffer={audioBuffer}
                  loop={loop}
                  start={cues[0]}
                  end={cues[1]}
                />
                <div className="mt-6 flex flex-row justify-between">
                  <Label>Loop Start and End</Label>
                  <Label>
                    {audioBuffer &&
                      formatTime((audioBuffer.duration * cues[0]) / 100) +
                        " - " +
                        formatTime((audioBuffer.duration * cues[1]) / 100)}
                  </Label>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={0.001}
                  value={cues}
                  defaultValue={[0, 100]}
                  onValueChange={(e) => {
                    setCues(e);
                  }}
                  onDoubleClick={() => {
                    setCues([0, 100]);
                  }}
                />
                <ParamSlider
                  name="Detune"
                  min={-1200}
                  max={1200}
                  value={detune}
                  defaultValue={0}
                  step={0.001}
                  setValue={(e: number) => {
                    setDetune(e);
                    if (audioBufferNode) {
                      audioBufferNode.detune.setValueAtTime(e, 0);
                    }
                  }}
                  rep={detune.toFixed(0) + " cents"}
                />

                <ParamSlider
                  name="Playback Rate"
                  min={0.01}
                  max={4}
                  value={playbackRate}
                  defaultValue={1}
                  step={0.001}
                  setValue={(e: number) => {
                    setPlaybackRate(e);
                    if (audioBufferNode) {
                      audioBufferNode.playbackRate.setValueAtTime(e, 0);
                    }
                  }}
                  rep={(playbackRate * 100).toFixed(0) + "%"}
                />
              </>
            )}

            <div className="flex flex-row gap-2 justify-between items-stretch">
              <Button
                className="grow"
                disabled={playing || !currentFile || loading}
                onClick={() => {
                  if (audioBuffer && gainNode) {
                    ctx.resume();
                    setPlaying(true);
                    const bufferNode = new AudioBufferSourceNode(ctx, {
                      buffer: audioBuffer,
                    });
                    setAudioBufferNode(bufferNode);
                    if (micNode) {
                      micNode.disconnect();
                    }
                    bufferNode.addEventListener("ended", () => {
                      setPlaying(false);
                    });

                    bufferNode.connect(gainNode);
                    // bufferNode.playbackRate.value = 1;
                    bufferNode.loop = loop;
                    bufferNode.loopStart =
                      (audioBuffer.duration * cues[0]) / 100;
                    bufferNode.loopEnd = (audioBuffer.duration * cues[1]) / 100;
                    bufferNode.detune.setValueAtTime(detune, 0);
                    bufferNode.playbackRate.setValueAtTime(playbackRate, 0);
                    bufferNode.start(0, (audioBuffer.duration * cues[0]) / 100);
                  }
                }}
              >
                Start
                <CirclePlay />
              </Button>
              <Button
                className="grow"
                disabled={!playing}
                onClick={() => {
                  setPlaying(false);
                  audioBufferNode?.stop();
                  setAudioBufferNode(null);
                }}
              >
                Stop
                <CircleStop />
              </Button>
            </div>
            <ParamSlider
              name="Volume"
              min={0}
              max={3}
              value={volume}
              defaultValue={1}
              step={0.001}
              setValue={setVolume}
              rep={(volume * 100).toFixed(0) + " %"}
            />
          </div>
        </TabsContent>
        <TabsContent value="FreeSound">
          <FreeSound
            freeSoundObjectProps={freeSoundObjectProps}
            setCurrentFile={setCurrentFile}
            setFileIsAudio={setFileIsAudio}
            setFileMode={setFileMode}
            downloadedSoundId={downloadedSoundId}
            setDownloadedSoundId={setDownloadedSoundId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

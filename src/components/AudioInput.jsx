"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { convertUint8ToFloat32 } from "@/utils/conversion";
import { createSafeAudioNode } from "@/utils/utils";
import { Loader2, CirclePlay, CircleStop } from "lucide-react";
import Waveform from "./Waveform";
import FreeSound from "./FreeSound";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";

export default function AudioInput({
  index,
  currentFile,
  setCurrentFile,
  fileIsAudio,
  setFileIsAudio,
}) {
  // External Input Revelant State
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [micNode, setMicNodeNode] = useState(null);

  // File Relevant State
  const [fileMode, setFileMode] = useState("audio");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioBufferNode, setAudioBufferNode] = useState(null);
  const [cues, setCues] = useState([0, 100]);
  const [loop, setLoop] = useState(true);
  const [detune, setDetune] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // General State
  const [selectedTab, setSelectedTab] = useState("File");
  const { audioContext: ctx, addNode } = useAudioContext();
  const [gainNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx))
  );

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

  async function convert(file) {
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
    addNode(gainNode, index);
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
        source.connect(gainNode);
      })
      .catch((err) => console.error("Microphone access denied:", err));

    return () => {
      stream?.getTracks().forEach((track) => track.stop()); // Cleanup on unmount
    };
  }, [selectedDevice]);

  useEffect(() => {
    convert(currentFile);
  }, [currentFile, fileMode]);

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
            <Label>Volume</Label>
            <Slider
              min={0}
              max={3}
              step={0.001}
              defaultValue={[1]}
              onValueChange={(e) => {
                gainNode.gain.setValueAtTime(e[0], 0);
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="File">
          <div className="w-full flex flex-col items-stretch gap-5 rounded-3xl mt-4">
            <div className="flex flex-row gap-6 items-center">
              <Input
                type="file"
                onChange={(e) => {
                  const isAudio = e.target.files[0].type.startsWith("audio/");
                  setFileIsAudio(isAudio);
                  if (!isAudio) {
                    if (fileMode == "audio") {
                      setFileMode("1byte");
                    }
                  } else {
                    setFileMode("audio");
                  }
                  setCurrentFile(e.target.files[0]);
                }}
              />
              {loading && <Loader2 className="animate-spin text-gray-400" />}
            </div>
            <RadioGroup
              defaultValue="audio"
              value={fileMode}
              onValueChange={setFileMode}
              className="flex flex-row justify-start gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="audio" id="r1" disabled={!fileIsAudio} />
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
                <Label htmlFor="r3">Raw 4-byte to Clamped Float </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="c1" checked={loop} onCheckedChange={setLoop} />
                <Label htmlFor="c1">Loop</Label>
              </div>
            </RadioGroup>
            {audioBuffer && (
              <>
                <Waveform
                  audioBuffer={audioBuffer}
                  loop={loop}
                  start={cues[0]}
                  end={cues[1]}
                />
                <Label>Loop Start and End</Label>
                <Slider
                  min={0}
                  max={100}
                  step={0.001}
                  defaultValue={[0, 100]}
                  onValueChange={(e) => {
                    setCues(e);
                  }}
                />
                <Label>Detune</Label>
                <Slider
                  min={-1200}
                  max={1200}
                  step={0.001}
                  value={[detune]}
                  defaultValue={[0]}
                  onValueChange={(e) => {
                    setDetune(e[0]);
                    if (audioBufferNode) {
                      audioBufferNode.detune.setValueAtTime(e[0], 0);
                    }
                  }}
                />
                <Label>Playback Speed</Label>
                <Slider
                  min={0.01}
                  max={4}
                  step={0.001}
                  defaultValue={[1]}
                  value={[playbackRate]}
                  onValueChange={(e) => {
                    setPlaybackRate(e[0]);
                    if (audioBufferNode) {
                      audioBufferNode.playbackRate.setValueAtTime(e[0], 0);
                    }
                  }}
                />
              </>
            )}

            <div className="flex flex-row gap-2 justify-between items-stretch">
              <Button
                className="grow"
                disabled={playing || !currentFile || loading}
                onClick={() => {
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
                  bufferNode.playbackRate.value = 1;
                  bufferNode.loop = loop;
                  bufferNode.loopStart = (audioBuffer.duration * cues[0]) / 100;
                  bufferNode.loopEnd = (audioBuffer.duration * cues[1]) / 100;
                  bufferNode.detune.setValueAtTime(detune, 0);
                  bufferNode.playbackRate.setValueAtTime(playbackRate, 0);
                  bufferNode.start(0, (audioBuffer.duration * cues[0]) / 100);
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
                  audioBufferNode.stop();
                  setAudioBufferNode(null);
                }}
              >
                Stop
                <CircleStop />
              </Button>
            </div>

            <Label>Volume</Label>
            <Slider
              min={0}
              max={3}
              step={0.001}
              defaultValue={[1]}
              onValueChange={(e) => {
                gainNode.gain.setValueAtTime(e[0], 0);
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="FreeSound">
          <FreeSound
            setCurrentFile={setCurrentFile}
            setFileIsAudio={setFileIsAudio}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

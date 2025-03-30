"use client";

import { useEffect, useState } from "react";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";

export default function AudioInput({
  currentFile,
  setCurrentFile,
  fileIsAudio,
  setFileIsAudio,
  setInput,
  fileMode,
  setFileMode,
}) {
  // External Input Revelant State
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [micNode, setMicNodeNode] = useState(null);

  // File Relevant State
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioBufferNode, setAudioBufferNode] = useState(null);
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
    setInput(gainNode);
    // addNode(gainNode, index);
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

  useEffect(() => {
    if (playing) {
      restartBufferWithNewLoopPoints(cues[0], cues[1], loop);
    }
  }, [cues, playing, loop]);

  useEffect(() => {
    gainNode.gain.setValueAtTime(volume, 0);
  }, [volume]);

  const restartBufferWithNewLoopPoints = (newStart, newEnd, loop) => {
    if (audioBufferNode) {
      audioBufferNode.disconnect();
    }

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
            <Label>Volume</Label>
            <Slider
              min={0}
              max={3}
              step={0.001}
              value={[volume]}
              defaultValue={[1]}
              onValueChange={(e) => {
                setVolume(e[0]);
              }}
              onDoubleClick={() => {
                setVolume(1);
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
                  const file = e.target.files[0];
                  if (!file) return;

                  const isAudio = file.type.startsWith("audio/");
                  setFileIsAudio(isAudio);

                  // Determine the correct mode before setting the file
                  setFileMode((prevMode) => {
                    if (!isAudio && prevMode === "audio") return "1byte";
                    return isAudio ? "audio" : prevMode;
                  });

                  // Set the file last, so fileMode updates first
                  setCurrentFile(file);
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
                  value={cues}
                  defaultValue={[0, 100]}
                  onValueChange={(e) => {
                    setCues(e);
                  }}
                  onDoubleClick={() => {
                    setCues([0, 100]);
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
                  onDoubleClick={() => {
                    setDetune(0);
                    if (audioBufferNode) {
                      audioBufferNode.detune.setValueAtTime(0, 0);
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
                  onDoubleClick={() => {
                    setPlaybackRate(1);
                    if (audioBufferNode) {
                      audioBufferNode.playbackRate.setValueAtTime(1, 0);
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
                  // bufferNode.playbackRate.value = 1;
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
              value={[volume]}
              step={0.001}
              defaultValue={[1]}
              onValueChange={(e) => {
                setVolume(e[0]);
              }}
              onDoubleClick={() => {
                setVolume(1);
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="FreeSound">
          <FreeSound
            freeSoundObjectProps={freeSoundObjectProps}
            setCurrentFile={setCurrentFile}
            setFileIsAudio={setFileIsAudio}
            setFileMode={setFileMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

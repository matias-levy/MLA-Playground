"use client";

import { SetStateAction, useEffect, useState, useCallback } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { RadioGroup } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MappableCheckbox } from "@/components/mappables/MappableCheckbox";
// import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  convertUint8ToFloat32,
  dbToLinear,
  linearToDb,
} from "@/utils/conversion";
import { createSafeAudioNode } from "@/utils/utils";
import { Loader2, CirclePlay, CircleStop } from "lucide-react";
import Waveform from "@/components/Waveform";
import FreeSound from "@/components/FreeSound";
import useFreeSoundQuery from "@/lib/useFreeSoundQuery";
import ParamSlider from "@/components/mappables/MappableParamSlider";
import useSerialiazable from "@/lib/useSerialiazable";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import { formatTime } from "@/lib/utils";
import MappableButton from "@/components/mappables/MappableButton";
import { MappableRadioGroupItem } from "@/components/mappables/MappableRadioGroupItem";

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
  ref: React.RefObject<any>;
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
  ref,
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
  const [selectedTab, setSelectedTab] = useState("External");
  const { audioContext: ctx } = useAudioContext();
  const [gainNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx))
  );
  const [volume, setVolume] = useState(1); //linear volume

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

  const setStreamCallback = useCallback(
    (selectedDevice: string) => {
      ctx.resume();
      setSelectedDevice(selectedDevice);
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
    },
    [ctx, stream, audioBufferNode, gainNode]
  );

  useEffect(() => {
    setStreamCallback(selectedDevice);
    return () => {
      stream?.getTracks().forEach((track) => track.stop()); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    convert(currentFile);
  }, [currentFile, fileMode]);

  const handlePlay = () => {
    if (!currentFile || loading) return;
    setPlaying(true);
    restartBufferWithNewLoopPoints(
      cues[0],
      cues[1],
      loop,
      detune,
      playbackRate
    );
  };

  const handleStop = () => {
    if (!playing) return;
    setPlaying(false);
    audioBufferNode?.stop();
    setAudioBufferNode(null);
  };

  useEffect(() => {
    if (playing && audioBuffer) {
      restartBufferWithNewLoopPoints(
        cues[0],
        cues[1],
        loop,
        detune,
        playbackRate
      );
    }
  }, [cues, playing, loop, audioBuffer]);

  useEffect(() => {
    gainNode?.gain.setValueAtTime(volume, 0);
  }, [volume]);

  const stopPlaying = useCallback(() => {
    setPlaying(false);
  }, [setPlaying]);

  const restartBufferWithNewLoopPoints = (
    newStart: number,
    newEnd: number,
    loop: boolean,
    detune: number,
    playbackRate: number
  ) => {
    if (audioBufferNode) {
      audioBufferNode.removeEventListener("ended", stopPlaying);
      audioBufferNode.disconnect();
    }
    if (micNode) {
      micNode.disconnect();
    }
    if (selectedDevice !== "") {
      setSelectedDevice("");
    }

    if (audioBuffer && gainNode) {
      const bufferNode = new AudioBufferSourceNode(ctx, {
        buffer: audioBuffer,
      });

      const end = (audioBuffer.duration * newEnd) / 100;
      const start = (audioBuffer.duration * newStart) / 100;
      const duration = end - start;
      bufferNode.loop = loop;
      bufferNode.loopStart = start;
      bufferNode.loopEnd = end;
      bufferNode.detune.setValueAtTime(detune, 0);
      bufferNode.playbackRate.setValueAtTime(playbackRate, 0);
      bufferNode.addEventListener("ended", stopPlaying);
      bufferNode.connect(gainNode);
      if (!loop) {
        bufferNode.start(0, start, duration);
      } else {
        bufferNode.start(0, start);
      }
      setAudioBufferNode(bufferNode);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p") {
        handlePlay();
      } else if (e.key === "s") {
        handleStop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePlay, handleStop]);

  useSerialiazable<{ isFromSnapshot: boolean }>({
    ref,
    serialize: async () => {
      return {
        selectedTab,
        selectedDevice,
        playing,
        volume,
        cues,
        loop,
        detune,
        playbackRate,
      };
    },
    deserialize: (data: any, options) => {
      setVolume(data.volume);
      if (options?.isFromSnapshot) {
        setPlaying(data.playing);
      } else {
        handleStop();
      }
      setCues(data.cues);
      setLoop(data.loop);
      setDetune(data.detune);
      setPlaybackRate(data.playbackRate);
      setSelectedTab(data.selectedTab);
      if (
        data.selectedTab === "External" &&
        data.selectedDevice !== selectedDevice
      )
        setStreamCallback(data.selectedDevice);
    },
  });

  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "w-full flex flex-col items-stretch border px-6 py-2 rounded-3xl shadow-xl transition-all bg-card dark:border-card"
      )}
      defaultValue="audio-input"
    >
      <AccordionItem value="audio-input">
        <div className="flex flex-row justify-between items-center gap-4">
          <Label>Input Module</Label>
          <AccordionTrigger />
        </div>
        <AccordionContent className="w-full flex flex-col gap-5 px-1 pt-2">
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
                    onValueChange={setStreamCallback}
                    value={selectedDevice}
                    onOpenChange={scanDevices}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Input" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((d, i) => {
                        return (
                          <SelectItem
                            key={i}
                            value={d.deviceId ? d.deviceId : " "}
                          >
                            {d.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <ParamSlider
                  moduleId="audio-input"
                  moduleName="Audio Input"
                  name="Volume"
                  min={0}
                  max={dbToLinear(24)}
                  value={volume}
                  defaultValue={1}
                  step={0.001}
                  setValue={setVolume}
                  rep={linearToDb(volume).toFixed(1) + " dB"}
                  logScale
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
                  {loading && (
                    <Loader2 className="animate-spin text-gray-400" />
                  )}
                </div>
                <div className="flex flex-wrap justify-between">
                  <RadioGroup
                    defaultValue="audio"
                    value={fileMode}
                    className="flex flex-wrap justify-start gap-x-6 gap-y-4"
                  >
                    <div className="flex items-center space-x-2">
                      <MappableRadioGroupItem
                        moduleId="audio-input"
                        moduleName="Audio Input"
                        paramName="Audio"
                        onAction={() => setFileMode("audio")}
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
                      <MappableRadioGroupItem
                        moduleId="audio-input"
                        moduleName="Audio Input"
                        paramName="1byte"
                        onAction={() => setFileMode("1byte")}
                        value="1byte"
                        id="r2"
                      />
                      <Label htmlFor="r2">Raw 1-byte to Float</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MappableRadioGroupItem
                        moduleId="audio-input"
                        moduleName="Audio Input"
                        paramName="4byte"
                        onAction={() => setFileMode("4byte")}
                        value="4byte"
                        id="r3"
                      />
                      <Label htmlFor="r3">Raw 4-byte to Clamped Float</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MappableCheckbox
                        moduleId="audio-input"
                        moduleName="Audio Input"
                        paramName="Loop"
                        onAction={(checked) => {
                          if (checked !== "indeterminate") setLoop(checked);
                        }}
                        checked={loop}
                        id="c1"
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
                      loop={true}
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
                      moduleId="audio-input"
                      moduleName="Audio Input"
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
                      moduleId="audio-input"
                      moduleName="Audio Input"
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
                  <MappableButton
                    moduleId="audio-input"
                    moduleName="Audio Input"
                    paramName="Play"
                    className="grow"
                    disabled={!currentFile || loading}
                    onAction={handlePlay}
                  >
                    Start
                    <CirclePlay />
                  </MappableButton>
                  <MappableButton
                    moduleId="audio-input"
                    moduleName="Audio Input"
                    paramName="Stop"
                    className="grow"
                    disabled={!playing}
                    onAction={handleStop}
                  >
                    Stop
                    <CircleStop />
                  </MappableButton>
                </div>
                <ParamSlider
                  moduleId="audio-input"
                  moduleName="Audio Input"
                  name="Volume"
                  min={0}
                  max={dbToLinear(24)}
                  value={volume}
                  defaultValue={1}
                  step={0.001}
                  setValue={setVolume}
                  rep={linearToDb(volume).toFixed(1) + " dB"}
                  logScale
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

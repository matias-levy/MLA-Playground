"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

interface IR {
  name: string;
  url: string;
}

const IRs: IR[] = [
  { name: "Cathedral", url: "/IR/Cathedral.flac" },
  { name: "Hall", url: "/IR/Hall.flac" },
  { name: "Long Hall", url: "/IR/Long Hall.flac" },
  { name: "Huge Hall", url: "/IR/Huge Hall.flac" },
  { name: "Compressed Room", url: "/IR/Compressed Room.flac" },
  { name: "Medium Chamber", url: "/IR/Medium Chamber.flac" },
  { name: "Medium Plate", url: "/IR/Medium Plate.flac" },
  { name: "Large Plate", url: "/IR/Large Plate.flac" },
];

const handleTimeChange = (value: number) => {
  return Math.pow(value, 2.5) * 2.5;
};

export default function Convolver({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [time, setTime] = useState(0.5);
  const timeInS = handleTimeChange(time);
  const [feedback, setFeedback] = useState(0);
  const [stretch, setStretch] = useState(1);
  const [stretchCommited, setStretchCommited] = useState(1);
  const [mix, setMix] = useState(0.5);
  const [IRSource, setIRSource] = useState("internal");
  const [selectedInternalIR, setSelectedInternalIR] = useState("Hall 1");
  const [internalIRBlob, setInternalIRBlob] = useState<Blob | null>(null);
  const [uploadedIRBlob, setUploadedIRBlob] = useState<Blob | null>(null);
  const [loadedAudioBuffer, setLoadedAudioBuffer] =
    useState<AudioBuffer | null>(null);

  // Create nodes
  const [convolverNode] = useState(() =>
    createSafeAudioNode(
      ctx,
      (ctx) => new ConvolverNode(ctx, { disableNormalization: false })
    )
  );

  const [delayNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new DelayNode(ctx, { delayTime: 0.5 }))
  );

  const [feedbackGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.3 }))
  );

  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [wetGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [dryGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  useEffect(() => {
    if (
      wetGain &&
      dryGain &&
      outputNode &&
      inputNode &&
      convolverNode &&
      delayNode &&
      feedbackGain
    ) {
      inputNode.connect(convolverNode);
      inputNode.connect(dryGain);
      convolverNode.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(convolverNode);
      convolverNode.connect(wetGain);
      dryGain.connect(outputNode);
      wetGain.connect(outputNode);

      async function loadFirstIR() {
        setSelectedInternalIR(IRs[0].name);
        const url = IRs[0].url;
        const response = await fetch(url); //Blob
        const b = await response.blob();
        setInternalIRBlob(b);
      }

      loadFirstIR();

      addModule({ input: inputNode, output: outputNode }, index);
      return () => {
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    delayNode?.delayTime.setValueAtTime(timeInS, ctx.currentTime);
    feedbackGain?.gain.setValueAtTime(-feedback, ctx.currentTime);
    dryGain?.gain.setValueAtTime(1 - mix, ctx.currentTime);
    wetGain?.gain.setValueAtTime(mix, ctx.currentTime);
  }, [mix, time, feedback]);

  useEffect(() => {
    if (loadedAudioBuffer && convolverNode) {
      const length = loadedAudioBuffer.length / stretchCommited;
      const offlineCtx = new OfflineAudioContext(2, length, ctx.sampleRate);

      const bufferNode = new AudioBufferSourceNode(offlineCtx, {
        buffer: loadedAudioBuffer,
      });

      bufferNode.connect(offlineCtx.destination);
      bufferNode.playbackRate.value = stretchCommited;
      bufferNode.start();
      offlineCtx.startRendering().then((a) => {
        convolverNode.buffer = a;
      });
    }
  }, [stretchCommited, loadedAudioBuffer]);

  useEffect(() => {
    let isCancelled = false;

    async function loadIntoConvolver() {
      if (!convolverNode) return;

      let blobToLoad =
        IRSource === "internal" ? internalIRBlob : uploadedIRBlob;
      if (!blobToLoad) {
        convolverNode.buffer = null;
        return;
      }

      try {
        const arrayBuffer = await blobToLoad.arrayBuffer();
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        setLoadedAudioBuffer(decodedBuffer);

        if (!isCancelled) {
          convolverNode.buffer = decodedBuffer;
        }
      } catch (error) {
        console.error("Error decoding impulse response:", error);
      }
    }

    loadIntoConvolver();

    return () => {
      isCancelled = true; // Prevent setting state if component unmounts
    };
  }, [IRSource, internalIRBlob, uploadedIRBlob, convolverNode, ctx]);

  return (
    <ModuleUI
      index={index}
      name="Reverb / Convolver"
      unregisterModule={unregisterModule}
    >
      <Label>Impulse Response</Label>
      <RadioGroup
        defaultValue="audio"
        value={IRSource}
        onValueChange={setIRSource}
        className="flex justify-start gap-x-6 gap-y-4 flex-wrap"
      >
        <div className="flex flex-row items-center justify-center space-x-2 grow">
          <RadioGroupItem value="internal" id="r1" />
          <Label htmlFor="r1">Internal IR</Label>
          <Select
            onValueChange={async (v) => {
              setSelectedInternalIR(v);

              const url = IRs.find((ir) => ir.name === v)?.url;
              if (url) {
                const response = await fetch(url); //Blob
                const b = await response.blob();
                setInternalIRBlob(b);
              }
            }}
            value={selectedInternalIR}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select IR" />
            </SelectTrigger>
            <SelectContent>
              {IRs.map((IR, i) => {
                return (
                  <SelectItem key={i} value={IR.name}>
                    {IR.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-row items-center justify-center space-x-2 grow">
          <RadioGroupItem value="external" id="r2" />
          <Label htmlFor="r2">External IR</Label>
          <Input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              setUploadedIRBlob(file);
            }}
          />
        </div>
      </RadioGroup>

      {/* Stretch */}
      <div className="flex flex-col gap-5 px-1">
        <div className="flex flex-row justify-between">
          <Label>Stretch IR</Label>
          <Label>{"x " + stretch.toFixed(2)}</Label>
        </div>
        <Slider
          min={0.5}
          max={4}
          step={0.01}
          value={[stretch]}
          defaultValue={[1]}
          onValueChange={(e) => setStretch(e[0])}
          onValueCommit={(e) => {
            setStretch(e[0]);
            setStretchCommited(e[0]);
          }}
          onDoubleClick={() => setStretch(1)}
        />
      </div>

      {/* Feedback Delay Time */}
      <ParamSlider
        name="Feedback Delay Time"
        min={0}
        max={1}
        value={time}
        defaultValue={0.5}
        step={0.001}
        setValue={setTime}
        rep={(timeInS * 1000).toFixed(0) + " ms"}
      />

      {/* Feedback Delay Amount */}
      <ParamSlider
        name="Feedback Delay Amount (Careful with this)"
        min={0}
        max={0.8}
        value={feedback}
        defaultValue={0}
        step={0.01}
        setValue={setFeedback}
        rep={(feedback * 100).toFixed(0) + "%"}
      />

      {/* Mix */}
      <ParamSlider
        name="Mix"
        min={0}
        max={1}
        value={mix}
        defaultValue={0.5}
        step={0.01}
        setValue={setMix}
        rep={
          (100 - mix * 100).toFixed(0) +
          "% dry / " +
          (mix * 100).toFixed(0) +
          "% wet"
        }
      />
    </ModuleUI>
  );
}

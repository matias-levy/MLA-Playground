"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

export default function Delay({
  index,
  unregisterModule,
  addNode,
  removeNode,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // Create nodes
  const [delayNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new DelayNode(ctx, { delayTime: 0.5 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [feedbackGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.3 }))
  );

  const [wetGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [dryGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  useEffect(() => {
    // Connect feedback loop
    inputNode?.connect(delayNode);
    feedbackGain?.connect(delayNode);
    delayNode?.connect(feedbackGain);

    // Connect wet (delayed) signal to mixGain
    delayNode?.connect(wetGain);
    // Dry signal passes through dryGain and merges at mixGain
    inputNode?.connect(dryGain);
    wetGain?.connect(outputNode);
    dryGain?.connect(outputNode);

    // Register module with the main processing chain
    addNode({ input: inputNode, output: outputNode }, index);

    return () => {
      removeNode({ input: inputNode, output: outputNode });
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-row justify-between items-center">
        <Label>Delay</Label>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => unregisterModule(index)}
        >
          <X />
        </Button>
      </div>

      {/* Delay Time */}
      <Label>Delay Time</Label>
      <Slider
        min={0}
        max={2}
        defaultValue={[0.5]}
        step={0.001}
        onValueChange={(e) => {
          delayNode?.delayTime.setValueAtTime(e[0], ctx.currentTime);
        }}
      />

      {/* Feedback */}
      <Label>Feedback</Label>
      <Slider
        min={0}
        max={1.2}
        defaultValue={[0.3]}
        step={0.01}
        onValueChange={(e) => {
          feedbackGain?.gain.setValueAtTime(e[0], ctx.currentTime);
        }}
      />

      {/* Mix */}
      <Label>Mix</Label>
      <Slider
        min={0}
        max={1}
        defaultValue={[0.5]}
        step={0.01}
        onValueChange={(e) => {
          const mix = e[0];
          dryGain?.gain.setValueAtTime(1 - mix, ctx.currentTime);
          wetGain?.gain.setValueAtTime(mix, ctx.currentTime);
        }}
      />
    </div>
  );
}

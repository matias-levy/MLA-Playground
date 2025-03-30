"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";

export default function Delay({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  //UI Params
  const [time, setTime] = useState(0.5);
  const [feedback, setFeedback] = useState(0.3);
  const [mix, setMix] = useState(0.5);

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
    if (
      inputNode &&
      delayNode &&
      feedbackGain &&
      wetGain &&
      dryGain &&
      outputNode
    ) {
      // Connect feedback loop
      inputNode.connect(delayNode);
      feedbackGain.connect(delayNode);
      delayNode.connect(feedbackGain);

      // Connect wet (delayed) signal to mixGain
      delayNode.connect(wetGain);
      // Dry signal passes through dryGain and merges at mixGain
      inputNode.connect(dryGain);
      wetGain.connect(outputNode);
      dryGain.connect(outputNode);
      // Register module with the main processing chain
      addModule({ input: inputNode, output: outputNode }, index);
      return () => {
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    delayNode?.delayTime.setValueAtTime(time, ctx.currentTime);
    feedbackGain?.gain.setValueAtTime(feedback, ctx.currentTime);
    dryGain?.gain.setValueAtTime(1 - mix, ctx.currentTime);
    wetGain?.gain.setValueAtTime(mix, ctx.currentTime);
  }, [time, feedback, mix]);

  return (
    <ModuleUI index={index} name="Delay" unregisterModule={unregisterModule}>
      {/* Delay Time */}
      <Label>Delay Time</Label>
      <Slider
        min={0}
        max={2}
        value={[time]}
        defaultValue={[0.5]}
        step={0.001}
        onValueChange={(e) => {
          setTime(e[0]);
        }}
        onDoubleClick={() => {
          setTime(0.5);
        }}
      />

      {/* Feedback */}
      <Label>Feedback</Label>
      <Slider
        min={0}
        max={1.2}
        value={[feedback]}
        defaultValue={[0.3]}
        step={0.01}
        onValueChange={(e) => {
          setFeedback(e[0]);
        }}
        onDoubleClick={() => {
          setFeedback(0.3);
        }}
      />

      {/* Mix */}
      <Label>Mix</Label>
      <Slider
        min={0}
        max={1}
        value={[mix]}
        defaultValue={[0.5]}
        step={0.01}
        onValueChange={(e) => {
          setMix(e[0]);
        }}
        onDoubleClick={() => {
          setMix(0.5);
        }}
      />
    </ModuleUI>
  );
}

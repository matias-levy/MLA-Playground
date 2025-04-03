"use client";

import { useEffect, useState, useRef } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import useBypass from "@/lib/useBypass";
import { Label } from "@/components/ui/label";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";

export default function AutoPan({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [frequency, setFrequency] = useState(5);
  const [depth, setDepth] = useState(0.5);
  const [waveform, setWaveform] = useState<OscillatorType>("sine");
  const lfoStarted = useRef(false);
  const [offset, setOffset] = useState(0);

  // Create nodes
  const [lfo] = useState(() =>
    createSafeAudioNode(
      ctx,
      (ctx) => new OscillatorNode(ctx, { frequency: 5, type: "sine" })
    )
  );

  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [lfoGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
  );

  const [inputPanNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new StereoPannerNode(ctx, { pan: 0 }))
  );

  const [panNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new StereoPannerNode(ctx, { pan: 0 }))
  );

  // Bypass Hook

  const { bypass, toggleBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [inputPanNode],
    connectedToOutput: [panNode],
  });

  useEffect(() => {
    if (lfo && lfoGain && panNode && inputPanNode && inputNode && outputNode) {
      inputNode.connect(inputPanNode);
      inputPanNode.connect(panNode);
      lfo.connect(lfoGain);
      lfoGain.connect(panNode.pan);
      panNode.connect(outputNode);

      addModule({ input: inputNode, output: outputNode }, index);

      if (!lfoStarted.current) {
        lfo.start();
        lfoStarted.current = true;
      }

      return () => {
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    lfo?.frequency.setValueAtTime(frequency, ctx.currentTime);
    lfoGain?.gain.setValueAtTime(depth, ctx.currentTime);
    inputPanNode?.pan.setValueAtTime(offset, ctx.currentTime);
  }, [frequency, depth, offset]);

  useEffect(() => {
    if (lfo) {
      lfo.type = waveform;
    }
  }, [waveform]);

  return (
    <ModuleUI
      index={index}
      name="Auto Pan"
      unregisterModule={unregisterModule}
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      {/* Offset */}
      <ParamSlider
        name="Offset"
        min={-1}
        max={1}
        value={offset}
        defaultValue={0}
        step={0.01}
        setValue={setOffset}
        rep={offset.toFixed(2)}
      />
      {/* Frequency */}
      <ParamSlider
        name="Frequency"
        defaultValue={5}
        step={0.1}
        min={0.1}
        max={60}
        value={frequency}
        setValue={setFrequency}
        rep={frequency.toFixed(1) + " Hz"}
      />

      {/* Depth */}
      <ParamSlider
        name="Depth"
        min={-1}
        max={1}
        value={depth}
        defaultValue={0.5}
        step={0.01}
        setValue={setDepth}
        rep={depth.toFixed(2)}
      />

      {/* Waveform Selection */}
      <Label>Waveform</Label>
      <RadioGroup
        className="flex flex-wrap"
        value={waveform}
        onValueChange={(value) => setWaveform(value as OscillatorType)}
      >
        <RadioGroupItem value="sine" />
        <Label>Sine</Label>
        <RadioGroupItem value="square" />
        <Label>Square</Label>
        <RadioGroupItem value="sawtooth" />
        <Label>Sawtooth</Label>
        <RadioGroupItem value="triangle" />
        <Label>Triangle</Label>
      </RadioGroup>
    </ModuleUI>
  );
}

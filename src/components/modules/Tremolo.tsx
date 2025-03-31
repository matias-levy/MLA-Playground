"use client";

import { useEffect, useState, useRef } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Label } from "@/components/ui/label";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";

export default function Tremolo({
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

  // Create nodes
  const [lfo] = useState(() =>
    createSafeAudioNode(
      ctx,
      (ctx) => new OscillatorNode(ctx, { frequency: 5, type: "sine" })
    )
  );

  const [lfoGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
  );

  const [tremoloGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  useEffect(() => {
    if (lfo && lfoGain && tremoloGain) {
      lfo.connect(lfoGain);
      lfoGain.connect(tremoloGain.gain);

      addModule({ input: tremoloGain, output: tremoloGain }, index);

      if (!lfoStarted.current) {
        lfo.start();
        lfoStarted.current = true;
      }

      return () => {
        removeModule({ input: tremoloGain, output: tremoloGain });
      };
    }
  }, [index]);

  useEffect(() => {
    lfo?.frequency.setValueAtTime(frequency, ctx.currentTime);
    lfoGain?.gain.setValueAtTime(depth, ctx.currentTime);
  }, [frequency, depth]);

  useEffect(() => {
    if (lfo) {
      lfo.type = waveform;
    }
  }, [waveform]);

  return (
    <ModuleUI index={index} name="Tremolo" unregisterModule={unregisterModule}>
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
        min={0}
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

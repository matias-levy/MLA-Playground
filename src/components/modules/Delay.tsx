"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function Delay({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [time, setTime] = useState(0.5);
  const [feedback, setFeedback] = useState(0.3);
  const [mix, setMix] = useState(0.5);
  const [lfoRate, setLfoRate] = useState(0.2);
  const [lfoDepth, setLfoDepth] = useState(0.002);
  const [waveform, setWaveform] = useState("sine");
  const lfoStarted = useRef(false);

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

  const [lfo] = useState(() =>
    createSafeAudioNode(
      ctx,
      (ctx) => new OscillatorNode(ctx, { frequency: 0.2 })
    )
  );

  const [lfoGain] = useState(
    () => createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.002 })) // Small modulation depth
  );

  useEffect(() => {
    if (
      inputNode &&
      delayNode &&
      feedbackGain &&
      wetGain &&
      dryGain &&
      outputNode &&
      lfo &&
      lfoGain
    ) {
      inputNode.connect(delayNode);
      feedbackGain.connect(delayNode);
      delayNode.connect(feedbackGain);

      delayNode.connect(wetGain);
      inputNode.connect(dryGain);
      wetGain.connect(outputNode);
      dryGain.connect(outputNode);

      lfo.connect(lfoGain);
      lfoGain.connect(delayNode.delayTime);

      if (!lfoStarted.current) {
        lfo.start();
        lfoStarted.current = true;
      }

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
    lfo?.frequency.setValueAtTime(lfoRate, ctx.currentTime);
    lfoGain?.gain.setValueAtTime(lfoDepth, ctx.currentTime);
    if (lfo) {
      lfo.type = waveform as OscillatorType;
    }
  }, [time, feedback, mix, lfoRate, lfoDepth, waveform]);

  return (
    <ModuleUI index={index} name="Delay" unregisterModule={unregisterModule}>
      {/* Delay Time */}
      <ParamSlider
        name="Time"
        min={0}
        max={2}
        value={time}
        defaultValue={0.5}
        step={0.001}
        setValue={setTime}
        rep={(time * 1000).toFixed(0) + " ms"}
      />

      {/* Feedback */}
      <ParamSlider
        name="Feedback"
        min={0}
        max={1.2}
        value={feedback}
        defaultValue={0.3}
        step={0.01}
        setValue={setFeedback}
        rep={(feedback * 100).toFixed(0) + "%"}
      />

      {/* LFO Rate */}
      <ParamSlider
        name="LFO Rate"
        min={0.1}
        max={10}
        value={lfoRate}
        defaultValue={0.2}
        step={0.1}
        setValue={setLfoRate}
        rep={lfoRate.toFixed(1) + " Hz"}
      />

      {/* LFO Depth */}
      <ParamSlider
        name="LFO Depth"
        min={0}
        max={0.01}
        value={lfoDepth}
        defaultValue={0.002}
        step={0.0001}
        setValue={setLfoDepth}
        rep={(lfoDepth * 1000).toFixed(1) + " ms"}
      />

      {/* LFO Waveform */}
      <Label>LFO Waveform</Label>
      <RadioGroup
        value={waveform}
        onValueChange={setWaveform}
        className="flex flex-wrap"
      >
        {["sine", "square", "sawtooth", "triangle"].map((wave) => (
          <div key={wave} className="flex flex-row gap-2">
            <RadioGroupItem value={wave} />
            <Label>{wave.charAt(0).toUpperCase() + wave.slice(1)}</Label>
          </div>
        ))}
      </RadioGroup>

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

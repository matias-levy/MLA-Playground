"use client";

import { useEffect, useState, useRef } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Label } from "@/components/ui/label";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { Checkbox } from "@/components/ui/checkbox";

const handleTimeChange = (value: number) => {
  // Apply exponential scaling for better low-end resolution
  return Math.pow(
    10,
    value * (Math.log10(20000) - Math.log10(10)) + Math.log10(10)
  );
};

export default function Filter({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [frequency, setFrequency] = useState(0.2); //0 to 1

  const frequencyInHz = handleTimeChange(frequency);

  const [q, setQ] = useState(0);
  const [gain, setGain] = useState(0);
  const [lfoFrequency, setLfoFrequency] = useState(0.5);
  const [filterType, setFilterType] = useState("lowpass");
  const [depth, setDepth] = useState(0);
  const [waveform, setWaveform] = useState("sine");
  const lfoStarted = useRef(false);

  const [is24db, setIs24db] = useState(false);

  // Create nodes
  const [lfo] = useState(() =>
    createSafeAudioNode(
      ctx,
      (ctx) => new OscillatorNode(ctx, { frequency: 5, type: "sine" })
    )
  );

  const [preLFOGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 2400 }))
  );

  const [lfoGain] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0 }))
  );

  const [filterNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new BiquadFilterNode(ctx))
  );

  const [filterNode2] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new BiquadFilterNode(ctx))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  useEffect(() => {
    if (
      lfo &&
      preLFOGain &&
      lfoGain &&
      filterNode &&
      filterNode2 &&
      outputNode
    ) {
      lfo.connect(preLFOGain);
      preLFOGain.connect(lfoGain);
      lfoGain.connect(filterNode.detune);
      lfoGain.connect(filterNode2.detune);
      filterNode.connect(outputNode);

      addModule({ input: filterNode, output: outputNode }, index);

      if (!lfoStarted.current) {
        lfo.start();
        lfoStarted.current = true;
      }

      return () => {
        removeModule({ input: filterNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    filterNode?.frequency.setValueAtTime(frequencyInHz, ctx.currentTime);
    filterNode?.Q.setValueAtTime(q, ctx.currentTime);
    filterNode?.gain.setValueAtTime(gain, ctx.currentTime);
    filterNode2?.frequency.setValueAtTime(frequencyInHz, ctx.currentTime);
    filterNode2?.Q.setValueAtTime(q, ctx.currentTime);
    filterNode2?.gain.setValueAtTime(gain, ctx.currentTime);
    lfo?.frequency.setValueAtTime(lfoFrequency, ctx.currentTime);
    lfoGain?.gain.setValueAtTime(depth, ctx.currentTime);
  }, [frequencyInHz, q, gain, lfoFrequency, depth]);

  useEffect(() => {
    if (lfo && filterNode && filterNode2 && outputNode) {
      lfo.type = waveform as OscillatorType;
      filterNode.type = filterType as BiquadFilterType;
      filterNode2.type = filterType as BiquadFilterType;

      if (is24db) {
        filterNode.disconnect();
        filterNode.connect(filterNode2);
        filterNode2.connect(outputNode);
      } else {
        filterNode2.disconnect();
        filterNode.connect(outputNode);
      }
    }
  }, [waveform, filterType, is24db]);

  return (
    <ModuleUI index={index} name="Filter" unregisterModule={unregisterModule}>
      {/* Frequency */}
      <ParamSlider
        name="Frequency"
        defaultValue={0.2}
        step={0.000001}
        min={0}
        max={1}
        value={frequency}
        setValue={setFrequency}
        rep={frequencyInHz.toFixed(1) + " Hz"}
      />

      {/* Q */}
      <ParamSlider
        name="Q"
        defaultValue={0}
        step={0.1}
        min={0}
        max={36}
        value={q}
        setValue={setQ}
        rep={q.toFixed(0) + " db"}
      />

      {/* Gain */}
      <ParamSlider
        name="Gain"
        defaultValue={0}
        step={0.1}
        min={-40}
        max={40}
        value={gain}
        setValue={setGain}
        rep={gain.toFixed(1) + " dB"}
      />

      {/* Filter Type */}
      <Label>Filter Type</Label>
      <RadioGroup
        value={filterType}
        onValueChange={setFilterType}
        className="flex flex-wrap"
      >
        {[
          "lowpass",
          "highpass",
          "bandpass",
          "lowshelf",
          "highshelf",
          "peaking",
          "notch",
          "allpass",
        ].map((wave) => (
          <div key={wave} className="flex flex-row gap-2">
            <RadioGroupItem value={wave} />
            <Label>{wave.charAt(0).toUpperCase() + wave.slice(1)}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="c1"
            checked={is24db}
            onCheckedChange={(e) => {
              if (e !== "indeterminate") {
                setIs24db(e);
              }
            }}
          />
          <Label htmlFor="c1">24dB/Oct</Label>
        </div>
      </RadioGroup>

      {/* LFO Rate */}
      <ParamSlider
        name="LFO Rate"
        defaultValue={0.5}
        step={0.1}
        min={0.1}
        max={60}
        value={lfoFrequency}
        setValue={setLfoFrequency}
        rep={lfoFrequency.toFixed(1) + " Hz"}
      />

      {/* LFO Depth */}
      <ParamSlider
        name="LFO Depth"
        min={-1}
        max={1}
        value={depth}
        defaultValue={0}
        step={0.01}
        setValue={setDepth}
        rep={depth.toFixed(2)}
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
    </ModuleUI>
  );
}

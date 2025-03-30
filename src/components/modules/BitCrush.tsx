"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

import ModuleUI from "@/components/ModuleUI";

export default function BitCrush({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();
  const [bits, setBits] = useState(31); // Start at "max" since we are reversing
  const [sampleRate, setSampleRate] = useState(0);

  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    // Load the AudioWorklet
    async function loadAudioWorklet() {
      await ctx.audioWorklet.addModule("worklets/bit-crush-processor.js");
      const newNode = new AudioWorkletNode(ctx, "bit-crush-processor");
      workletNodeRef.current = newNode; // Update ref instead of state
      addModule({ input: newNode, output: newNode }, index);
    }
    loadAudioWorklet();

    return () => {
      if (workletNodeRef.current) {
        removeModule({
          input: workletNodeRef.current,
          output: workletNodeRef.current,
        });
      }
    };
  }, [index]);

  useEffect(() => {
    workletNodeRef.current?.parameters
      .get("reduction")
      ?.setValueAtTime(sampleRate, 0);

    workletNodeRef.current?.parameters.get("bits")?.setValueAtTime(bits, 0);
  }, [bits, sampleRate]);

  return (
    <ModuleUI
      index={index}
      name="Bit Crush"
      unregisterModule={unregisterModule}
    >
      <Label>Sample Rate Reduction</Label>
      <Slider
        min={0}
        max={88}
        defaultValue={[0]}
        value={[sampleRate]}
        step={0.001}
        onValueChange={(e) => {
          ctx.resume();
          setSampleRate(e[0]);
        }}
        onDoubleClick={() => {
          setSampleRate(0);
        }}
      />
      <Label>Bit Reduction</Label>
      <Slider
        min={1}
        max={31}
        value={[31 - bits]}
        defaultValue={[31]}
        step={1}
        onValueChange={(e) => {
          ctx.resume();
          setBits(32 - e[0]);
        }}
        onDoubleClick={() => {
          setBits(31);
        }}
      />
    </ModuleUI>
  );
}

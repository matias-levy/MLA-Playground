"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";
import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { createSafeAudioNode } from "@/utils/utils";
import useBypass from "@/lib/useBypass";

export default function BitCrush({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();
  const [bits, setBits] = useState(31); // Start at "max" since we are reversing
  const [sampleRate, setSampleRate] = useState(0);

  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  // Bypass Hook

  const { bypass, toggleBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [workletNodeRef.current],
    connectedToOutput: [workletNodeRef.current],
  });

  useEffect(() => {
    // Load the AudioWorklet
    async function loadAudioWorklet() {
      if (inputNode && outputNode) {
        await ctx.audioWorklet.addModule("worklets/bit-crush-processor.js");
        const newNode = new AudioWorkletNode(ctx, "bit-crush-processor");
        workletNodeRef.current = newNode; // Update ref instead of state
        inputNode.connect(workletNodeRef.current);
        workletNodeRef.current.connect(outputNode);
        addModule({ input: inputNode, output: outputNode }, index);
      }
    }
    loadAudioWorklet();

    return () => {
      if (inputNode && outputNode) {
        removeModule({
          input: inputNode,
          output: outputNode,
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
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      <ParamSlider
        name="Sample Rate Reduction"
        min={0}
        max={88}
        defaultValue={0}
        value={sampleRate}
        step={0.001}
        setValue={setSampleRate}
        rep={(ctx.sampleRate / (sampleRate + 1)).toFixed(0) + " Hz"}
      />
      <ParamSlider
        name="Bit Reduction"
        min={1}
        max={31}
        value={31 - bits}
        defaultValue={31}
        step={1}
        setValue={(e: number) => {
          setBits(32 - e);
        }}
        rep={bits + " bits"}
      />
    </ModuleUI>
  );
}

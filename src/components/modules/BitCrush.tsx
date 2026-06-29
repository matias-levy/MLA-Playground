"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";
import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { createSafeAudioNode } from "@/utils/utils";
import useBypass from "@/lib/useBypass";
import useSerialiazable, { safeNumber } from "@/lib/useSerialiazable";

export default function BitCrush({
  index,
  moduleId,
  ref,
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

  const [workletNode, setWorkletNode] = useState<AudioWorkletNode | null>(null);

  // Bypass Hook

  const { bypass, setBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [workletNode],
    connectedToOutput: [workletNode],
  });

  useEffect(() => {
    // Load the AudioWorklet
    async function loadAudioWorklet() {
      if (inputNode && outputNode) {
        await ctx.audioWorklet.addModule("worklets/bit-crush-processor.js");
        const newNode = new AudioWorkletNode(ctx, "bit-crush-processor");
        inputNode.connect(newNode);
        newNode.connect(outputNode);
        setWorkletNode(newNode);
        addModule({ input: inputNode, output: outputNode }, index);
      }
    }
    loadAudioWorklet();

    return () => {
      setWorkletNode(null);
      if (inputNode && outputNode) {
        removeModule({
          input: inputNode,
          output: outputNode,
        });
      }
    };
  }, [index]);

  useEffect(() => {
    if (!workletNode) return;

    workletNode.parameters
      .get("reduction")
      ?.setValueAtTime(sampleRate, ctx.currentTime);
    workletNode.parameters.get("bits")?.setValueAtTime(bits, ctx.currentTime);
  }, [bits, sampleRate, workletNode]);

  useSerialiazable({
    ref,
    serialize: () => {
      return {
        module: "Bit Crush",
        bypass: Boolean(bypass),
        sampleRate: safeNumber(sampleRate),
        bits: safeNumber(bits),
      };
    },
    deserialize: (data: any) => {
      setBypass(Boolean(data.bypass));
      setSampleRate(safeNumber(data.sampleRate));
      setBits(safeNumber(data.bits));
    },
  });

  return (
    <ModuleUI
      moduleId={moduleId}
      index={index}
      name="Bit Crush"
      unregisterModule={unregisterModule}
      bypass={bypass}
      setBypass={setBypass}
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

"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import useBypass from "@/lib/useBypass";

export default function Utility({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [gain, setGain] = useState(1);
  const [pan, setPan] = useState(0);

  // Create nodes
  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [gainNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [panNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new StereoPannerNode(ctx, { pan: 0 }))
  );

  // Bypass Hook

  const { bypass, toggleBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [gainNode],
    connectedToOutput: [panNode],
  });

  useEffect(() => {
    if (inputNode && outputNode && gainNode && panNode) {
      inputNode.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(outputNode);
      addModule({ input: inputNode, output: outputNode }, index);
      return () => {
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    gainNode?.gain.setValueAtTime(gain, ctx.currentTime);
    panNode?.pan.setValueAtTime(pan, ctx.currentTime);
  }, [gain, pan]);

  return (
    <ModuleUI
      index={index}
      name="Utility"
      unregisterModule={unregisterModule}
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      {/* Gain */}
      <ParamSlider
        name="Gain"
        min={0}
        max={3}
        value={gain}
        defaultValue={1}
        step={0.001}
        setValue={setGain}
        rep={(gain * 100).toFixed(0) + " %"}
      />

      {/* Pan */}
      <ParamSlider
        name="Pan"
        min={-1}
        max={1}
        value={pan}
        defaultValue={0}
        step={0.01}
        setValue={setPan}
        rep={pan.toFixed(2)}
      />
    </ModuleUI>
  );
}

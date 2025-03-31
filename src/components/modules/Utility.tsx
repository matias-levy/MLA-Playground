"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";

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
  const [gainNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [panNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new StereoPannerNode(ctx, { pan: 0 }))
  );

  useEffect(() => {
    if (gainNode && panNode) {
      gainNode.connect(panNode);
      addModule({ input: gainNode, output: panNode }, index);
      return () => {
        removeModule({ input: gainNode, output: panNode });
      };
    }
  }, [index]);

  useEffect(() => {
    gainNode?.gain.setValueAtTime(gain, ctx.currentTime);
    panNode?.pan.setValueAtTime(pan, ctx.currentTime);
  }, [gain, pan]);

  return (
    <ModuleUI index={index} name="Utility" unregisterModule={unregisterModule}>
      {/* Delay Time */}
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

      {/* Feedback */}
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

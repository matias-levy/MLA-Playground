"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import useBypass from "@/lib/useBypass";
import useSerialiazable, { safeNumber } from "@/lib/useSerialiazable";
import { dbToLinear, linearToDb } from "@/utils/conversion";

export default function Utility({
  index,
  moduleId,
  ref,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [gain, setGain] = useState(1); //linear gain
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

  const { bypass, setBypass } = useBypass({
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

  useSerialiazable({
    ref,
    serialize: () => {
      return {
        module: "Utility",
        bypass: Boolean(bypass),
        gain: safeNumber(gain),
        pan: safeNumber(pan),
      };
    },
    deserialize: (data: any) => {
      setBypass(Boolean(data.bypass));
      setGain(safeNumber(data.gain));
      setPan(safeNumber(data.pan));
    },
  });

  return (
    <ModuleUI
      moduleId={moduleId}
      index={index}
      name="Utility"
      unregisterModule={unregisterModule}
      bypass={bypass}
      setBypass={setBypass}
    >
      {/* Gain */}
      <ParamSlider
        moduleId={moduleId}
        moduleName="Utility"
        name="Gain"
        min={0}
        max={dbToLinear(24)}
        value={gain}
        defaultValue={1}
        step={0.001}
        setValue={setGain}
        rep={linearToDb(gain).toFixed(1) + " dB"}
        logScale
      />

      {/* Pan */}
      <ParamSlider
        moduleId={moduleId}
        moduleName="Utility"
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

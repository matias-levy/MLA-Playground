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

export default function Compressor({
  index,
  ref,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [threshold, setThreshold] = useState(-24);
  const [knee, setKnee] = useState(30);
  const [ratio, setRatio] = useState(12);
  const [attack, setAttack] = useState(0.003);
  const [release, setRelease] = useState(0.25);
  const [makeup, setMakeup] = useState(1); //linear gain

  const [currentReduction, setCurrentReduction] = useState(1);

  // Create nodes

  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [compressorNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new DynamicsCompressorNode(ctx))
  );

  const [gainNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  // Bypass Hook

  const { bypass, toggleBypass, setBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [compressorNode],
    connectedToOutput: [gainNode],
  });

  useEffect(() => {
    if (gainNode && compressorNode && inputNode && outputNode) {
      inputNode.connect(compressorNode);
      compressorNode.connect(gainNode);
      gainNode.connect(outputNode);

      const interval = setInterval(() => {
        setCurrentReduction(compressorNode.reduction);
      }, 100);

      addModule({ input: inputNode, output: outputNode }, index);
      return () => {
        clearInterval(interval);
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    compressorNode?.threshold.setValueAtTime(threshold, ctx.currentTime);
    compressorNode?.knee.setValueAtTime(knee, ctx.currentTime);
    compressorNode?.ratio.setValueAtTime(ratio, ctx.currentTime);
    compressorNode?.attack.setValueAtTime(attack, ctx.currentTime);
    compressorNode?.release.setValueAtTime(release, ctx.currentTime);
    gainNode?.gain.setValueAtTime(makeup, ctx.currentTime);
  }, [threshold, knee, ratio, attack, release, makeup]);

  useSerialiazable({
    ref,
    serialize: () => {
      return {
        module: "Compressor",
        bypass: Boolean(bypass),
        threshold: safeNumber(threshold),
        knee: safeNumber(knee),
        ratio: safeNumber(ratio),
        attack: safeNumber(attack),
        release: safeNumber(release),
        makeup: safeNumber(makeup),
      };
    },
    deserialize: (data: any) => {
      setBypass(Boolean(data.bypass));
      setThreshold(safeNumber(data.threshold));
      setKnee(safeNumber(data.knee));
      setRatio(safeNumber(data.ratio));
      setAttack(safeNumber(data.attack));
      setRelease(safeNumber(data.release));
      setMakeup(safeNumber(data.makeup));
    },
  });

  return (
    <ModuleUI
      index={index}
      name="Compressor"
      unregisterModule={unregisterModule}
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      {/* Threshold */}
      <ParamSlider
        name="Threshold"
        min={-100}
        max={0}
        value={threshold}
        defaultValue={-24}
        step={0.001}
        setValue={setThreshold}
        rep={threshold.toFixed(1) + "dB"}
      />

      {/* Ratio */}
      <ParamSlider
        name="Ratio / Reduction"
        min={1}
        max={20}
        value={ratio}
        defaultValue={12}
        step={0.001}
        setValue={setRatio}
        rep={currentReduction.toFixed(0) + " dB / " + ratio.toFixed(1) + ":1"}
      />

      {/* Attack */}
      <ParamSlider
        name="Attack"
        min={0}
        max={1}
        value={attack}
        defaultValue={0.003}
        step={0.001}
        setValue={setAttack}
        rep={(attack * 1000).toFixed(0) + " ms"}
      />

      {/* Release */}
      <ParamSlider
        name="Release"
        min={0}
        max={1}
        value={release}
        defaultValue={0.25}
        step={0.001}
        setValue={setRelease}
        rep={(release * 1000).toFixed(0) + " ms"}
      />

      {/* Knee */}
      <ParamSlider
        name="Knee"
        min={0}
        max={40}
        value={knee}
        defaultValue={30}
        step={0.001}
        setValue={setKnee}
        rep={knee.toFixed(1) + " dB"}
      />

      {/* Output Gain */}
      <ParamSlider
        name="Output Gain"
        min={0}
        max={dbToLinear(24)}
        value={makeup}
        defaultValue={1}
        step={0.001}
        setValue={setMakeup}
        rep={linearToDb(makeup).toFixed(1) + " dB"}
        logScale
      />
    </ModuleUI>
  );
}

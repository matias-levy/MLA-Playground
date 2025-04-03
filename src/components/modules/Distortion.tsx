"use client";

import { useEffect, useState } from "react";
import { createSafeAudioNode } from "@/utils/utils";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import useBypass from "@/lib/useBypass";

function makeDistortionCurve(amount: number) {
  const k = typeof amount === "number" ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; i++) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export default function Distortion({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();
  const [distortion, setDistortion] = useState(100);

  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [waveshaperNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new WaveShaperNode(ctx))
  );

  // Bypass Hook

  const { bypass, toggleBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [waveshaperNode],
    connectedToOutput: [waveshaperNode],
  });

  useEffect(() => {
    if (inputNode && outputNode && waveshaperNode) {
      inputNode.connect(waveshaperNode);
      waveshaperNode.connect(outputNode);
      addModule({ input: inputNode, output: outputNode }, index);
      return () => {
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    if (waveshaperNode) {
      const curve = makeDistortionCurve(distortion);
      waveshaperNode.curve = curve;
    }
  }, [distortion]);

  return (
    <ModuleUI
      name="Distortion"
      index={index}
      unregisterModule={unregisterModule}
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      <ParamSlider
        name="Amount"
        min={1}
        max={400}
        defaultValue={100}
        step={0.001}
        value={distortion}
        setValue={setDistortion}
        rep={`${((distortion / 400) * 100).toFixed(0)}%`}
      />
    </ModuleUI>
  );
}

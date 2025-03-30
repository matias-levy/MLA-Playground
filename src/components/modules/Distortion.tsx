"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { createSafeAudioNode } from "@/utils/utils";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";

import ModuleUI from "@/components/ModuleUI";

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
  const [waveshaperNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new WaveShaperNode(ctx))
  );

  useEffect(() => {
    if (waveshaperNode) {
      addModule({ input: waveshaperNode, output: waveshaperNode }, index);
      return () => {
        removeModule({ input: waveshaperNode, output: waveshaperNode });
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
      name="Waveshaper"
      index={index}
      unregisterModule={unregisterModule}
    >
      <Label>Amount</Label>
      <Slider
        min={1}
        max={400}
        defaultValue={[100]}
        step={0.001}
        value={[distortion]}
        onValueChange={(e) => {
          setDistortion(e[0]);
        }}
        onDoubleClick={() => {
          setDistortion(100);
        }}
      />
    </ModuleUI>
  );
}

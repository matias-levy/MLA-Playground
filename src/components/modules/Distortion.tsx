"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { createSafeAudioNode } from "@/utils/utils";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";

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
  addNode,
  removeNode,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();
  const [distortion, setDistortion] = useState(100);
  const [waveshaperNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new WaveShaperNode(ctx))
  );

  useEffect(() => {
    addNode({ input: waveshaperNode, output: waveshaperNode }, index);
    return () => {
      removeNode({ input: waveshaperNode, output: waveshaperNode });
    };
  }, [index]);

  useEffect(() => {
    const curve = makeDistortionCurve(distortion);
    waveshaperNode.curve = curve;
  }, [distortion]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-row justify-between items-center">
        <Label>Waveshapper</Label>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            unregisterModule(index);
          }}
        >
          <X />
        </Button>
      </div>
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
    </div>
  );
}

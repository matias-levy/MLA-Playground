"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { createSafeAudioNode } from "@/utils/utils";
import { Label } from "./ui/label";
import { AudioModuleProps } from "./Stack";
import { Button } from "./ui/button";
import { X } from "lucide-react";

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
}: AudioModuleProps) {
  const { audioContext: ctx, addNode, removeNode, nodes } = useAudioContext();
  const [waveshaperNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new WaveShaperNode(ctx))
  );

  useEffect(() => {
    addNode(waveshaperNode, index);
    return () => {
      removeNode(waveshaperNode);
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-row justify-between items-center">
        <Label>Waveshapper</Label>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            unregisterModule(index - 1);
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
        onValueChange={(e) => {
          const curve = makeDistortionCurve(e[0]);
          waveshaperNode.curve = curve;
        }}
      />
    </div>
  );
}

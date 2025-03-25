"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { createSafeAudioNode } from "@/utils/utils";
import { Label } from "./ui/label";

export default function Delay({ index }: { index: number }) {
  const { audioContext: ctx, addNode, removeNode } = useAudioContext();
  const [delayNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new DelayNode(ctx))
  );

  const [mixNode] = useState(
    createSafeAudioNode(ctx, (ctx) => new ChannelMergerNode(ctx))
  );

  useEffect(() => {
    addNode(delayNode, index);
    return () => {
      removeNode(delayNode);
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <Label>Delay</Label>
      <Slider
        min={0}
        max={2}
        defaultValue={[0]}
        step={0.001}
        onValueChange={(e) => {
          delayNode?.delayTime.setValueAtTime(e[0], 1);
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "./ui/label";
import { AudioModuleProps } from "./Stack";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export default function BitCrush({
  index,
  unregisterModule,
}: AudioModuleProps) {
  const { audioContext: ctx, addNode, removeNode } = useAudioContext();
  const [bits, setBits] = useState(31); // Start at "max" since we are reversing
  const [workletNode, setWorkletNode] = useState<AudioWorkletNode | undefined>(
    undefined
  );

  useEffect(() => {
    // Load the AudioWorklet
    async function loadAudioWorklet() {
      await ctx.audioWorklet.addModule("worklets/bit-crush-processor.js");
      const newNode = new AudioWorkletNode(ctx, "bit-crush-processor");
      setWorkletNode(newNode);
      addNode(newNode, index);
    }

    loadAudioWorklet();

    return () => {
      removeNode(workletNode);
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-row justify-between items-center">
        <Label>Bit Crush</Label>
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
      <Label>Sample Rate Reduction</Label>
      <Slider
        min={0}
        max={88}
        defaultValue={[1]}
        step={0.001}
        onValueChange={(e) => {
          ctx.resume();
          workletNode?.parameters.get("reduction")?.setValueAtTime(e[0], 0);
        }}
      />
      <Label>Bit Reduction</Label>
      <Slider
        min={1}
        max={31}
        value={[31 - bits]}
        defaultValue={[31]}
        step={1}
        onValueChange={(e) => {
          ctx.resume();
          setBits(32 - e[0]);
          workletNode?.parameters.get("bits")?.setValueAtTime(32 - e[0], 0);
        }}
      />
    </div>
  );
}

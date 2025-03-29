"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { AudioModuleProps } from "@/components/Chain";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function BitCrush({
  index,
  unregisterModule,
  addNode,
  removeNode,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();
  const [bits, setBits] = useState(31); // Start at "max" since we are reversing
  const [sampleRate, setSampleRate] = useState(0);

  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    // Load the AudioWorklet
    async function loadAudioWorklet() {
      await ctx.audioWorklet.addModule("worklets/bit-crush-processor.js");
      const newNode = new AudioWorkletNode(ctx, "bit-crush-processor");
      workletNodeRef.current = newNode; // Update ref instead of state
      addNode({ input: newNode, output: newNode }, index);
    }
    loadAudioWorklet();

    return () => {
      if (workletNodeRef.current) {
        removeNode({
          input: workletNodeRef.current,
          output: workletNodeRef.current,
        });
      }
    };
  }, [index]);

  useEffect(() => {
    workletNodeRef.current?.parameters
      .get("reduction")
      ?.setValueAtTime(sampleRate, 0);

    workletNodeRef.current?.parameters.get("bits")?.setValueAtTime(bits, 0);
  }, [bits, sampleRate]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-row justify-between items-center">
        <Label>Bit Crush</Label>
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
      <Label>Sample Rate Reduction</Label>
      <Slider
        min={0}
        max={88}
        defaultValue={[0]}
        value={[sampleRate]}
        step={0.001}
        onValueChange={(e) => {
          ctx.resume();
          setSampleRate(e[0]);
        }}
        onDoubleClick={() => {
          setSampleRate(0);
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
        }}
        onDoubleClick={() => {
          setBits(31);
        }}
      />
    </div>
  );
}

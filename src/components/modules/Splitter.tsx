"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import Chain from "../Chain";

export default function Splitter({
  index,
  unregisterModule,
  addNode,
  removeNode,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // Create nodes
  const [generalIn] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );
  const [generalOut] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [in1] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );
  const [out1] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );
  const [in2] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );
  const [out2] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  useEffect(() => {
    // Register module with the processing chain
    generalIn?.connect(in1);
    generalIn?.connect(in2);
    out1?.connect(generalOut);
    out2?.connect(generalOut);
    addNode({ input: generalIn, output: generalOut }, index);
    return () => {
      removeNode({ input: generalIn, output: generalOut });
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <div className="flex flex-row justify-between items-center">
        <Label>Splitter</Label>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => unregisterModule(index)}
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-row gap-4 items-stretch justify-between">
        <Chain input={in1} output={out1} />
        <Chain input={in2} output={out2} />
      </div>
    </div>
  );
}

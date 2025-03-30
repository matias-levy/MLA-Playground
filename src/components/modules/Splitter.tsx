"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import Chain from "../Chain";
import ModuleUI from "@/components/ModuleUI";

export default function Splitter({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  const [crossfade, setCrossfade] = useState(0.5);

  // Create nodes
  const [generalIn] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );
  const [generalOut] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [in1] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
  );
  const [out1] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );
  const [in2] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
  );
  const [out2] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  useEffect(() => {
    // Register module with the processing chain
    if (generalIn && in1 && in2 && out1 && out2 && generalOut) {
      generalIn.connect(in1);
      generalIn.connect(in2);
      out1.connect(generalOut);
      out2.connect(generalOut);
      addModule({ input: generalIn, output: generalOut }, index);
      return () => {
        removeModule({ input: generalIn, output: generalOut });
      };
    }
  }, [index]);

  useEffect(() => {
    in1?.gain.setValueAtTime(1 - crossfade, ctx.currentTime);
    in2?.gain.setValueAtTime(crossfade, ctx.currentTime);
  }, [crossfade]);

  return (
    <ModuleUI index={index} name="Splitter" unregisterModule={unregisterModule}>
      <Label>Crossfade</Label>
      <Slider
        min={0}
        max={1}
        value={[crossfade]}
        defaultValue={[0.5]}
        step={0.01}
        onValueChange={(e) => {
          setCrossfade(e[0]);
        }}
        onDoubleClick={() => {
          setCrossfade(0.5);
        }}
      />
      <div className="flex flex-row gap-4 items-stretch justify-between">
        {/* @ts-ignore:next-line */}
        <Chain input={in1} output={out1} />
        {/* @ts-ignore:next-line */}
        <Chain input={in2} output={out2} />
      </div>
    </ModuleUI>
  );
}

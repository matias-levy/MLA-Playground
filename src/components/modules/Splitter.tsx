"use client";

import { useEffect, useState, useRef } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import Chain from "../Chain";
import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import useBypass from "@/lib/useBypass";
import useSerialiazable, { safeNumber } from "@/lib/useSerialiazable";

export default function Splitter({
  index,
  moduleId,
  ref,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  const [crossfade, setCrossfade] = useState(0.5);

  // Create nodes
  const [generalIn] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
  );
  const [generalOut] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
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

  const chain1Ref = useRef<any>(null);
  const chain2Ref = useRef<any>(null);

  // Bypass Hook

  const { bypass, setBypass } = useBypass({
    input: generalIn,
    output: generalOut,
    inputConnectsTo: [in1, in2],
    connectedToOutput: [out1, out2],
  });

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

  useSerialiazable({
    ref,
    serialize: async () => {
      const serialized1 = await chain1Ref.current.serialize();
      const serialized2 = await chain2Ref.current.serialize();
      return {
        module: "Splitter",
        bypass: Boolean(bypass),
        crossfade: safeNumber(crossfade),
        chain1: serialized1,
        chain2: serialized2,
      };
    },
    deserialize: (data: any) => {
      setBypass(Boolean(data.bypass));
      setCrossfade(safeNumber(data.crossfade));
      if (chain1Ref.current) {
        chain1Ref.current.deserialize(data.chain1);
      }
      if (chain2Ref.current) {
        chain2Ref.current.deserialize(data.chain2);
      }
    },
  });

  return (
    <ModuleUI
      moduleId={moduleId}
      index={index}
      name="Splitter"
      unregisterModule={unregisterModule}
      bypass={bypass}
      setBypass={setBypass}
    >
      <ParamSlider
        name="Crossfade"
        min={0}
        max={1}
        value={crossfade}
        defaultValue={0.5}
        step={0.01}
        setValue={setCrossfade}
        rep={
          (100 - crossfade * 100).toFixed(0) +
          "% A / " +
          (crossfade * 100).toFixed(0) +
          "% B"
        }
      />
      <div className="flex flex-row gap-4 items-stretch justify-between w-full">
        {/* @ts-ignore:next-line */}
        <Chain input={in1} output={out1} ref={chain1Ref} />
        {/* @ts-ignore:next-line */}
        <Chain input={in2} output={out2} ref={chain2Ref} />
      </div>
    </ModuleUI>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import Chain from "../Chain";
import ModuleUI from "@/components/ModuleUI";
import useBypass from "@/lib/useBypass";

export default function Group({
  index,
  unregisterModule,
  addModule,
  removeModule,
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
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 0.5 }))
  );
  const [out1] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  // Bypass Hook

  const { bypass, toggleBypass } = useBypass({
    input: generalIn,
    output: generalOut,
    inputConnectsTo: [in1],
    connectedToOutput: [out1],
  });

  useEffect(() => {
    // Register module with the processing chain
    if (generalIn && in1 && out1 && generalOut) {
      generalIn.connect(in1);
      out1.connect(generalOut);
      addModule({ input: generalIn, output: generalOut }, index);
      return () => {
        removeModule({ input: generalIn, output: generalOut });
      };
    }
  }, [index]);

  return (
    <ModuleUI
      index={index}
      name="Group"
      unregisterModule={unregisterModule}
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      <div className="flex flex-row gap-4 items-stretch justify-between w-full">
        {/* @ts-ignore:next-line */}
        <Chain input={in1} output={out1} />
      </div>
    </ModuleUI>
  );
}

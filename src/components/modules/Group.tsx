"use client";

import { useEffect, useState, useRef } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";
import Chain from "../Chain";
import ModuleUI from "@/components/ModuleUI";
import useBypass from "@/lib/useBypass";
import useSerialiazable from "@/lib/useSerialiazable";

export default function Group({
  index,
  moduleId,
  ref,
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

  const chainRef = useRef<any>(null);

  // Bypass Hook

  const { bypass, setBypass } = useBypass({
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

  useSerialiazable({
    ref,
    serialize: async () => {
      const serialized = await chainRef.current.serialize();
      return {
        module: "Group",
        bypass: Boolean(bypass),
        chain: serialized,
      };
    },
    deserialize: (data: any) => {
      setBypass(Boolean(data.bypass));
      if (chainRef.current) {
        chainRef.current.deserialize(data.chain);
      }
    },
  });

  return (
    <ModuleUI
      moduleId={moduleId}
      index={index}
      name="Group"
      unregisterModule={unregisterModule}
      bypass={bypass}
      setBypass={setBypass}
    >
      <div className="flex flex-row gap-4 items-stretch justify-between w-full">
        {/* @ts-ignore:next-line */}
        <Chain input={in1} output={out1} ref={chainRef} />
      </div>
    </ModuleUI>
  );
}

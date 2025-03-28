"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ctx =
  typeof window !== "undefined"
    ? new AudioContext({ latencyHint: "interactive" })
    : null;

export interface AudioContextInterface {
  audioContext: AudioContext;
  nodes: AudioNode[];
  setInput: Function;
  setOutput: Function;
  addNode: Function;
  removeNode: Function;
}

export interface AudioModule {
  input: AudioNode;
  output: AudioNode;
}

const AudioContextContext = createContext<AudioContextInterface | null>(null);

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modules, setModules] = useState<AudioModule[]>([]);
  const [input, setInput] = useState<AudioNode>();
  const [output, setOutput] = useState<AudioNode>();

  const addNode = (module: AudioModule, index: number) => {
    setModules((prevModules) => {
      const newModules = [...prevModules]; // Create a new array (avoids mutation)
      newModules[index] = module;
      return newModules;
    });
  };

  const removeNode = (module: AudioModule) => {
    setModules((prevModules) =>
      prevModules.filter(
        (n) => n.input !== module.input || n.output !== module.output
      )
    );
  };

  // This effect is used to connect the actual nodes of the chain
  useEffect(() => {
    console.log("use effect provider", modules);
    if (ctx) {
      if (!input || !output) {
        return;
      }
      if (!modules.length) {
        // There are no nodes
        input.disconnect();
        input.connect(output);
        input.connect(ctx.destination);
      } else {
        // There are nodes
        input.disconnect();
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          if (module) {
            module.output.disconnect();
          }
        }
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          if (!module) {
            return;
          }
        }
        input.connect(modules[0].input);

        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          if (i == modules.length - 1) {
            //Last Element Connects to output
            module.output.connect(ctx.destination);
            module.output.connect(output);
          } else {
            module.output.connect(modules[i + 1].input);
          }
        }
      }
    }
  }, [modules, input, output, ctx]);

  return (
    <AudioContextContext.Provider
      value={{
        audioContext: ctx,
        modules,
        addNode,
        removeNode,
        setInput,
        setOutput,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  return useContext(AudioContextContext);
}

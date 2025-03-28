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

const AudioContextContext = createContext<AudioContextInterface | null>(null);

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nodes, setNodes] = useState<AudioNode[]>([]);
  const [input, setInput] = useState<AudioNode>();
  const [output, setOutput] = useState<AudioNode>();

  const addNode = (node: AudioNode, index: number) => {
    setNodes((prevNodes) => {
      const newNodes = [...prevNodes]; // Create a new array (avoids mutation)
      newNodes[index] = node;
      return newNodes;
    });
  };

  const removeNode = (node: AudioNode) => {
    setNodes((prevNodes) => {
      return prevNodes.filter((n) => n !== node);
    });
  };

  // This effect is used to connect the actual nodes of the chain
  useEffect(() => {
    console.log("use effect provider", nodes);
    if (ctx) {
      if (!input || !output) {
        return;
      }
      if (!nodes.length) {
        // There are no nodes
        input.disconnect();
        input.connect(output);
        input.connect(ctx.destination);
      } else {
        // There are nodes
        input.disconnect();
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node) {
            node.disconnect();
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (!node) {
            return;
          }
        }
        input.connect(nodes[0]);

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (i == nodes.length - 1) {
            //Last Element Connects to output
            node.connect(ctx.destination);
            node.connect(output);
          } else {
            node.connect(nodes[i + 1]);
          }
        }
      }
    }
  }, [nodes, input, output, ctx]);

  return (
    <AudioContextContext.Provider
      value={{
        audioContext: ctx,
        nodes,
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

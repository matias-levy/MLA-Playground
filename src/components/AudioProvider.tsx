"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ctx =
  typeof window !== "undefined"
    ? new AudioContext({ latencyHint: "interactive" })
    : null;

const AudioContextContext = createContext<Object>({});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<AudioNode[]>([]);

  const addNode = (node: AudioNode, index: number) => {
    setNodes((prevNodes) => {
      const newNodes = [...prevNodes]; // Create a new array (avoids mutation)
      newNodes[index] = node;
      return newNodes;
    });
  };

  const removeNode = (node: AudioNode) => {
    setNodes((prevNodes) => prevNodes.filter((n) => n !== node));
  };

  useEffect(() => {
    console.log("use effect de provider", nodes);
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
    for (let i = 0; i < nodes.length - 1; i++) {
      const node = nodes[i];
      if (i == nodes.length - 2) {
        //Last Element Connects to output
        if (ctx) {
          node.connect(ctx.destination);
          node.connect(nodes[nodes.length - 1]);
        }
      } else {
        node.connect(nodes[i + 1]);
      }
    }
  }, [nodes]);

  return (
    <AudioContextContext.Provider
      value={{ audioContext: ctx, nodes, addNode, removeNode }}
    >
      {children}
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  return useContext(AudioContextContext);
}

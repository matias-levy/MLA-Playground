import { useImperativeHandle } from "react";
import { Snapshot } from "@/components/Snapshots";

export async function serializeBlob(blob: Blob | null): Promise<string | null> {
  if (!blob) return null;

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export function deserializeBlob(data: string | null | undefined): Blob | null {
  if (!data) return null;

  const base64 = data.includes(",") ? data.split(",")[1] : data;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes]);
}

export function safeNumber(input: any): number {
  const number = Number(input);
  if (Number.isNaN(number)) {
    throw new Error(`Invalid number: ${input}`);
  }
  return number;
}

export interface SerializedStack {
  version: number;
  createdAt: number;
  currentFile: string | null;
  fileIsAudio: boolean;
  fileMode: string;
  audioInput: any;
  chain: any;
  snapshots: Snapshot[];
}
export interface SerialiazableProps<T> {
  ref: React.RefObject<any>;
  serialize: () => any;
  deserialize: (data: any, options?: T) => void;
}

const useSerialiazable = <T extends any>(config: SerialiazableProps<T>) => {
  const { ref, serialize, deserialize } = config;
  useImperativeHandle(ref, () => ({
    serialize,
    deserialize,
  }));
};

export default useSerialiazable;

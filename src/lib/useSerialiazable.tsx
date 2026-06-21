import { useImperativeHandle } from "react";

export async function serializeBlob(
  blob: Blob | null
): Promise<string | null> {
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

export interface SerialiazableProps {
  ref: React.RefObject<any>;
  serialize: () => any;
  deserialize: (data: any) => void;
}

const useSerialiazable = (config: SerialiazableProps) => {
  const { ref, serialize, deserialize } = config;
  useImperativeHandle(ref, () => ({
    serialize,
    deserialize,
  }));
};

export default useSerialiazable;

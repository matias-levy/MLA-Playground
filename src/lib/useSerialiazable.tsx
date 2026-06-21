import { useImperativeHandle } from "react";

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

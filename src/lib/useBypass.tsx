import { useState, useEffect } from "react";

interface useBypassProps {
  input: AudioNode | null;
  inputConnectsTo: (AudioNode | null)[];
  output: AudioNode | null;
  connectedToOutput: (AudioNode | null)[];
}

export default function useBypass({
  input,
  output,
  inputConnectsTo,
  connectedToOutput,
}: useBypassProps) {
  const [bypass, setBypass] = useState(false);

  const toggleBypass = () => {
    setBypass((b) => !b);
  };

  useEffect(() => {
    if (input && output) {
      if (bypass) {
        input.disconnect();
        for (let i = 0; i < connectedToOutput.length; i++) {
          connectedToOutput[i]?.disconnect();
        }
        input.connect(output);
      } else {
        input.disconnect();
        for (let i = 0; i < inputConnectsTo.length; i++) {
          const node = inputConnectsTo[i];
          if (node) {
            input.connect(node);
          }
        }
        for (let i = 0; i < connectedToOutput.length; i++) {
          connectedToOutput[i]?.connect(output);
        }
      }
    }
  }, [bypass]);

  return { bypass, toggleBypass };
}

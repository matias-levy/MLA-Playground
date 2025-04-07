import { Device } from "@rnbo/js";
import { useState, useEffect } from "react";

interface useBypassProps {
  input: AudioNode | null;
  inputConnectsTo: (AudioNode | null)[];
  output: AudioNode | null;
  connectedToOutput: (AudioNode | null)[];
  RNBO?: boolean;
  RNBODevice?: Device | null;
}

export default function useBypass({
  input,
  output,
  inputConnectsTo,
  connectedToOutput,
  RNBO,
  RNBODevice,
}: useBypassProps) {
  const [bypass, setBypass] = useState(false);

  const toggleBypass = () => {
    setBypass((b) => !b);
  };

  useEffect(() => {
    if (!RNBO) {
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
    } else {
      //RNBO Mode
      if (RNBODevice && connectedToOutput[0]) {
        if (input && output) {
          if (bypass) {
            input.disconnect();
            connectedToOutput[0].disconnect();
            RNBODevice.node.disconnect();
            input.connect(output);
          } else {
            input.disconnect();
            input.connect(RNBODevice.node);
            RNBODevice.node.connect(connectedToOutput[0]);
            connectedToOutput[0].connect(output);
          }
        }
      } else {
        if (input && output) {
          input.disconnect();
          input.connect(output);
        }
      }
    }
  }, [bypass, RNBODevice]);

  return { bypass, toggleBypass };
}

import { AudioModule } from "@/components/AudioProvider";
import { useEffect, useState } from "react";

export default function useAudioChain({ ctx }: { ctx: AudioContext }) {
  const [modules, setModules] = useState<AudioModule[]>([]);
  const [input, setInput] = useState<AudioNode | null>(null);
  const [output, setOutput] = useState<AudioNode | null>(null);

  const addModule = (module: AudioModule, index: number) => {
    setModules((prevModules) => {
      const newModules = [...prevModules]; // Create a new array (avoids mutation)
      newModules[index] = module;
      return newModules;
    });
  };

  const removeModule = (module: AudioModule) => {
    module.output.disconnect();
    setModules((prevModules) =>
      prevModules.filter(
        (n) => n.input !== module.input || n.output !== module.output
      )
    );
  };

  // This effect is used to connect the actual nodes of the chain
  useEffect(() => {
    console.log("use effect useAudioChain", modules);
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

  return { modules, setInput, setOutput, addModule, removeModule };
}

"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import { createDevice, Device } from "@rnbo/js";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useBypass from "@/lib/useBypass";
import { Loader2 } from "lucide-react";

export default function RNBO({
  index,
  unregisterModule,
  addModule,
  removeModule,
}: AudioModuleProps) {
  const { audioContext: ctx } = useAudioContext();

  // UI Params
  const [gain, setGain] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<Blob | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [patcher, setPatcher] = useState<any | null>(null);
  const [paramValues, setParamValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Create nodes
  const [inputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [outputNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  const [gainNode] = useState(() =>
    createSafeAudioNode(ctx, (ctx) => new GainNode(ctx, { gain: 1 }))
  );

  // Bypass Hook

  const { bypass, toggleBypass } = useBypass({
    input: inputNode,
    output: outputNode,
    inputConnectsTo: [],
    connectedToOutput: [gainNode],
    RNBO: true,
    RNBODevice: device,
  });

  useEffect(() => {
    if (outputNode && inputNode) {
      addModule({ input: inputNode, output: outputNode }, index);
      return () => {
        removeModule({ input: inputNode, output: outputNode });
      };
    }
  }, [index]);

  useEffect(() => {
    if (uploadedFile) {
      setDevice(null);
      setLoading(true);
      setParamValues([]);
      const fr = new FileReader();
      fr.onload = async function () {
        if (typeof this.result == "string") {
          try {
            const parsedPatcher = JSON.parse(this.result);
            await createDevice({ context: ctx, patcher: parsedPatcher }).then(
              (d) => {
                d.parameters.forEach((p, i) => {
                  setParamValues((prev) => {
                    const newParams = [...prev];
                    newParams[p.index] = p.V;
                    return newParams;
                  });
                });
                d.parameterChangeEvent.subscribe((v) => {
                  setParamValues((prev) => {
                    const newParams = [...prev];
                    newParams[v.index] = v.V;
                    return newParams;
                  });
                });
                setDevice(d);
                setPatcher(parsedPatcher);
                setLoading(false);
              }
            );
          } catch (error) {
            console.log(error);
          }
        }
      };
      fr.readAsText(uploadedFile);
    }
  }, [uploadedFile]);

  useEffect(() => {
    gainNode?.gain.setValueAtTime(gain, ctx.currentTime);
  }, [gain]);

  return (
    <ModuleUI
      index={index}
      name={
        patcher?.desc.meta.filename
          ? "RNBO | " + patcher?.desc.meta.filename.slice(0, -7)
          : "RNBO"
      }
      unregisterModule={unregisterModule}
      bypass={bypass}
      toggleBypass={toggleBypass}
    >
      <Label>External RNBO JSON Patcher</Label>

      <div className="flex flex-row items-center justify-center space-x-2 grow">
        <Input
          accept="application/JSON"
          type="file"
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            setUploadedFile(file);
          }}
        />
      </div>
      {device && (
        <hr className="h-px w-full bg-gray-200 border-0 dark:bg-gray-700 rounded-2xl" />
      )}
      {!loading ? (
        device?.parameters.map((p) => {
          let component;
          switch (p.type) {
            case 0:
              //numberic, use slider
              component = (
                <ParamSlider
                  name={p.displayName}
                  defaultValue={p.initialValue}
                  min={p.min}
                  max={p.max}
                  setValue={(v: number) => {
                    p.value = v;
                  }}
                  value={paramValues[p.index]}
                  key={p.id}
                  rep={paramValues[p.index].toFixed(2) + " " + p.unit}
                  step={0.01}
                />
              );
              break;

            case 1:
              //bang, didn't find documentation about this
              component = <></>;
              break;

            case 5:
              //enum, use RadioGroup
              component = (
                <div key={p.id}>
                  <Label className="mb-4">{p.displayName}</Label>
                  <RadioGroup
                    value={p.G[paramValues[p.index]]}
                    onValueChange={(e) => {
                      p.value = p.enumValues.indexOf(e);
                    }}
                    className="flex flex-wrap"
                  >
                    {p.enumValues.map((enumItem: string) => (
                      <div key={enumItem} className="flex flex-row gap-2">
                        <RadioGroupItem value={enumItem} />
                        <Label>
                          {enumItem.charAt(0).toUpperCase() + enumItem.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );

              break;

            default:
              break;
          }
          return component;
        })
      ) : (
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      )}
      {device && (
        <ParamSlider
          name="Gain"
          min={0}
          max={3}
          value={gain}
          defaultValue={1}
          step={0.001}
          setValue={setGain}
          rep={(gain * 100).toFixed(0) + " %"}
        />
      )}
    </ModuleUI>
  );
}

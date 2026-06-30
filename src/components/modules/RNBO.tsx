"use client";

import { useCallback, useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { createSafeAudioNode } from "@/utils/utils";
import { AudioModuleProps } from "@/components/Chain";

import {
  createDevice,
  Device,
  EnumParameter,
  EnumValue,
  ParameterType,
} from "@rnbo/js";

import ModuleUI from "@/components/ModuleUI";
import ParamSlider from "@/components/ParamSlider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useBypass from "@/lib/useBypass";
import { Loader2 } from "lucide-react";
import useSerialiazable, {
  deserializeBlob,
  safeNumber,
  serializeBlob,
} from "@/lib/useSerialiazable";
import { dbToLinear, linearToDb } from "@/utils/conversion";

export default function RNBO({
  index,
  moduleId,
  ref,
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

  const { bypass, toggleBypass, setBypass } = useBypass({
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

  const loadPatcher = useCallback(
    async (file: Blob | null, initialParamValues?: number[]) => {
      if (file) {
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
                  if (initialParamValues) {
                    setParamValues(initialParamValues);
                    d.parameters.forEach((p) => {
                      p.value = initialParamValues[p.index];
                    });
                  } else {
                    d.parameters.forEach((p, i) => {
                      setParamValues((prev) => {
                        const newParams = [...prev];
                        newParams[p.index] = p.value;
                        return newParams;
                      });
                    });
                  }
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
        fr.readAsText(file);
      }
    },
    []
  );

  useEffect(() => {
    gainNode?.gain.setValueAtTime(gain, ctx.currentTime);
  }, [gain]);

  useSerialiazable({
    ref,
    serialize: async () => {
      return {
        module: "RNBO",
        bypass: Boolean(bypass),
        gain: safeNumber(gain),
        uploadedFile: uploadedFile ? await serializeBlob(uploadedFile) : null,
        paramValues: paramValues,
      };
    },
    deserialize: (data: any) => {
      setBypass(Boolean(data.bypass));
      setGain(safeNumber(data.gain));
      setUploadedFile(
        data.uploadedFile ? deserializeBlob(String(data.uploadedFile)) : null
      );
      loadPatcher(
        data.uploadedFile ? deserializeBlob(String(data.uploadedFile)) : null,
        data.paramValues
      );
    },
  });

  return (
    <ModuleUI
      moduleId={moduleId}
      index={index}
      name={
        patcher?.desc.meta.filename
          ? "RNBO | " + patcher?.desc.meta.filename.slice(0, -7)
          : "RNBO"
      }
      unregisterModule={unregisterModule}
      bypass={bypass}
      setBypass={setBypass}
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
            loadPatcher(file);
          }}
        />
      </div>
      {device && (
        <hr className="h-px w-full bg-gray-200 border-0 dark:bg-gray-700 rounded-2xl" />
      )}
      {!loading ? (
        device?.parameters.map((p) => {
          let component;
          switch (p.type as ParameterType) {
            case ParameterType.Number:
              //numberic, use slider
              component = (
                <ParamSlider
                  moduleId={moduleId}
                  moduleName="RNBO"
                  name={p.displayName}
                  defaultValue={p.initialValue}
                  min={p.min}
                  max={p.max}
                  setValue={(v: number) => {
                    setParamValues((prev) => {
                      const newParams = [...prev];
                      newParams[p.index] = v;
                      return newParams;
                    });
                    p.value = v;
                  }}
                  value={paramValues[p.index]}
                  key={p.id}
                  rep={paramValues[p.index].toFixed(2) + " " + p.unit}
                  step={0.01}
                />
              );
              break;

            case ParameterType.Bang:
              //bang, didn't find documentation about this
              component = <></>;
              break;

            case ParameterType.Enum: {
              const enumParam = p as EnumParameter;
              component = (
                <div key={p.id}>
                  <Label className="mb-4">{p.displayName}</Label>
                  <RadioGroup
                    value={enumParam.enumValue.toString()}
                    onValueChange={(e) => {
                      setParamValues((prev) => {
                        const newParams = [...prev];
                        newParams[p.index] = parseInt(e);
                        return newParams;
                      });
                      enumParam.enumValue = e;
                    }}
                    className="flex flex-wrap"
                  >
                    {enumParam.enumValues.map((enumItem: EnumValue) => (
                      <div key={enumItem} className="flex flex-row gap-2">
                        <RadioGroupItem value={enumItem.toString()} />
                        <Label>
                          {enumItem.toString().charAt(0).toUpperCase() +
                            enumItem.toString().slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
              break;
            }

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
          moduleId={moduleId}
          moduleName="RNBO"
          name="Volume"
          min={0}
          max={dbToLinear(24)}
          value={gain}
          defaultValue={1}
          step={0.001}
          setValue={setGain}
          rep={linearToDb(gain).toFixed(1) + " dB"}
          logScale
        />
      )}
    </ModuleUI>
  );
}

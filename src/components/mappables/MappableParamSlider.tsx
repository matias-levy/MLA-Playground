import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { linearToLogSliderPos, logSliderPosToLinear } from "@/utils/conversion";
import { cn } from "@/lib/utils";
import {
  getMappingParamRange,
  MidiMappingEntry,
  useMidiParam,
} from "@/lib/useMidiMap";

const LOG_SLIDER_RESOLUTION = 1000;

export interface ParamSliderProps {
  moduleId: string;
  moduleName: string;
  name: string;
  value: number;
  setValue: (value: number) => void;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  rep: string;
  disabled?: boolean;
  logScale?: boolean;
}

export default function ParamSlider({
  moduleId,
  moduleName,
  name,
  value,
  setValue,
  defaultValue,
  min,
  max,
  step,
  rep,
  disabled,
  logScale = false,
}: ParamSliderProps) {
  const snapToStep = (v: number) => Math.round(v / step) * step;

  const sliderMin = logScale ? 0 : min;
  const sliderMax = logScale ? LOG_SLIDER_RESOLUTION : max;
  const sliderStep = logScale ? 1 : step;
  const sliderValue = logScale
    ? linearToLogSliderPos(value, min, max) * LOG_SLIDER_RESOLUTION
    : value;
  const sliderDefault = logScale
    ? linearToLogSliderPos(defaultValue, min, max) * LOG_SLIDER_RESOLUTION
    : defaultValue;

  const onNoteOn = useCallback(
    (mapping: MidiMappingEntry) => {
      const { low, high } = getMappingParamRange(mapping, min, max, logScale);
      const snappedHigh = snapToStep(high);
      if (Math.abs(value - snappedHigh) <= step / 2) {
        setValue(snapToStep(low));
      } else {
        setValue(snappedHigh);
      }
    },
    [value, min, max, logScale, setValue, step]
  );

  const { isLearning, isSelected, onLearnClick } = useMidiParam({
    moduleId,
    moduleName,
    paramName: name,
    onCC: setValue,
    onNoteOn,
    min,
    max,
    logScale,
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-5 p-2 rounded-lg transition-colors",
        isLearning && "cursor-pointer",
        isSelected && "ring-1 ring-primary",
        isLearning && !isSelected && "hover:bg-secondary"
      )}
      onClick={isLearning ? onLearnClick : undefined}
    >
      <div className="flex flex-row justify-between">
        <Label>{name}</Label>
        <Label>{rep}</Label>
      </div>
      <Slider
        disabled={disabled}
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={[sliderValue]}
        defaultValue={[sliderDefault]}
        onValueChange={(e) => {
          if (logScale) {
            const linear = logSliderPosToLinear(
              e[0] / LOG_SLIDER_RESOLUTION,
              min,
              max
            );
            setValue(snapToStep(linear));
          } else {
            setValue(e[0]);
          }
        }}
        onDoubleClick={() => setValue(defaultValue)}
      />
    </div>
  );
}

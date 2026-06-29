import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { linearToLogSliderPos, logSliderPosToLinear } from "@/utils/conversion";
import { cn } from "@/lib/utils";

const LOG_SLIDER_RESOLUTION = 1000;

export interface ParamSliderProps {
  name: string;
  value: number;
  setValue: Function;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  rep: string;
  disabled?: boolean;
  logScale?: boolean;
  learnMode?: boolean;
  learnSelected?: boolean;
  onLearnClick?: () => void;
}

export default function ParamSlider({
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
  learnMode = false,
  learnSelected = false,
  onLearnClick,
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

  return (
    <div
      className={cn(
        "flex flex-col gap-5 p-2 rounded-lg transition-colors",
        learnMode && "cursor-pointer",
        learnSelected && "ring-1 ring-primary",
        learnMode && !learnSelected && "hover:bg-secondary"
      )}
      onClick={learnMode ? onLearnClick : undefined}
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

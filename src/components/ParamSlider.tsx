import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

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
}: ParamSliderProps) {
  return (
    <div className="flex flex-col gap-5 px-1">
      <div className="flex flex-row justify-between">
        <Label>{name}</Label>
        <Label>{rep}</Label>
      </div>
      <Slider
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={[value]}
        defaultValue={[defaultValue]}
        onValueChange={(e) => setValue(e[0])}
        onDoubleClick={() => setValue(defaultValue)}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import { getMappingParamRange, useMidiParam } from "@/lib/useMidiMap";

type MappableRangeSliderProps = React.ComponentProps<
  typeof SliderPrimitive.Root
> & {
  moduleId: string;
  moduleName: string;
  minParamName: string;
  maxParamName: string;
  stepGuard: number;
  onRangeChange: (value: [number, number]) => void;
};

function MappableRangeSlider({
  moduleId,
  moduleName,
  minParamName,
  maxParamName,
  stepGuard,
  onRangeChange,
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: MappableRangeSliderProps) {
  const minParam = useMidiParam({
    moduleId,
    moduleName,
    paramName: minParamName,
    min: 0,
    max: 100,
    onCC: (ccValue: number) => {
      onRangeChange([
        Math.abs(Math.min(ccValue, value![1] - (props.step ?? 1) * stepGuard)),
        value![1],
      ]);
    },
    onNoteOn: (mapping) => {
      const { low, high } = getMappingParamRange(mapping, min, max, false);
      const snappedHigh =
        Math.round(high / (props.step ?? 1)) * (props.step ?? 1);
      const snappedLow =
        Math.round(low / (props.step ?? 1)) * (props.step ?? 1);
      if (
        Math.abs(value![0] - snappedHigh) <= (props.step ?? 1) * stepGuard ||
        Math.abs(value![0] - value![1]) <= (props.step ?? 1) * stepGuard
      ) {
        onRangeChange([
          Math.min(snappedLow, value![1] - (props.step ?? 1) * stepGuard),
          value![1],
        ]);
      } else {
        onRangeChange([
          Math.min(snappedHigh, value![1] - (props.step ?? 1) * stepGuard),
          value![1],
        ]);
      }
    },
  });

  const maxParam = useMidiParam({
    moduleId,
    moduleName,
    paramName: maxParamName,
    min: 0,
    max: 100,
    onCC: (ccValue: number) => {
      onRangeChange([
        value![0],
        Math.abs(Math.max(ccValue, value![0] + (props.step ?? 1) * stepGuard)),
      ]);
    },
    onNoteOn: (mapping) => {
      const { low, high } = getMappingParamRange(mapping, min, max, false);
      const snappedHigh =
        Math.round(high / (props.step ?? 1)) * (props.step ?? 1);
      const snappedLow =
        Math.round(low / (props.step ?? 1)) * (props.step ?? 1);
      if (
        Math.abs(value![1] - snappedHigh) <= (props.step ?? 1) * stepGuard &&
        !(Math.abs(value![1] - value![0]) <= (props.step ?? 1) * stepGuard)
      ) {
        onRangeChange([
          value![0],
          Math.max(snappedLow, value![0] + (props.step ?? 1) * stepGuard),
        ]);
      } else {
        onRangeChange([
          value![0],
          Math.max(snappedHigh, value![0] + (props.step ?? 1) * stepGuard),
        ]);
      }
    },
  });

  const handleThumbClick = (hook: ReturnType<typeof useMidiParam>) => {
    if (hook.isLearning) {
      hook.onLearnClick();
    } else {
      console.log("handleThumbClick", hook.label);
    }
  };

  //   const _values = React.useMemo(
  //     () =>
  //       Array.isArray(value)
  //         ? value
  //         : Array.isArray(defaultValue)
  //         ? defaultValue
  //         : [min, max],
  //     [value, defaultValue, min, max]
  //   );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      onValueChange={(value) => onRangeChange(value as [number, number])}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        onClick={() => handleThumbClick(minParam)}
        data-slot="slider-thumb"
        className={cn(
          "border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm",
          "transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none",
          "disabled:opacity-50 hover:cursor-pointer",
          minParam.isSelected && "ring-1 ring-primary",
          minParam.isLearning && "cursor-pointer hover:bg-secondary"
        )}
      />
      <SliderPrimitive.Thumb
        onClick={() => handleThumbClick(maxParam)}
        data-slot="slider-thumb"
        className={cn(
          "border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm",
          "transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none",
          "disabled:opacity-50 hover:cursor-pointer",
          maxParam.isSelected && "ring-1 ring-primary",
          maxParam.isLearning && "cursor-pointer hover:bg-secondary"
        )}
      />
    </SliderPrimitive.Root>
  );
}

export default MappableRangeSlider;

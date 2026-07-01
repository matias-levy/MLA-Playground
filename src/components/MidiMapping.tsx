"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { KeyboardMusic, Plus, Minus, X } from "lucide-react";
import { useMidiMap } from "@/lib/useMidiMap";
import { MidiCommand } from "@/utils/MidiParser";

const MidiCommandLabel = (command: MidiCommand) => {
  switch (command) {
    case "controlChange":
      return "CC";
    case "noteOn":
      return "NOTE";
    default:
      "UNKNOWN";
  }
};

const MidiMapping = () => {
  const {
    midiInputs,
    setMidiInputStatus,
    isLearning,
    pendingParamId,
    mappings,
    startLearning,
    cancelLearning,
    getParam,
    removeMapping,
    updateMappingRange,
    invertMappingRange,
  } = useMidiMap();

  const pendingParam = pendingParamId ? getParam(pendingParamId) : null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <KeyboardMusic />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto pb-10">
        <SheetHeader>
          <SheetTitle>MIDI Mapping</SheetTitle>
          <SheetDescription>
            Map MIDI messages to different parameters in the playground.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4">
          <Label>Inputs</Label>
          <div className="flex flex-col gap-2">
            {midiInputs &&
              Object.entries(midiInputs).map(([id, input]) => (
                <div
                  key={id}
                  className="flex flex-row justify-between items-center gap-2"
                >
                  <Label>{input.MIDIInput.name}</Label>
                  <Switch
                    checked={input.enabled}
                    onCheckedChange={(checked) =>
                      setMidiInputStatus(id, checked)
                    }
                  />
                </div>
              ))}
          </div>
          <hr className="h-px w-full bg-border border-0 dark:bg-card rounded-2xl my-2" />
          <Label>Parameters</Label>

          {mappings.map((mapping) => {
            return (
              <MidiMappingItem
                key={mapping.paramId}
                param={`${mapping.moduleName} · ${mapping.paramName}`}
                channel={mapping.channel}
                command={mapping.command}
                data1={mapping.data1}
                range={mapping.range}
                isInverted={mapping.isInverted}
                onRemove={() => removeMapping(mapping.paramId)}
                onRangeChange={(value) =>
                  updateMappingRange(mapping.paramId, value)
                }
                onInvertRange={() => invertMappingRange(mapping.paramId)}
              />
            );
          })}

          {isLearning ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {pendingParam
                  ? `Move a MIDI control to map ${pendingParam.moduleName} · ${pendingParam.paramName}`
                  : "Click a parameter on a module to select it"}
              </p>

              <Button
                variant="outline"
                className="rounded-full"
                onClick={cancelLearning}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={startLearning}
            >
              Learn Mapping
              <Plus />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const MidiMappingItem = ({
  param,
  channel,
  command,
  data1,
  range,
  isInverted,
  onRemove,
  onRangeChange,
  onInvertRange,
}: {
  param: string;
  channel: number;
  command: MidiCommand;
  data1: number;
  range: [number, number];
  isInverted: boolean;
  onRemove: () => void;
  onRangeChange: (value: [number, number]) => void;
  onInvertRange: () => void;
}) => {
  return (
    <div className="flex flex-col justify-between gap-2">
      <div className="flex flex-row justify-between items-center gap-2">
        <div className="flex flex-row gap-2 items-start">
          <Label className="max-w-[50%]">{param}</Label>
          <Label>
            ({channel}) {MidiCommandLabel(command)} {data1}
          </Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-row justify-between items-center gap-2">
        <Slider
          value={range}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => onRangeChange(value as [number, number])}
          className="mx-auto w-full max-w-xs"
        />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onInvertRange}
        >
          {isInverted ? <Minus /> : <Plus />}
        </Button>
      </div>
    </div>
  );
};

export default MidiMapping;

"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { KeyboardMusic, Plus, X } from "lucide-react";
import { useMidiMap } from "@/lib/useMidiMap";

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
  } = useMidiMap();

  const pendingParam = pendingParamId ? getParam(pendingParamId) : null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <KeyboardMusic />
        </Button>
      </SheetTrigger>
      <SheetContent>
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

          {mappings.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <Label>Mappings</Label>

              {mappings.map((mapping) => {
                const param = getParam(mapping.paramId);

                return (
                  <div
                    key={mapping.paramId}
                    className="flex flex-row justify-between items-center gap-2 text-sm"
                  >
                    <span>
                      {param
                        ? `${param.moduleName} · ${param.paramName}`
                        : mapping.paramId}{" "}
                      ← CC{mapping.cc} (ch {mapping.channel})
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={() => removeMapping(mapping.paramId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MidiMapping;

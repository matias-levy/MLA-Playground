"use client";

import { useEffect, useState } from "react";
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
import { KeyboardMusic, Plus } from "lucide-react";
import { useAudioContext } from "@/components/AudioProvider";
import { parseMidiMessage } from "@/utils/MidiParser";

interface MidiInputMap {
  [key: string]: {
    MIDIInput: MIDIInput;
    enabled: boolean;
  };
}

const MidiMapping = () => {
  const { midiInstance } = useAudioContext();
  const [inputs, setInputs] = useState<MidiInputMap>();
  const [mappings, setMappings] = useState();

  useEffect(() => {
    if (midiInstance) {
      setInputs(
        Object.fromEntries(
          Array.from(midiInstance.inputs.values()).map((input) => [
            input.id,
            { MIDIInput: input, enabled: false },
          ])
        )
      );
    }
  }, [midiInstance]);

  useEffect(() => {
    const callback = (msg: MIDIMessageEvent) => {
      const parsedMessage = parseMidiMessage(Array.from(msg.data ?? []));
      if (
        parsedMessage.command === "controlChange" &&
        parsedMessage.data[0] === 1
      ) {
        console.log(parsedMessage);
      }
    };

    if (midiInstance && inputs) {
      Object.entries(inputs).forEach(([_id, input]) => {
        if (input.enabled) {
          input.MIDIInput.onmidimessage = callback;
        }
      });
    }
    return () => {
      if (midiInstance && inputs) {
        Object.entries(inputs).forEach(([_id, input]) => {
          if (input.enabled) {
            input.MIDIInput.onmidimessage = null;
          }
        });
      }
    };
  }, [mappings, inputs]);

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
            {inputs &&
              Object.entries(inputs).map(([id, input]) => (
                <div
                  key={id}
                  className="flex flex-row justify-between items-center gap-2"
                >
                  <Label>{input.MIDIInput.name}</Label>
                  <Switch
                    checked={input.enabled}
                    onCheckedChange={(checked) =>
                      setInputs((prev) => ({
                        ...prev,
                        [id]: {
                          ...(prev?.[id] ?? {
                            MIDIInput: input.MIDIInput,
                            enabled: false,
                          }),
                          enabled: checked,
                        },
                      }))
                    }
                  />
                </div>
              ))}
          </div>
          <hr className="h-px w-full bg-border border-0 dark:bg-card rounded-2xl my-2" />
          <Label>Parameters</Label>
          <Button variant="outline" className="rounded-full">
            Learn Mapping
            <Plus />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MidiMapping;

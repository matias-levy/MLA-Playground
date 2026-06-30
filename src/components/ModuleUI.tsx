"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Power, PowerOff } from "lucide-react";
import { cn, moduleSurfaceClasses } from "@/lib/utils";
import { useMidiParam } from "@/lib/useMidiMap";

export interface ModuleUIProps {
  moduleId: string;
  name: string;
  unregisterModule: (index: number) => void;
  index: number;
  children: React.ReactNode;
  bypass: boolean;
  setBypass: Function;
}

export default function ModuleUI({
  moduleId,
  name,
  unregisterModule,
  index,
  children,
  bypass,
  setBypass,
}: ModuleUIProps) {
  const [open, setOpen] = useState("item-1");
  const isOpen = open === "item-1";

  const bypassMidi = useMidiParam({
    moduleId,
    moduleName: name,
    paramName: "Bypass",
    onCC: (value: number) => {
      setBypass(value < 64);
    },
    onNoteOn: () => {
      setBypass(!bypass);
    },
    min: 0,
    max: 127,
  });

  const handleBypassClick = () => {
    if (bypassMidi.isLearning) {
      bypassMidi.onLearnClick();
    } else {
      setBypass(!bypass);
    }
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col items-stretch px-6 py-2",
        moduleSurfaceClasses,
        bypass && "opacity-50 dark:bg-muted"
      )}
    >
      <Accordion
        type="single"
        collapsible
        value={open}
        onValueChange={setOpen}
        className="w-full"
      >
        <AccordionItem value="item-1" className="border-b-0">
          <div className="flex flex-row justify-between items-center gap-5">
            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                className={cn(
                  "rounded-full",
                  bypassMidi.isLearning && "cursor-pointer",
                  bypassMidi.isSelected && "ring-1 ring-primary"
                )}
                onClick={handleBypassClick}
              >
                {bypass ? <PowerOff /> : <Power />}
              </Button>

              <Label>{name}</Label>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <AccordionTrigger />
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  unregisterModule(index);
                }}
              >
                <X />
              </Button>
            </div>
          </div>
        </AccordionItem>
      </Accordion>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] pointer-events-none"
        )}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <div className="overflow-hidden">
          <div className="w-full flex flex-col gap-3 px-1 pt-2 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

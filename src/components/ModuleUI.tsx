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

export interface ModuleUIProps {
  name: string;
  unregisterModule: (index: number) => void;
  index: number;
  children: React.ReactNode;
  bypass: boolean;
  toggleBypass: Function;
}

export default function ModuleUI({
  name,
  unregisterModule,
  index,
  children,
  bypass,
  toggleBypass,
}: ModuleUIProps) {
  const [open, setOpen] = useState("item-1");
  const isOpen = open === "item-1";

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
                className="rounded-full"
                onClick={() => toggleBypass()}
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
          <div className="w-full flex flex-col gap-5 px-1 pt-2 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

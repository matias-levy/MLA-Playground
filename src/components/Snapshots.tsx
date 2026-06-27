"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowBigUp } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SnapshotsProps {
  numberOfSnapshots: number;
  currentSnapshot: number;
  setCurrentSnapshot: (snapshot: number) => void;
  onSaveSnapshot: (snapshot: number) => void;
}

const Snapshots = ({
  numberOfSnapshots,
  currentSnapshot,
  setCurrentSnapshot,
  onSaveSnapshot,
}: SnapshotsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (Number(e.key) <= numberOfSnapshots && Number(e.key) > 0) {
        handleSnapshotSelect(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [numberOfSnapshots, setCurrentSnapshot]);

  const handleSnapshotSelect = (snapshot: number) => {
    console.log("snapshot selected", snapshot);
    setCurrentSnapshot(snapshot);
  };

  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "w-full flex flex-col items-stretch border-1 px-6 py-2 rounded-3xl shadow-xl transition-all bg-card dark:border-card"
      )}
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <div className="flex flex-row justify-between items-center gap-4">
          <Label>Snapshots</Label>
          <AccordionTrigger />
        </div>
        <AccordionContent className="w-full flex flex-col gap-5 px-1 pt-2">
          <RadioGroup
            value={String(currentSnapshot)}
            onValueChange={(value) => handleSnapshotSelect(Number(value))}
            className="flex flex-row justify-stretch items-stretch gap-2"
          >
            {Array.from({ length: numberOfSnapshots }, (_, i) => {
              const num = String(i + 1);
              return (
                <RadioGroupPrimitive.Item
                  key={num}
                  value={String(i)}
                  aria-label={`Snapshot ${num}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "rounded-md border shadow-xs outline-none flex-1",
                    "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[state=checked]:hover:bg-primary/90",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:text-primary-foreground dark:data-[state=checked]:border-primary dark:data-[state=checked]:hover:bg-primary/90"
                  )}
                >
                  {num}
                </RadioGroupPrimitive.Item>
              );
            })}
          </RadioGroup>
          <div className="flex flex-row gap-2">
            {Array.from({ length: numberOfSnapshots }, (_, i) => {
              return (
                <Button
                  key={i}
                  variant="ghost"
                  className="flex-1"
                  onClick={() => onSaveSnapshot(i)}
                >
                  <ArrowBigUp />
                </Button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default Snapshots;

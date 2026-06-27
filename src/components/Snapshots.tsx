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
import { SerializedStack } from "@/lib/useSerialiazable";

export interface Snapshot {
  isDefaultSnapshot: boolean;
  content?: Omit<SerializedStack, "version" | "createdAt" | "snapshots">;
}

export const createDefaultSnapshots = (length: number): Snapshot[] => {
  return Array.from({ length }, (_, i) => ({
    isDefaultSnapshot: true,
    content: undefined,
  }));
};

interface SnapshotsProps {
  currentSnapshot: number;
  snapshots: Snapshot[];
  onSaveSnapshot: (snapshot: number) => void;
  onLoadSnapshot: (snapshot: number) => void;
}

const Snapshots = ({
  currentSnapshot,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
}: SnapshotsProps) => {
  const handleSnapshotSelect = (snapshot: number) => {
    onLoadSnapshot(snapshot);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (Number(e.key) <= snapshots.length && Number(e.key) > 0) {
        handleSnapshotSelect(Number(e.key) - 1);
      }
      if (e.key === "0") {
        onSaveSnapshot(currentSnapshot);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [snapshots.length, handleSnapshotSelect, onSaveSnapshot, currentSnapshot]);

  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "w-full flex flex-col items-stretch border-1 px-6 py-2 rounded-3xl shadow-xl transition-all bg-card dark:border-card"
      )}
    >
      <AccordionItem value="snapshots">
        <div className="flex flex-row justify-between items-center gap-4">
          <Label>Snapshots</Label>
          <AccordionTrigger />
        </div>
        <AccordionContent className="w-full flex flex-col gap-5 px-1 pt-2">
          <RadioGroup
            value={String(currentSnapshot)}
            className="flex flex-row justify-stretch items-stretch gap-2"
          >
            {snapshots.map((snapshot, i) => {
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
                    "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:text-primary-foreground dark:data-[state=checked]:border-primary dark:data-[state=checked]:hover:bg-primary/90",
                    snapshot.isDefaultSnapshot ? "opacity-50" : ""
                  )}
                  onClick={() => handleSnapshotSelect(i)}
                >
                  {num}
                </RadioGroupPrimitive.Item>
              );
            })}
          </RadioGroup>
          <div className="flex flex-row gap-2">
            {snapshots.map((_snapshot, i) => {
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

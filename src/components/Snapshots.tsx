"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowBigUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SerializedStack } from "@/lib/useSerialiazable";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import MappableButton from "@/components/mappables/MappableButton";
import { MappableRadioGroupPrimitiveItem } from "@/components/mappables/MappableRadioGroupItem";
import { useMidiMap } from "@/lib/useMidiMap";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Snapshot {
  isDefaultSnapshot: boolean;
  content?: Omit<
    SerializedStack,
    "version" | "createdAt" | "snapshots" | "midiMappings"
  >;
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
  const { isLearning } = useMidiMap();
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
        "w-full flex flex-col items-stretch border px-6 py-2 rounded-3xl shadow-xl transition-all bg-card dark:border-card"
      )}
    >
      <AccordionItem value="snapshots">
        <div className="flex flex-row justify-between items-center gap-4">
          <Label>Snapshots</Label>
          <div className="flex flex-row items-center gap-2">
            <Tooltip delayDuration={350}>
              <TooltipTrigger asChild>
                <MappableButton
                  className="rounded-full"
                  moduleId="snapshots"
                  moduleName="Snapshots"
                  paramName="Save any"
                  variant="ghost"
                  size="icon"
                  onAction={() => onSaveSnapshot(currentSnapshot)}
                >
                  <ArrowBigUp />
                </MappableButton>
              </TooltipTrigger>
              <TooltipContent>
                Save to the currently selected snapshot
              </TooltipContent>
            </Tooltip>

            <SnapshotInstructions />
            <AccordionTrigger />
          </div>
        </div>
        <AccordionContent className="w-full flex flex-col gap-5 px-1 pt-2">
          <RadioGroup
            value={String(currentSnapshot)}
            className="flex flex-row justify-stretch items-stretch gap-2"
          >
            {snapshots.map((snapshot, i) => {
              const num = String(i + 1);
              return (
                <MappableRadioGroupPrimitiveItem
                  moduleId="snapshots"
                  moduleName="Snapshots"
                  paramName={`Snapshot ${num}`}
                  onAction={() => handleSnapshotSelect(i)}
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
                >
                  {num}
                </MappableRadioGroupPrimitiveItem>
              );
            })}
          </RadioGroup>
          <div className="flex flex-row gap-2">
            {snapshots.map((_snapshot, i) => {
              return (
                <MappableButton
                  moduleId="snapshots"
                  moduleName="Snapshots"
                  paramName={`Save ${i + 1}`}
                  key={i}
                  variant="ghost"
                  className="flex-1"
                  onAction={() => onSaveSnapshot(i)}
                >
                  <ArrowBigUp />
                </MappableButton>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const SnapshotInstructions = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>The Snapshots Module</DialogTitle>
        </DialogHeader>
        <div className="text-sm flex flex-col gap-4">
          <p>
            The Playground now allows you to save and load up to 8 snapshots of
            your audio chains and input configurations per project.
          </p>
          <p>
            To save a snapshot, press the <b>↑</b> button below the snapshot you
            want to save. To load a snapshot, press the number of the snapshot
            you want to load. If you save a snapshot while an audio file is
            playing, loading the snapshop will trigger the audio file to play
            again.
          </p>
          <p>
            You can also use the keyboard to load a snapshot. Simply press the
            numbers 1-8 to load the corresponding snapshot. You can also save a
            snapshot to the currently selected slot by pressing number 0.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Snapshots;

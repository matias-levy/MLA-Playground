import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import Distortion from "@/components/modules/Distortion";
import Delay from "@/components/modules/Delay";
import BitCrush from "@/components/modules/BitCrush";
import Tremolo from "@/components/modules/Tremolo";
import Utility from "@/components/modules/Utility";
import AutoPan from "@/components/modules/AutoPan";
import Compressor from "@/components/modules/Compressor";
import Filter from "@/components/modules/Filter";
import Convolver from "@/components/modules/Convolver";
import RNBO from "@/components/modules/RNBO";
import Splitter from "@/components/modules/Splitter";
import Group from "@/components/modules/Group";
import { AudioModuleComponent } from "@/components/Chain";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const availableModules: Record<string, AudioModuleComponent> = {
  Distortion,
  "Delay / Time Modulation": Delay,
  "Bit Crush": BitCrush,
  Tremolo,
  Utility,
  "Auto Pan": AutoPan,
  Compressor,
  Filter,
  "Reverb / Convolver": Convolver,
  RNBO,
  Group,
  Splitter,
};

export default function AddModule({
  registerModule,
  shouldAllowSplitter,
}: {
  registerModule: Function;
  shouldAllowSplitter?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const modules = Object.entries(availableModules)
    .filter(([name]) => shouldAllowSplitter || name !== "Splitter")
    .sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="relative group w-full flex flex-col items-center gap-5 border-1 text-muted-foreground border-border p-6 rounded-3xl shadow-xl hover:text-foreground transition-all duration-300 hover:pb-11 bg-card dark:border-card z-10 hover:cursor-pointer">
        <Plus />

        <h3 className="group-hover:scale-y-100 scale-y-0 group-hover:opacity-100 opacity-0 transition-all absolute top-12 origin-top">
          Add module
        </h3>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add module</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {modules.map(([name, component]) => (
            <Button
              key={name}
              variant="secondary"
              onClick={() => {
                registerModule(component);
                setOpen(false);
              }}
            >
              {name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

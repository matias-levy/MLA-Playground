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
import Tremolo from "./modules/Tremolo";
import Splitter from "@/components/modules/Splitter";
import { AudioModuleComponent } from "@/components/Chain";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const availableModules: AudioModuleComponent[] = [
  Distortion,
  Delay,
  BitCrush,
  Tremolo,
  Splitter,
];

const availableModulesNames: String[] = [
  "Distortion",
  "Delay",
  "Bit Crush",
  "Tremolo",
  "Splitter",
];

export default function AddModule({
  registerModule,
  shouldAllowSplitter,
}: {
  registerModule: Function;
  shouldAllowSplitter?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const modulesArray = shouldAllowSplitter
    ? availableModules
    : availableModules.slice(0, -1);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="relative group w-full flex flex-col items-center gap-5 border-1 text-gray-400 border-gray-200 p-6 rounded-3xl shadow-xl shadow-gray-100 hover:text-gray-800 transition-all hover:scale-105 duration-300 hover:pb-11">
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
          {modulesArray.map((Module, i) => (
            <Button
              key={i}
              onClick={() => {
                registerModule(Module);
                setOpen(false);
              }}
            >
              {availableModulesNames[i]}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

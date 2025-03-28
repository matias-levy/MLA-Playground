import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import Distortion from "./Distortion";
import Delay from "./Delay";
import BitCrush from "./BitCrush";
import { AudioModuleComponent } from "./Stack";
import { Button } from "./ui/button";

import { useState } from "react";

const availableModules: AudioModuleComponent[] = [Distortion, Delay, BitCrush];

export default function AddModule({
  registerModule,
}: {
  registerModule: Function;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="relative group w-full flex flex-col items-center gap-5 border-1 text-gray-400 border-gray-200 p-6 rounded-3xl shadow-xl shadow-gray-100 hover:text-gray-800 transition-all hover:scale-105 duration-300 hover:pb-11">
        <Plus />

        <h3 className="group-hover:scale-y-100 scale-y-0 group-hover:opacity-100 opacity-0 transition-all absolute top-12 origin-top">
          Add module
        </h3>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add module</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {availableModules.map((Module, i) => (
            <Button
              key={i}
              onClick={() => {
                registerModule(Module);
                setOpen(false);
              }}
            >
              {Module.name || "Unknown Module"}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

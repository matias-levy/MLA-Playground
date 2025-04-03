import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "w-full flex flex-col items-stretch border-1 px-6 py-2 rounded-3xl shadow-xl transition-all",
        bypass && "opacity-50 transition-all"
      )}
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
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
        <AccordionContent className="w-full flex flex-col gap-5 px-1 pt-2">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

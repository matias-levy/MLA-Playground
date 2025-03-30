import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface ModuleUIProps {
  name: string;
  unregisterModule: (index: number) => void;
  index: number;
  children: React.ReactNode;
}

export default function ModuleUI({
  name,
  unregisterModule,
  index,
  children,
}: ModuleUIProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full flex flex-col items-stretch border-1 px-6 py-2 rounded-3xl shadow-xl"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <div className="flex flex-row justify-between items-center gap-5">
          <Label>{name}</Label>
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
        <AccordionContent className="w-full flex flex-col gap-5 px-1">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

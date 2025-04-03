import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleStop, CirclePlay, Download, ArrowUpFromDot } from "lucide-react";

export default function RecorderSkeleton() {
  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl bg-white">
      <Label>Recorder</Label>
      <div className="flex flex-row gap-2 justify-between items-stretch">
        <Button className="grow">
          Start
          <CirclePlay />
        </Button>
        <Button className="grow" disabled={true}>
          Stop
          <CircleStop />
        </Button>
      </div>
      <div className="flex flex-row justify-between items-center gap-2">
        <audio controls className="grow rounded-md invert min-w-0" />
        <Label className="w-14 text-center block">00:00</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled={true}>
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download recording</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled={true}>
                <ArrowUpFromDot />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Feedback into file input</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

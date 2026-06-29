import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Info } from "lucide-react";
import { ModeToggle } from "@/app/theme-provider";
import { FolderOpen, Save } from "lucide-react";
import MidiMapping from "./MidiMapping";

const Header = ({
  saveProjectFile,
  handleFileChange,
}: {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveProjectFile: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex flex-row justify-between w-full">
      <h1 className="font-bold text-2xl mb-4">
        <b>MLA Labs'</b>{" "}
        <u className="underline-offset-8 decoration-2">no-nonsense</u> audio
        playground
      </h1>
      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Info />
            </Button>
          </DialogTrigger>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>The Playground</DialogTitle>
              <DialogDescription>
                Just a few tips to get you started
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm flex flex-col gap-4">
              <p>
                {
                  "Choose any input device, your microphone, a synth, or even a noisy fan and run it through the playground’s effects. Or, if you’re feeling adventurous, upload any file (yes, even an image or text file!) in the File tab and explore how it sounds when looped, detuned, or warped with different playback rates."
                }
              </p>
              <p>
                {
                  "Need inspiration? Log in with FreeSound and dive into their massive collection of samples. You might stumble upon the perfect starting point!"
                }
              </p>
              <p>
                {
                  "With a variety of effects at your fingertips, tweak, twist, and shape the sound in real-time. Once you’ve crafted something unique, try recording it! You can then download your creation or reintroduce it as an input to push your experiment even further."
                }
              </p>
              <p>{"No rules, just sonic exploration."}</p>
            </div>
          </DialogContent>
        </Dialog>
        <ModeToggle />
        <MidiMapping />
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={saveProjectFile}
        >
          <Save />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".playgroundproject"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default Header;

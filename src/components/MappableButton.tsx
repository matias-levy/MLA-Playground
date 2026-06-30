import { ComponentProps, useState } from "react";
import { Button } from "./ui/button";
import { useMidiParam } from "@/lib/useMidiMap";
import { cn } from "@/lib/utils";

type MappableButtonProps = ComponentProps<typeof Button> & {
  moduleId: string;
  moduleName: string;
  paramName: string;
  onAction: () => void;
};

const MappableButton = ({
  moduleId,
  moduleName,
  paramName,
  onAction,
  ...props
}: MappableButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isLearning, isSelected, onLearnClick } = useMidiParam({
    moduleId,
    moduleName,
    paramName,
    min: 0,
    max: 127,
    onCC: (value: number) => {
      if (!props.disabled) {
        if (value >= 64 && !isPressed) {
          onAction();
          setIsPressed(true);
        } else if (value < 64 && isPressed) {
          setIsPressed(false);
        }
      }
    },
    onNoteOn: () => {
      if (!props.disabled) onAction();
    },
  });

  const handleClick = () => {
    if (isLearning) {
      onLearnClick();
    } else {
      onAction();
    }
  };

  return (
    <Button
      {...props}
      disabled={isLearning ? false : props.disabled}
      onClick={handleClick}
      className={cn(
        props.className,
        isSelected && "ring-2 ring-muted-foreground",
        isLearning && "cursor-pointer"
      )}
    >
      {props.children}
    </Button>
  );
};

export default MappableButton;

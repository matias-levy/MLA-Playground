import { useState } from "react";
import { useMidiParam } from "@/lib/useMidiMap";
import { cn } from "@/lib/utils";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

type MappableRadioGroupItemProps = RadioGroupPrimitive.RadioGroupItemProps & {
  moduleId: string;
  moduleName: string;
  paramName: string;
  onAction: () => void;
};

const MappableRadioGroupItem = ({
  moduleId,
  moduleName,
  paramName,
  onAction,
  ...props
}: MappableRadioGroupItemProps) => {
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
    <RadioGroupPrimitive.Item
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
    </RadioGroupPrimitive.Item>
  );
};

export default MappableRadioGroupItem;

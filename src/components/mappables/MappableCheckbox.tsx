import { Checkbox } from "@/components/ui/checkbox";
import { useMidiParam } from "@/lib/useMidiMap";
import { ComponentProps, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckedState } from "@radix-ui/react-checkbox";

type MappableCheckboxProps = ComponentProps<typeof Checkbox> & {
  moduleId: string;
  moduleName: string;
  paramName: string;
  onAction: (checked: CheckedState) => void;
};

export const MappableCheckbox = ({
  moduleId,
  moduleName,
  paramName,
  onAction,
  ...props
}: MappableCheckboxProps) => {
  const [checked, setChecked] = useState(false);
  const { isLearning, isSelected, onLearnClick } = useMidiParam({
    moduleId,
    moduleName,
    paramName,
    min: 0,
    max: 127,
    onCC: (value: number) => {
      if (!props.disabled) {
        if (value >= 64 && !checked) {
          onAction(true);
          setChecked(true);
        } else if (value < 64 && checked) {
          onAction(false);
          setChecked(false);
        }
      }
    },
    onNoteOn: () => {
      if (!props.disabled) {
        onAction(!checked);
        setChecked(!checked);
      }
    },
  });

  const handleCheckedChange = (checked: CheckedState) => {
    if (isLearning) {
      onLearnClick();
    } else {
      onAction(checked);
      if (checked !== "indeterminate") {
        setChecked(checked);
      }
    }
  };

  return (
    <Checkbox
      {...props}
      onCheckedChange={handleCheckedChange}
      disabled={isLearning ? false : props.disabled}
      className={cn(
        props.className,
        isSelected && "ring-2 ring-muted-foreground",
        isLearning && "cursor-pointer"
      )}
    />
  );
};

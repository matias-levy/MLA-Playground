"use client";

import { useState, useEffect } from "react";

import AddModule from "@/components/AddModule";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

import useAudioChain from "@/lib/useAudioChain";
import { useAudioContext, AudioModule } from "@/components/AudioProvider";

import { GripHorizontal } from "lucide-react";

export interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide the original while dragging
  };

  return (
    <div
      className="w-full bg-white relative rounded-3xl"
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="absolute left-1/2 transform -translate-x-1/2 mt-5"
      >
        <GripHorizontal className="text-gray-400" />
      </div>
      {props.children}
    </div>
  );
}

export interface AudioModuleProps {
  index: number;
  unregisterModule: (index: number) => void;
  addModule: (module: AudioModule, index: number) => void;
  removeModule: (module: AudioModule) => void;
}

export interface AudioModuleStateType {
  id: string;
  Component: AudioModuleComponent;
}

export type AudioModuleComponent = React.FC<AudioModuleProps>;

function Chain({
  shouldAllowSplitter,
  input,
  output,
}: {
  shouldAllowSplitter?: boolean;
  input: AudioNode | null;
  output: AudioNode | null;
}) {
  const { audioContext: ctx } = useAudioContext();
  const { setInput, addModule, removeModule, setOutput } = useAudioChain({
    ctx,
  });
  const [modules, setModules] = useState<AudioModuleStateType[]>([]);
  const [dragging, setDragging] = useState(false);
  const [activeModule, setActiveModule] = useState<
    AudioModuleStateType | null | undefined
  >(null);

  useEffect(() => {
    setInput(input);
    setOutput(output);
  }, [input, output]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function registerModule(Module: AudioModuleComponent) {
    setModules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), Component: Module },
    ]);
  }

  function unregisterModule(index: number) {
    setModules((prevModules) => prevModules.filter((_, i) => i !== index));
  }

  function handleDragStart(event: DragStartEvent) {
    if (!event.active) return;
    // Find the module being dragged
    const module = modules.find((m) => m.id === event.active.id);
    setActiveModule(module);
    setDragging(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(false);

    if (!active || !over || active.id === over.id) {
      return;
    }

    setModules((items) => {
      const oldIndex = items.findIndex((Module) => Module.id === active.id);
      const newIndex = items.findIndex((Module) => Module.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return items; // Prevent invalid moves

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <div
          className={
            dragging
              ? "bg-gray-200 w-full py-5 rounded-3xl transition-all flex flex-col gap-4"
              : "w-full rounded-3xl transition-all flex flex-col gap-4"
          }
        >
          <SortableContext
            items={modules}
            strategy={verticalListSortingStrategy}
          >
            {modules.map(({ id, Component }, i) => {
              return (
                <SortableItem key={id} id={id}>
                  <Component
                    index={i}
                    unregisterModule={unregisterModule}
                    addModule={addModule}
                    removeModule={removeModule}
                  />
                </SortableItem>
              );
            })}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeModule ? (
            <div className="w-full bg-white relative rounded-3xl opacity-50">
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-6">
                <GripHorizontal className="text-gray-400" />
              </div>
              <activeModule.Component
                index={-1}
                unregisterModule={() => {}}
                addModule={() => {}}
                removeModule={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <hr className="h-px w-full bg-gray-200 border-0 dark:bg-gray-700 rounded-2xl" />
      <AddModule
        registerModule={registerModule}
        shouldAllowSplitter={shouldAllowSplitter}
      />
    </div>
  );
}

export default Chain;

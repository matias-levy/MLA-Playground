"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MidiCommand, parseMidiMessage } from "@/utils/MidiParser";
import { logSliderPosToLinear } from "@/utils/conversion";

export interface MidiParamHandle {
  paramId: string;
  moduleId: string;
  moduleName: string;
  paramName: string;
  setValue: (value: number) => void;
  min: number;
  max: number;
  logScale?: boolean;
}

export interface MidiMappingEntry {
  paramId: string;
  channel: number;
  command: MidiCommand;
  cc: number;
  range: [number, number]; // [min, max] in percentage; max < min inverts
  isInverted: boolean;
}

interface MidiMapContextValue {
  midiInstance: MIDIAccess | null;
  midiInputs: MidiInputMap;
  setMidiInputStatus: (inputId: string, enabled: boolean) => void;
  isLearning: boolean;
  pendingParamId: string | null;
  mappings: MidiMappingEntry[];
  startLearning: () => void;
  cancelLearning: () => void;
  selectParam: (paramId: string) => void;
  registerParam: (handle: MidiParamHandle) => () => void;
  removeMapping: (paramId: string) => void;
  updateMappingRange: (paramId: string, newRange: [number, number]) => void;
  invertMappingRange: (paramId: string) => void;
  handleMidiMessage: (
    channel: number,
    command: MidiCommand,
    cc: number,
    value: number
  ) => void;
  getParam: (paramId: string) => MidiParamHandle | undefined;
}

const MidiMapContext = createContext<MidiMapContextValue | null>(null);

function scaleNumberClamped(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  const result =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  const lo = Math.min(outMin, outMax);
  const hi = Math.max(outMin, outMax);
  return Math.max(lo, Math.min(hi, result));
}

function applyMidiValue(
  handle: MidiParamHandle,
  midiValue: number,
  mapping: MidiMappingEntry
) {
  const normalized = midiValue / 127;
  const min = mapping.isInverted ? mapping.range[1] : mapping.range[0];
  const max = mapping.isInverted ? mapping.range[0] : mapping.range[1];

  const scaledNormalized = scaleNumberClamped(
    normalized,
    0,
    1,
    min / 100,
    max / 100
  );
  if (handle.logScale) {
    handle.setValue(
      logSliderPosToLinear(scaledNormalized, handle.min, handle.max)
    );
  } else {
    handle.setValue(handle.min + scaledNormalized * (handle.max - handle.min));
  }
}

interface MidiInputMap {
  [key: string]: {
    MIDIInput: MIDIInput;
    enabled: boolean;
  };
}

export function MidiMapProvider({ children }: { children: React.ReactNode }) {
  const [midiInstance, setMidiInstance] = useState<MIDIAccess | null>(null);
  const [midiInputs, setMidiInputs] = useState<MidiInputMap>({});

  useEffect(() => {
    if (typeof navigator !== "undefined" && "requestMIDIAccess" in navigator) {
      navigator.requestMIDIAccess().then((midi) => {
        setMidiInstance(midi);
        setMidiInputs(
          Object.fromEntries(
            Array.from(midi.inputs.values()).map((input) => [
              input.id,
              { MIDIInput: input, enabled: false },
            ])
          )
        );
      });
    }
  }, []);

  const [isLearning, setIsLearning] = useState(false);
  const [pendingParamId, setPendingParamId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<MidiMappingEntry[]>([]);
  const paramsRef = useRef(new Map<string, MidiParamHandle>());

  const registerParam = useCallback((handle: MidiParamHandle) => {
    paramsRef.current.set(handle.paramId, handle);
    return () => {
      paramsRef.current.delete(handle.paramId);
    };
  }, []);

  const getParam = useCallback(
    (paramId: string) => paramsRef.current.get(paramId),
    []
  );

  const startLearning = useCallback(() => {
    setIsLearning(true);
    setPendingParamId(null);
  }, []);

  const cancelLearning = useCallback(() => {
    setIsLearning(false);
    setPendingParamId(null);
  }, []);

  const selectParam = useCallback((paramId: string) => {
    setPendingParamId(paramId);
  }, []);

  const removeMapping = useCallback((paramId: string) => {
    setMappings((prev) => prev.filter((m) => m.paramId !== paramId));
  }, []);

  const updateMappingRange = useCallback(
    (paramId: string, newRange: [number, number]) => {
      setMappings((prev) =>
        prev.map((m) => {
          if (m.paramId !== paramId) return m;
          return { ...m, range: newRange };
        })
      );
    },
    []
  );

  const invertMappingRange = useCallback((paramId: string) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.paramId !== paramId) return m;
        return { ...m, isInverted: !m.isInverted };
      })
    );
  }, []);

  const setMidiInputStatus = useCallback(
    (inputId: string, enabled: boolean) => {
      setMidiInputs((prev) => ({
        ...prev,
        [inputId]: {
          ...prev[inputId],
          enabled,
        },
      }));
    },
    []
  );

  const handleMidiMessage = useCallback(
    (channel: number, command: MidiCommand, cc: number, value: number) => {
      if (command !== "controlChange") return;

      if (isLearning && pendingParamId) {
        setMappings((prev) => [
          ...prev.filter((m) => !(m.paramId === pendingParamId)),
          {
            paramId: pendingParamId,
            channel,
            command,
            cc,
            range: [0, 100],
            isInverted: false,
          },
        ]);
        setIsLearning(false);
        setPendingParamId(null);
        return;
      }

      const matchingMappings = mappings.filter(
        (m) => m.channel === channel && m.command === command && m.cc === cc
      );
      if (matchingMappings.length === 0) return;

      for (const mapping of matchingMappings) {
        const handle = paramsRef.current.get(mapping.paramId);
        if (handle) applyMidiValue(handle, value, mapping);
      }
    },
    [isLearning, pendingParamId, mappings]
  );

  useEffect(() => {
    const callback = (msg: MIDIMessageEvent) => {
      const parsedMessage = parseMidiMessage(Array.from(msg.data ?? []));

      if (
        parsedMessage.command === "controlChange" &&
        parsedMessage.data.length >= 2
      ) {
        handleMidiMessage(
          parsedMessage.channel,
          parsedMessage.command,
          parsedMessage.data[0],
          parsedMessage.data[1]
        );
      }
    };

    if (midiInstance && midiInputs) {
      Object.entries(midiInputs).forEach(([_id, input]) => {
        if (input.enabled) {
          input.MIDIInput.onmidimessage = callback;
        }
      });
    }

    return () => {
      if (midiInstance && midiInputs) {
        Object.entries(midiInputs).forEach(([_id, input]) => {
          if (input.enabled) {
            input.MIDIInput.onmidimessage = null;
          }
        });
      }
    };
  }, [mappings, midiInputs, midiInstance, handleMidiMessage]);

  const value = useMemo(
    () => ({
      midiInstance,
      midiInputs,
      setMidiInputStatus,
      isLearning,
      pendingParamId,
      mappings,
      startLearning,
      cancelLearning,
      selectParam,
      registerParam,
      removeMapping,
      updateMappingRange,
      invertMappingRange,
      handleMidiMessage,
      getParam,
    }),
    [
      midiInstance,
      midiInputs,
      setMidiInputStatus,
      isLearning,
      pendingParamId,
      mappings,
      startLearning,
      cancelLearning,
      selectParam,
      registerParam,
      removeMapping,
      updateMappingRange,
      invertMappingRange,
      handleMidiMessage,
      getParam,
    ]
  );

  return (
    <MidiMapContext.Provider value={value}>{children}</MidiMapContext.Provider>
  );
}

export function useMidiMap() {
  const ctx = useContext(MidiMapContext);
  if (!ctx) {
    throw new Error("useMidiMap must be used within a MidiMapProvider");
  }
  return ctx;
}

export function useMidiParam({
  moduleId,
  moduleName,
  paramName,
  setValue,
  min,
  max,
  logScale,
}: Omit<MidiParamHandle, "paramId">) {
  const { registerParam, isLearning, pendingParamId, selectParam } =
    useMidiMap();
  const paramId = `${moduleId}:${paramName}`;
  const setValueRef = useRef(setValue);

  useEffect(() => {
    setValueRef.current = setValue;
  }, [setValue]);

  useEffect(() => {
    if (moduleId === "dragging-module") return;
    return registerParam({
      paramId,
      moduleId,
      moduleName,
      paramName,
      setValue: (value) => setValueRef.current(value),
      min,
      max,
      logScale,
    });
  }, [
    paramId,
    moduleId,
    moduleName,
    paramName,
    min,
    max,
    logScale,
    registerParam,
  ]);

  return {
    isLearning,
    isSelected: pendingParamId === paramId,
    onLearnClick: () => {
      if (isLearning) selectParam(paramId);
    },
    paramId,
    label: `${moduleName} · ${paramName}`,
  };
}

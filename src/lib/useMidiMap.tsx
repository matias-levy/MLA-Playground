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
  onCC?: (value: number, mapping: MidiMappingEntry) => void;
  onNoteOn?: (mapping: MidiMappingEntry) => void;
  min: number;
  max: number;
  logScale?: boolean;
}

export interface MidiMappingEntry {
  paramId: string;
  moduleId: string;
  moduleName: string;
  paramName: string;
  channel: number;
  command: MidiCommand;
  data1: number;
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
  setMappings: (mappings: MidiMappingEntry[]) => void;
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
    data1: number,
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

function paramValueFromNormalized(normalized: number, handle: MidiParamHandle) {
  if (handle.logScale) {
    return logSliderPosToLinear(normalized, handle.min, handle.max);
  }
  return handle.min + normalized * (handle.max - handle.min);
}

function getMappingRangePercentages(mapping: MidiMappingEntry) {
  return {
    min: mapping.isInverted ? mapping.range[1] : mapping.range[0],
    max: mapping.isInverted ? mapping.range[0] : mapping.range[1],
  };
}

function getMappingParamRange(
  mapping: MidiMappingEntry,
  paramMin: number,
  paramMax: number,
  logScale?: boolean
) {
  const { min, max } = getMappingRangePercentages(mapping);
  const handle = { min: paramMin, max: paramMax, logScale } as MidiParamHandle;
  return {
    low: paramValueFromNormalized(min / 100, handle),
    high: paramValueFromNormalized(max / 100, handle),
  };
}

function applyMidiValue(
  handle: MidiParamHandle,
  mapping: MidiMappingEntry,
  command: MidiCommand,
  midiValue: number
) {
  const { min, max } = getMappingRangePercentages(mapping);

  if (command === "controlChange") {
    const scaledNormalized = scaleNumberClamped(
      midiValue / 127,
      0,
      1,
      min / 100,
      max / 100
    );
    handle.onCC?.(paramValueFromNormalized(scaledNormalized, handle), mapping);
  } else if (command === "noteOn") {
    handle.onNoteOn?.(mapping);
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
    (channel: number, command: MidiCommand, data1: number, value: number) => {
      if (command !== "controlChange" && command !== "noteOn") return;

      if (isLearning && pendingParamId) {
        const param = getParam(pendingParamId);
        if (!param) return;
        setMappings((prev) => [
          ...prev.filter((m) => !(m.paramId === pendingParamId)),
          {
            paramId: pendingParamId,
            moduleId: param.moduleId,
            moduleName: param.moduleName,
            paramName: param.paramName,
            channel,
            command,
            data1,
            range: [0, 100],
            isInverted: false,
          },
        ]);
        setIsLearning(false);
        setPendingParamId(null);
        return;
      }

      const matchingMappings = mappings.filter(
        (m) =>
          m.channel === channel && m.command === command && m.data1 === data1
      );
      if (matchingMappings.length === 0) return;

      for (const mapping of matchingMappings) {
        const handle = paramsRef.current.get(mapping.paramId);
        if (handle) applyMidiValue(handle, mapping, command, value);
      }
    },
    [isLearning, pendingParamId, mappings]
  );

  useEffect(() => {
    const callback = (msg: MIDIMessageEvent) => {
      const parsedMessage = parseMidiMessage(Array.from(msg.data ?? []));

      if (parsedMessage.command && parsedMessage.data.length >= 2) {
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
      setMappings,
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
      setMappings,
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

export { getMappingParamRange };

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
  onCC,
  onNoteOn,
  min,
  max,
  logScale,
}: Omit<MidiParamHandle, "paramId">) {
  const { registerParam, isLearning, pendingParamId, selectParam } =
    useMidiMap();
  const paramId = `${moduleId}:${paramName}`;
  const onCCRef = useRef(onCC);
  const onNoteOnRef = useRef(onNoteOn);

  useEffect(() => {
    onCCRef.current = onCC;
    onNoteOnRef.current = onNoteOn;
  }, [onCC, onNoteOn]);

  useEffect(() => {
    if (moduleId === "dragging-module") return;
    return registerParam({
      paramId,
      moduleId,
      moduleName,
      paramName,
      onCC: (value, mapping) => onCCRef.current?.(value, mapping),
      onNoteOn: (mapping) => onNoteOnRef.current?.(mapping),
      min,
      max,
      logScale,
    });
  }, [
    paramId,
    moduleId,
    moduleName,
    paramName,
    onCC,
    onNoteOn,
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

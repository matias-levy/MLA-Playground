// Parse Uint8Array to MIDI message

export type MidiCommand =
  | "noteOn"
  | "noteOff"
  | "polyphonicKeyPressure"
  | "controlChange"
  | "programChange"
  | "afterTouch"
  | "pitchBend";

export interface MidiMessage {
  channel: number;
  command: MidiCommand | null;
  data: number[];
}

export function parseMidiMessage(data: number[]): MidiMessage {
  const statusByte = data[0];
  const intCommand = (statusByte & 0xf0) >>> 4;
  const channel = (statusByte & 0x0f) + 1;
  let command: MidiCommand | null = null;
  switch (intCommand) {
    case 0b1000:
      command = "noteOff";
      break;
    case 0b1001:
      command = "noteOn";
      break;
    case 0b1010:
      command = "polyphonicKeyPressure";
      break;
    case 0b1011:
      command = "controlChange";
      break;
    case 0b1100:
      command = "programChange";
      break;
    case 0b1101:
      command = "afterTouch";
      break;
    case 0b1110:
      command = "pitchBend";
      break;
  }
  return {
    channel: channel,
    command: command,
    data: Array.from(data.slice(1)),
  };
}

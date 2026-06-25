export function convertUint8ToFloat32(
  uint8Array: Uint8Array,
  byte1: boolean
): Float32Array<ArrayBuffer> {
  if (byte1) {
    const buffer = new ArrayBuffer(Math.floor(uint8Array.length / 4) * 4);
    const float32Array = new Float32Array(buffer);
    for (let i = 0; i < uint8Array.length; i++) {
      float32Array[i] = (uint8Array[i] - 128) / 128; // Convert 8-bit PCM to -1 to 1 range
    }
    return float32Array;
  } else {
    if (uint8Array.length % 4 !== 0) {
      console.warn(
        "Uint8Array length is not a multiple of 4; truncating extra bytes."
      );
    }

    const byteLength = Math.floor(uint8Array.length / 4) * 4;
    const buffer = new ArrayBuffer(byteLength);
    new Uint8Array(buffer).set(uint8Array.subarray(0, byteLength));
    const float32Array = new Float32Array(buffer);

    // Clamp values between -1 and 1
    for (let i = 0; i < float32Array.length; i++) {
      float32Array[i] = Math.max(-1, Math.min(1, float32Array[i]));
    }

    return float32Array;
  }
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  return 20 * Math.log10(linear);
}

const LOG_SLIDER_FLOOR_DB = -60;

function logSliderMinDb(min: number): number {
  return min > 0 ? linearToDb(min) : LOG_SLIDER_FLOOR_DB;
}

/** Map a linear amplitude to normalized slider position (0–1) on a log (dB) scale. */
export function linearToLogSliderPos(
  value: number,
  min: number,
  max: number
): number {
  if (value <= min) return 0;
  const minDb = logSliderMinDb(min);
  const maxDb = linearToDb(max);
  return (linearToDb(value) - minDb) / (maxDb - minDb);
}

/** Map normalized slider position (0–1) back to a linear amplitude. */
export function logSliderPosToLinear(
  pos: number,
  min: number,
  max: number
): number {
  if (pos <= 0) return min;
  const minDb = logSliderMinDb(min);
  const maxDb = linearToDb(max);
  const value = dbToLinear(minDb + pos * (maxDb - minDb));
  return Math.min(max, Math.max(min, value));
}

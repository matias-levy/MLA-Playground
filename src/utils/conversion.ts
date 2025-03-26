export function convertUint8ToFloat32(uint8Array: Uint8Array, byte1: boolean) {
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

    // Create a new ArrayBuffer that shares the same binary data
    const buffer = uint8Array.buffer.slice(
      0,
      Math.floor(uint8Array.length / 4) * 4
    );

    // Create a Float32Array that views the same memory
    return new Float32Array(buffer);
  }
}

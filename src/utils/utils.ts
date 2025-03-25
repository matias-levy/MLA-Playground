export function createSafeAudioNode<T extends AudioNode>(
  ctx: AudioContext | null,
  factory: (ctx: AudioContext) => T
): T | null {
  if (!ctx) return null; // If no context, return null (e.g., during SSR)
  return factory(ctx);
}

const durations = new Map<string, number>();

export async function decodeAudioDuration(bytes: ArrayBuffer) {
  // Decode in the background at a low sample rate to keep long recordings economical.
  const context = new OfflineAudioContext(1, 1, 8_000);
  const audio = await context.decodeAudioData(bytes);
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    throw new Error("Duração do áudio indisponível.");
  }
  return audio.duration;
}

export async function getAudioDuration(source: string, signal: AbortSignal) {
  const cached = durations.get(source);
  if (cached !== undefined) return cached;
  const response = await fetch(source, { signal });
  if (!response.ok) throw new Error("Não foi possível ler o áudio.");
  const duration = await decodeAudioDuration(await response.arrayBuffer());
  if (!signal.aborted) {
    if (durations.size >= 32) durations.delete(durations.keys().next().value!);
    durations.set(source, duration);
  }
  return duration;
}

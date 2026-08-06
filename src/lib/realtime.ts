/**
 * Realtime channel topics must be unique per subscriber instance.
 * supabase.channel(topic) returns an EXISTING channel when the topic matches,
 * and adding `.on("postgres_changes", ...)` to an already-subscribed channel
 * throws: "cannot add `postgres_changes` callbacks ... after `subscribe()`".
 * Two components using the same hook would otherwise collide.
 */
export function rtTopic(base: string): string {
  return `${base}:${Math.random().toString(36).slice(2, 10)}`;
}

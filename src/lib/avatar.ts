import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";

const cache = new Map<string, Promise<string | null>>();

/** Resolve a stored avatar value (storage path OR legacy absolute URL) to a displayable src. */
export function resolveAvatar(value: string | null | undefined): Promise<string | null> {
  if (!value) return Promise.resolve(null);
  if (/^(https?:|data:|blob:)/.test(value)) return Promise.resolve(value);
  const hit = cache.get(value);
  if (hit) return hit;
  const p = supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(value, 60 * 60 * 24)
    .then(({ data }) => data?.signedUrl ?? null)
    .catch(() => null);
  cache.set(value, p);
  return p;
}

export function forgetAvatar(value: string | null | undefined) {
  if (value) cache.delete(value);
}

/** Live src for a single stored avatar value. */
export function useAvatarSrc(value: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!value) { setSrc(null); return; }
    void resolveAvatar(value).then((u) => { if (alive) setSrc(u); });
    return () => { alive = false; };
  }, [value]);
  return src;
}

/** Live src map for many stored avatar values (admin lists, chat, reviews). */
export function useAvatarSrcMap(values: (string | null | undefined)[]) {
  const key = values.filter(Boolean).join("|");
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    const list = key ? key.split("|") : [];
    void Promise.all(list.map(async (v) => [v, await resolveAvatar(v)] as const)).then((pairs) => {
      if (!alive) return;
      const next: Record<string, string> = {};
      for (const [k, v] of pairs) if (v) next[k] = v;
      setMap(next);
    });
    return () => { alive = false; };
  }, [key]);
  return map;
}

export function initialsOf(name?: string | null, fallback = "B") {
  const src = (name ?? "").trim();
  if (!src) return fallback.slice(0, 2).toUpperCase();
  const parts = src.split(/\s+/);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : src.slice(0, 2);
  return letters.toUpperCase();
}

// Recovers from stale-deployment chunk errors.
// After a new deploy, a cached HTML document can still reference hashed asset
// files that no longer exist, producing:
//   "Failed to fetch dynamically imported module: .../assets/index-XXXX.js"
// The only real fix is a hard reload against the fresh document. We reload at
// most once per session so we can never loop.

const RELOAD_FLAG = "biluxs:chunk-reload";

function isStaleChunkError(value: unknown): boolean {
  const message =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? `${value.name}: ${value.message}`
        : "";
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

function reloadOnce() {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // sessionStorage unavailable — fall through and reload anyway.
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString(36));
  window.location.replace(url.toString());
}

export function installChunkRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    if (isStaleChunkError(event.error ?? event.message)) reloadOnce();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isStaleChunkError(event.reason)) reloadOnce();
  });
}

export function isChunkLoadError(error: unknown) {
  return isStaleChunkError(error);
}

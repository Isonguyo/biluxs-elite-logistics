import { useState } from "react";
import { useAvatarSrc, initialsOf } from "@/lib/avatar";

type Props = {
  /** stored avatar value: storage path or absolute URL */
  value?: string | null;
  /** already-resolved src (e.g. from useAvatarSrcMap or a local preview) */
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  rounded?: boolean;
};

/** Identity avatar with initials fallback. Never renders a broken image. */
export function Avatar({ value, src, name, size = 40, className = "", rounded = true }: Props) {
  const resolved = useAvatarSrc(src ? null : value);
  const [failed, setFailed] = useState(false);
  const url = src ?? resolved;
  const show = url && !failed;

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
      className={`shrink-0 grid place-items-center overflow-hidden border border-gold/70 bg-white/[0.04] text-gold font-display leading-none ${rounded ? "rounded-full" : ""} ${className}`}
    >
      {show ? (
        <img
          src={url}
          alt={name ? `${name} profile photo` : "Profile photo"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AVATAR_BUCKET, forgetAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/portal/Avatar";

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Square-crop + downscale in the browser so we never store large blobs. */
async function squareCrop(file: File, size = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close?.();
  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not process image"))), "image/webp", 0.9),
  );
}

export function AvatarUpload({ value, name, onChange }: {
  value: string | null;
  name?: string | null;
  onChange: (next: string | null) => Promise<void> | void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) { toast.error("Please choose a JPG, PNG, WebP or GIF image."); return; }
    if (file.size > MAX_BYTES) { toast.error("Image must be smaller than 5MB."); return; }
    try {
      const blob = await squareCrop(file);
      setPending(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      toast.error("That image could not be read. Try another one.");
    }
  };

  const save = async () => {
    if (!user || !pending) return;
    setBusy(true);
    const path = `${user.id}/${Date.now()}.webp`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, pending, {
      contentType: "image/webp", upsert: true,
    });
    if (error) { setBusy(false); toast.error("Upload failed. Please try again."); return; }
    if (value && !/^https?:/.test(value)) {
      await supabase.storage.from(AVATAR_BUCKET).remove([value]);
      forgetAvatar(value);
    }
    await onChange(path);
    setBusy(false);
    setPending(null);
    setPreview(null);
    toast.success("Profile photo updated");
  };

  const discard = () => { setPending(null); setPreview(null); };

  const remove = async () => {
    setBusy(true);
    if (value && !/^https?:/.test(value)) {
      await supabase.storage.from(AVATAR_BUCKET).remove([value]);
      forgetAvatar(value);
    }
    await onChange(null);
    setBusy(false);
    setPreview(null);
    setPending(null);
    toast.success("Profile photo removed");
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <Avatar value={preview ? null : value} src={preview} name={name} size={88} />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="text-sm">{preview ? "Preview your new photo" : "Your profile photo"}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Square crop, up to 5MB. Shown to your chauffeur and the BiLUXS team.</div>

        <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />

        <div className="flex flex-wrap gap-2 mt-3">
          {pending ? (
            <>
              <button type="button" onClick={save} disabled={busy}
                className="h-10 px-5 bg-crimson text-white text-[10px] uppercase tracking-widest disabled:opacity-50">
                {busy ? "Saving…" : "Save photo"}
              </button>
              <button type="button" onClick={discard} disabled={busy}
                className="h-10 px-5 border border-border hover:border-gold text-[10px] uppercase tracking-widest">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
                className="h-10 px-5 border border-gold text-gold text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <Camera className="h-3.5 w-3.5" /> {value ? "Change photo" : "Upload photo"}
              </button>
              {value && (
                <button type="button" onClick={remove} disabled={busy}
                  className="h-10 px-5 border border-border hover:border-crimson text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

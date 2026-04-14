"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@repo/lib";
import { ImagePlus, X } from "lucide-react";
import { Button } from "../(controls)";

const MAX_FILES = 3;
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export function CommentImageUpload({
  images,
  onImagesChange,
  existingImages,
  onExistingImageRemove,
}: {
  images: File[];
  onImagesChange: (files: File[]) => void;
  existingImages?: { id: number; url: string }[];
  onExistingImageRemove?: (id: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalCount = images.length + (existingImages?.length ?? 0);
  const canAdd = totalCount < MAX_FILES;

  const validateAndAdd = useCallback(
    (files: FileList | File[]) => {
      const currentTotal = images.length + (existingImages?.length ?? 0);
      const remaining = MAX_FILES - currentTotal;
      if (remaining <= 0) return;

      const existingKeys = new Set(
        images.map((f) => `${f.name}:${f.size}`),
      );
      const valid: File[] = [];
      for (const file of Array.from(files)) {
        if (valid.length >= remaining) break;
        if (!ACCEPTED_TYPES.has(file.type)) continue;
        if (file.size > MAX_SIZE) continue;
        const key = `${file.name}:${file.size}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        valid.push(file);
      }
      if (valid.length > 0) {
        onImagesChange([...images, ...valid]);
      }
    },
    [images, existingImages, onImagesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAdd(e.dataTransfer.files);
      }
    },
    [validateAndAdd],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.items)
        .filter((item) => item.kind === "file" && ACCEPTED_TYPES.has(item.type))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length > 0) {
        e.preventDefault();
        validateAndAdd(files);
      }
    },
    [validateAndAdd],
  );

  const removeNew = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const hasAny = totalCount > 0;

  return (
    <div
      className={cn(
        "relative rounded-md transition-colors",
        dragOver && "ring-1 ring-primary bg-primary/5",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) validateAndAdd(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-2">
        {/* Existing image thumbnails (edit mode) */}
        {existingImages?.map((img) => (
          <div key={`existing-${img.id}`} className="group relative shrink-0">
            <img
              src={img.url}
              alt=""
              className="h-14 w-14 rounded object-cover border border-border"
            />
            {onExistingImageRemove && (
              <button
                type="button"
                onClick={() => onExistingImageRemove(img.id)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {/* New file thumbnails */}
        {images.map((file, i) => (
          <Thumbnail key={`new-${i}`} file={file} onRemove={() => removeNew(i)} />
        ))}

        {/* Add button */}
        {canAdd && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {hasAny ? `${totalCount}/${MAX_FILES}` : "Image"}
          </Button>
        )}
        {!canAdd && (
          <span className="text-xs text-muted-foreground">
            {totalCount}/{MAX_FILES}
          </span>
        )}
      </div>
    </div>
  );
}

function Thumbnail({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemoObjectURL(file);

  return (
    <div className="group relative shrink-0">
      <img
        src={url}
        alt=""
        className="h-14 w-14 rounded object-cover border border-border"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function useMemoObjectURL(file: File): string {
  const ref = useRef<{ file: File; url: string } | null>(null);
  if (!ref.current || ref.current.file !== file) {
    if (ref.current) URL.revokeObjectURL(ref.current.url);
    ref.current = { file, url: URL.createObjectURL(file) };
  }
  return ref.current.url;
}

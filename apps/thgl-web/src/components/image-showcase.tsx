import Image from "next/image";
import { type ReactNode } from "react";

interface BadgeInfo {
  primary: string;
  secondary?: string;
}

interface ImageShowcaseProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  badge?: BadgeInfo;
  priority?: boolean;
  className?: string;
  children?: ReactNode; // For custom overlay content
  sizes?: string;
}

export function ImageShowcase({
  src,
  alt,
  width = 600,
  height = 400,
  badge,
  priority = false,
  className = "",
  children,
  sizes = "(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 500px",
}: ImageShowcaseProps) {
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`rounded-lg shadow-2xl max-w-full h-auto ${className}`}
        priority={priority}
        sizes={sizes}
      />
      {badge && (
        <div className="absolute -bottom-4 -left-4 bg-black/90 p-3 rounded-lg border border-primary/20">
          <p className="text-xs font-semibold text-primary">{badge.primary}</p>
          {badge.secondary && (
            <p className="text-xs text-muted-foreground">{badge.secondary}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

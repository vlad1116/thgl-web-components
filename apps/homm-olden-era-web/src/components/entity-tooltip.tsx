"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

type TooltipData = {
  name: string;
  type: string;
  desc: string | null;
  bonuses: string[];
};

const cache = new Map<string, TooltipData>();

export function EntityTooltip({
  entityId,
  locale = "en",
  children,
}: {
  entityId: string;
  locale?: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<TooltipData | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(() => {
    const cached = cache.get(`${entityId}_${locale}`);
    if (cached) {
      setData(cached);
      return;
    }
    setLoading(true);
    fetch(`/api/entity-tooltip?id=${entityId}&locale=${locale}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d && !d.error) {
          cache.set(`${entityId}_${locale}`, d);
          setData(d);
        }
      })
      .finally(() => setLoading(false));
  }, [entityId, locale]);

  const handleEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    timerRef.current = setTimeout(() => {
      fetchData();
      setVisible(true);
    }, 250);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 100);
  };

  const hasContent = data && (data.desc || data.bonuses.length > 0);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {visible && (hasContent || loading) && (
        <div
          className="absolute z-50 bottom-full left-0 mb-1.5 w-72 rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl p-3 pointer-events-none"
          onMouseEnter={() => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          }}
          onMouseLeave={handleLeave}
        >
          {loading && !data && (
            <div className="text-xs text-muted-foreground">Loading...</div>
          )}
          {hasContent && (
            <>
              {data.desc && (
                <p className="text-xs text-muted-foreground italic mb-2 line-clamp-3">
                  {data.desc}
                </p>
              )}
              {data.bonuses.length > 0 && (
                <ul className="space-y-1">
                  {data.bonuses.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs"
                    >
                      <span className="text-amber-500 mt-px shrink-0">
                        &#x25C6;
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Shrinks a fixed-layout sample (the HUSH. Guide laptop preview) proportionally
// when its column is narrower than `minWidth`, instead of letting its
// contents force the whole page to scroll sideways on a phone. Per the
// Step 4 spec the samples shrink as a unit rather than reflowing inside.
// `bleed` is how far the sample's own base is allowed to hang past each side;
// it is padded in and pulled back out so desktop layout is unchanged.
export function ScaleToFit({
  minWidth,
  bleed = 18,
  children,
}: {
  minWidth: number;
  bleed?: number;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number | null }>({ scale: 1, height: null });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const avail = outer.clientWidth - bleed * 2;
      const scale = avail > 0 ? Math.min(1, avail / minWidth) : 1;
      const next = scale < 1 ? { scale, height: inner.offsetHeight * scale } : { scale: 1, height: null };
      setFit((prev) =>
        Math.abs(prev.scale - next.scale) < 0.001 && Math.abs((prev.height ?? 0) - (next.height ?? 0)) < 0.5 ? prev : next,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [minWidth, bleed]);

  const scaled = fit.scale < 1;
  return (
    <div
      ref={outerRef}
      style={{
        margin: `0 -${bleed}px`,
        padding: `0 ${bleed}px`,
        minWidth: 0,
        overflow: "hidden",
        height: scaled && fit.height !== null ? fit.height : undefined,
      }}
    >
      <div
        ref={innerRef}
        style={scaled ? { width: minWidth, transform: `scale(${fit.scale})`, transformOrigin: "0 0" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

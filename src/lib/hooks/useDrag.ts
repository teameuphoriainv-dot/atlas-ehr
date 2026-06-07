"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Point {
  x: number;
  y: number;
}

/**
 * Pointer-based dragging for the floating Atlas panel. Attach `onPointerDown` to a
 * drag handle (the title bar). Position is clamped loosely to stay on screen.
 */
export function useDrag(initial: Point) {
  const [pos, setPos] = useState<Point>(initial);
  const [dragging, setDragging] = useState(false);
  const offset = useRef<Point>({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      e.preventDefault();
    },
    [pos],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const maxX = window.innerWidth - 120;
      const maxY = window.innerHeight - 60;
      setPos({
        x: Math.min(Math.max(0, e.clientX - offset.current.x), maxX),
        y: Math.min(Math.max(0, e.clientY - offset.current.y), maxY),
      });
    };
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  return { pos, setPos, dragging, onPointerDown };
}

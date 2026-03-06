"use client";

import { useRef, useState, useEffect } from "react";

const TEMPLATE_WIDTH_PX = 794; // 210mm at 96dpi

export default function DocumentScaleWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current || !innerRef.current) return;
      const w = wrapperRef.current.offsetWidth;
      const s = w >= TEMPLATE_WIDTH_PX ? 1 : w / TEMPLATE_WIDTH_PX;
      setScale(s);
      setHeight(innerRef.current.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapperRef.current!);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden" style={height !== null ? { height } : undefined}>
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: TEMPLATE_WIDTH_PX,
        }}
      >
        {children}
      </div>
    </div>
  );
}

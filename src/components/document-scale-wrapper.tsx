"use client";

import { useRef, useState, useEffect } from "react";

const TEMPLATE_WIDTH_PX = 794; // 210mm at 96dpi

export default function DocumentScaleWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;
      const w = wrapperRef.current.offsetWidth;
      setScale(w >= TEMPLATE_WIDTH_PX ? 1 : w / TEMPLATE_WIDTH_PX);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapperRef.current!);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden">
      <div style={{ zoom: scale, width: TEMPLATE_WIDTH_PX }}>
        {children}
      </div>
    </div>
  );
}

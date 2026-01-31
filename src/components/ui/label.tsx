"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label"> & { required?: boolean }
>(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  >
    {props.children}
    {required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
));
Label.displayName = "Label";

export { Label };

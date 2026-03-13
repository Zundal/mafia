import * as React from "react";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical"; glow?: boolean }
>(({ className, orientation = "horizontal", glow = false, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation={orientation}
    className={cn(
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      glow
        ? "bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
        : "bg-border",
      className
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };

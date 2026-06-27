import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[color:var(--ink-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B864]/50 focus-visible:border-[#E8B864]/50 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/20 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-red-500/30 bg-red-500/15 text-red-400",
        outline:
          "border-border text-foreground",
        success:
          "border-green-500/30 bg-green-500/15 text-green-400",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-400",
        info:
          "border-cyan-500/30 bg-cyan-500/15 text-cyan-400",
        purple:
          "border-purple-500/30 bg-purple-500/15 text-purple-400",
        mafia:
          "border-red-500/40 bg-red-500/20 text-red-400",
        citizen:
          "border-cyan-500/30 bg-cyan-500/20 text-cyan-400",
        solo:
          "border-amber-500/40 bg-amber-500/20 text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

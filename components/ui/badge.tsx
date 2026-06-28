import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/20 text-[#e09aa3]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-[#C2495A]/35 bg-[#C2495A]/15 text-[#e08a96]",
        outline:
          "border-border text-foreground",
        success:
          "border-[#86B07C]/30 bg-[#86B07C]/12 text-[#a0c596]",
        warning:
          "border-[#E8B864]/30 bg-[#E8B864]/12 text-[#e8b864]",
        info:
          "border-[#C99A52]/30 bg-[#C99A52]/12 text-[#d6b074]",
        purple:
          "border-[#C99A52]/30 bg-[#C99A52]/12 text-[#d6b074]",
        mafia:
          "border-[#C2495A]/40 bg-[#C2495A]/18 text-[#e08a96]",
        citizen:
          "border-[#86B07C]/30 bg-[#86B07C]/15 text-[#a0c596]",
        solo:
          "border-[#E8B864]/40 bg-[#E8B864]/18 text-[#e8b864]",
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

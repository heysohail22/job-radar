import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#101828] border border-[#232B3B] text-[#AAB4C5]",
        match:
          "bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] magic-emerald-glow",
        highlight:
          "bg-[#6366F1]/15 border border-[#6366F1]/40 text-[#6366F1]",
        tag:
          "rounded-lg bg-[#181F30] text-[#AAB4C5] text-[11px] font-medium border border-[#232B3B]",
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

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

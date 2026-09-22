import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold transition-all focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#4F46E5] text-[#F8F8F8] hover:bg-[#6366F1] shadow-xs",
        secondary:
          "bg-[#181F30] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#232B3B]",
        outline:
          "border border-[#232B3B] bg-[#101828] text-[#AAB4C5] hover:text-[#F8F8F8] hover:border-[#6366F1]/50",
        ghost:
          "hover:bg-[#101828] text-[#AAB4C5] hover:text-[#F8F8F8]",
        magic:
          "bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#7C3AED] text-[#F8F8F8] shadow-lg shadow-[#4F46E5]/30 magic-purple-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-12 px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

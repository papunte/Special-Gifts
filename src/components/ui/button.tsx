import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black shadow-lg shadow-white/10 hover:bg-white/90 active:scale-95",
        destructive:
          "bg-red-500 text-white shadow-sm shadow-black/5 hover:bg-red-600 active:scale-95",
        outline:
          "border border-white/20 bg-black/40 backdrop-blur-md text-white shadow-sm hover:bg-white/10 hover:border-white/40 active:scale-95",
        secondary:
          "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/30 active:scale-95",
        ghost: "text-white/80 hover:text-white hover:bg-white/10 active:scale-95",
        link: "text-cyan-400 underline-offset-4 hover:underline",
        frozen:
          "bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };

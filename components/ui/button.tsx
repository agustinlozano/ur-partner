import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 backdrop-blur-sm dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        shadow:
          "relative overflow-hidden bg-gradient-to-r from-[#f6f7ff] to-[#f5f6ff] dark:from-[#070e41] dark:to-[#263381] border-2 border-[#263381] dark:border-[rgb(76_100_255)] text-black dark:text-white transition-all duration-100 [box-shadow:5px_5px_rgb(38_51_129)] dark:[box-shadow:5px_5px_rgb(30_40_100)] active:translate-x-[3px] active:translate-y-[3px] active:[box-shadow:0px_0px_rgb(38_51_129)] dark:active:[box-shadow:0px_0px_rgb(30_40_100)] focus-visible:bg-gradient-to-r focus-visible:from-purple-50 focus-visible:to-indigo-50 dark:focus-visible:from-purple-900/50 dark:focus-visible:to-indigo-900/50 focus-visible:border-purple-400 dark:focus-visible:border-purple-500 focus-visible:[box-shadow:8px_8px_rgb(147_51_234)] dark:focus-visible:[box-shadow:8px_8px_rgb(147_51_234)] focus-visible:scale-[1.02] focus-visible:ring-purple-400/30 focus-visible:ring-4",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

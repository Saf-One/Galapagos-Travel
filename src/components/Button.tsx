import {cn} from "@/lib/utils";
import {forwardRef} from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-navy text-cream hover:bg-teal border border-transparent",
  secondary:
    "bg-transparent text-navy border border-navy hover:bg-navy hover:text-cream",
  gold: "bg-gold text-cream hover:bg-gold-light border border-transparent",
  ghost: "bg-transparent text-navy hover:text-teal border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Styled button with classic theme variants. Works in both server and client.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, variant = "primary", size = "md", ...props}, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-soft focus:outline-none focus:ring-2 focus:ring-gold/60 disabled:opacity-50 disabled:pointer-events-none",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

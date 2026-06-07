import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  // Primary = solid teal, white text, weight 600 (the hero confirm action)
  primary:
    "bg-primary text-surface font-semibold hover:bg-primary-hover disabled:opacity-50",
  // Secondary = slate outline on surface
  secondary:
    "bg-surface text-secondary font-medium border border-secondary/40 hover:bg-surface-alt disabled:opacity-50",
  // Destructive (Reject) = error outline, never solid red (avoid alarm)
  destructive:
    "bg-surface text-error font-medium border border-error/50 hover:bg-error/5 disabled:opacity-50",
  ghost: "bg-transparent text-text-muted hover:bg-surface-alt disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-11 px-6 text-base", // 44px — min touch target for the confirm action
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md transition-colors duration-150 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

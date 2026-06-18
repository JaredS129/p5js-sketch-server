import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as the child element (e.g. a router Link) instead of a <button>. */
  asChild?: boolean;
  variant?: "primary" | "ghost";
}

/** Minimal accessible button styled with Tailwind; Radix Slot enables `asChild`. */
export function Button({
  asChild,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50",
        variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
        variant === "ghost" && "text-fg hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

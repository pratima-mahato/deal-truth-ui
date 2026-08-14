import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "btn primary",
  secondary: "btn",
  ghost: "btn ghost",
  play: "btn play",
  danger: "btn",
  link: "btn ghost",
};

const sizes = {
  sm: "sm",
  md: "",
  lg: "",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button type={type} className={cn(variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

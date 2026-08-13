import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-violet-600 text-white shadow-sm hover:bg-violet-700 active:bg-violet-700 disabled:bg-ink-100 disabled:text-ink-400 disabled:shadow-none",
  secondary:
    "bg-white text-ink-900 border border-ink-100 hover:border-violet-200 hover:bg-violet-50 disabled:text-ink-400",
  ghost: "text-ink-700 hover:bg-violet-50 hover:text-ink-900 disabled:text-ink-400",
  danger: "bg-red-700 text-white hover:bg-red-800",
  link: "text-violet-700 underline-offset-2 hover:underline px-0",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm font-semibold",
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
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-150 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

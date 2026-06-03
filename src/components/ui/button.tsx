import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "min-h-12 rounded-xl px-5 py-3 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
        variant === "secondary" && "bg-white/10 text-white border border-white/20",
        variant === "ghost" && "bg-transparent text-emerald-100",
        variant === "danger" && "bg-red-600 text-white",
        className
      )}
      {...props}
    />
  );
});

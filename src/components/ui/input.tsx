import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-lg text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none",
          className
        )}
        {...props}
      />
    );
  }
);

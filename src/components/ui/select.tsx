import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full border border-input bg-background px-3 text-sm focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

export { Select };

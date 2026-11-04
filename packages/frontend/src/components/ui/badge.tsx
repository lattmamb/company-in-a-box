import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = ({ children, className, variant, ...props }: any) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)} {...props}>
    {children}
  </span>
);

export { Badge };

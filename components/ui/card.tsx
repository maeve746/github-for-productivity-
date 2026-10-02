import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border/70 bg-card/45 text-card-foreground shadow-soft-border", className)}
      {...props}
    />
  );
}

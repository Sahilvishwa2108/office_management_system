import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ResponsiveTable({ 
  children, 
  className, 
  ...props 
}: ResponsiveTableProps) {
  return (
    <div 
      className={cn("w-full overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}
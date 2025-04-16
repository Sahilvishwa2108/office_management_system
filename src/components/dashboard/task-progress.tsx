"use client";

import { cn } from "@/lib/utils";

interface TaskProgressProps {
  items: {
    label: string;
    value: number;
    color?: string;
  }[];
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showPercentages?: boolean;
  className?: string;
}

export function TaskProgress({
  items,
  size = "md",
  showLabels = true,
  showPercentages = true,
  className,
}: TaskProgressProps) {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  
  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex w-full rounded-full overflow-hidden">
        {items.map((item, index) => {
          const width = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className={cn(
                "transition-all",
                item.color,
                heights[size]
              )}
              style={{ width: `${width}%` }}
            ></div>
          );
        })}
      </div>
      
      {(showLabels || showPercentages) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {items.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full", item.color)}></div>
                {showLabels && <span>{item.label}</span>}
                {showPercentages && (
                  <span className="text-muted-foreground font-mono">
                    ({Math.round(percentage)}%)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
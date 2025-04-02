"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    trend: "positive" | "negative" | "neutral";
  };
  description?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  change,
  description
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || change) && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change && (
              <div
                className={cn(
                  "mr-1 flex items-center",
                  change.trend === "positive" && "text-emerald-500",
                  change.trend === "negative" && "text-rose-500"
                )}
              >
                {change.trend === "positive" && <ArrowUp className="mr-1 h-3 w-3" />}
                {change.trend === "negative" && <ArrowDown className="mr-1 h-3 w-3" />}
                {change.value}%
              </div>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
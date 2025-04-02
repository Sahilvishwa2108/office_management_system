"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon 
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend && (
              <>
                {trend === "up" ? (
                  <ArrowUpIcon className="mr-1 h-3 w-3 text-emerald-500" />
                ) : trend === "down" ? (
                  <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
                ) : null}
              </>
            )}
            <p>{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
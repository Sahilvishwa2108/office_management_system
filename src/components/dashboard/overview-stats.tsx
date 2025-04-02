import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface OverviewStatsProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
}

export function OverviewStats({ title, value, description, icon }: OverviewStatsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
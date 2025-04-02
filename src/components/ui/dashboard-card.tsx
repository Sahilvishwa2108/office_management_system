"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, Briefcase, MessageSquare } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  title: string;
  icon?: "file" | "briefcase" | "message" | string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  icon,
  loading = false,
  children,
  className,
}: DashboardCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "file":
      case "fileText":
        return <FileText className="h-4 w-4" />;
      case "briefcase":
        return <Briefcase className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">
          {icon ? (
            <div className="flex items-center gap-2">
              {getIcon()}
              {title}
            </div>
          ) : (
            title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
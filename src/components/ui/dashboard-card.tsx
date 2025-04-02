"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

const dashboardCardVariants = cva(
  "transition-all duration-200 border overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-card",
        accent: "bg-card border-primary/20",
        muted: "bg-muted/50",
        analytics: "bg-secondary/10",
      },
      size: {
        default: "", 
        sm: "max-w-sm",
        lg: "p-1"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof dashboardCardVariants> {
  title: string;
  icon?: keyof typeof Icons;
  loading?: boolean;
}

export function DashboardCard({
  title,
  icon,
  children,
  variant,
  size,
  className,
  loading = false,
  ...props
}: DashboardCardProps) {
  const Icon = icon ? Icons[icon] : null;
  
  return (
    <Card className={cn(dashboardCardVariants({ variant, size }), className)} {...props}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {Icon && <Icon className="h-5 w-5" />}
          {loading ? <div className="h-4 w-32 animate-pulse rounded bg-muted"></div> : title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
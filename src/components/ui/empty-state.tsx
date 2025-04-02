import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";

interface EmptyStateProps {
  icon?: keyof typeof Icons;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  onClick?: () => void;
}

export function EmptyState({
  icon = "info",
  title,
  description,
  actionLabel,
  actionHref,
  className,
  onClick,
}: EmptyStateProps) {
  const IconComponent = Icons[icon];
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed",
        className
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted mb-4">
        <IconComponent className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {description}
        </p>
      )}
      {(actionLabel && actionHref) && (
        <Button asChild className="mt-4">
          <Link href={actionHref}>
            {actionLabel}
          </Link>
        </Button>
      )}
      {(actionLabel && onClick) && (
        <Button className="mt-4" onClick={onClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
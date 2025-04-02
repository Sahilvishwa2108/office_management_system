"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  segments: {
    name: string;
    href: string;
  }[];
  className?: string;
}

export function Breadcrumbs({ segments, className }: BreadcrumbsProps) {
  return (
    <nav
      className={cn(
        "flex items-center text-sm text-muted-foreground",
        className
      )}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {segments.map((segment, index) => (
          <li key={`${segment.href}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3 w-3" />}
            {index === segments.length - 1 ? (
              <span className="font-medium text-foreground">{segment.name}</span>
            ) : (
              <Link
                href={segment.href}
                className="transition-colors hover:text-foreground"
              >
                {segment.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
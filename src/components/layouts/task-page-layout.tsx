"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  backHref?: string;
  maxWidth?: string;
  showBackButton?: boolean;
}

export function TaskPageLayout({
  children,
  title,
  description,
  backHref,
  maxWidth = "max-w-4xl",
  showBackButton = true,
}: TaskPageLayoutProps) {
  const router = useRouter();

  return (
    <div className={`w-full mx-auto py-4 ${maxWidth}`}>
      {(title || showBackButton) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => backHref ? router.push(backHref) : router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
          </div>
        </div>
      )}
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      <div>{children}</div>
    </div>
  );
}
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
  hasHeader?: boolean;
  headerSize?: "sm" | "md" | "lg";
  contentCount?: number;
  contentHeight?: string;
  hasFooter?: boolean;
  className?: string;
}

export function CardSkeleton({
  hasHeader = true,
  headerSize = "md",
  contentCount = 3,
  contentHeight = "h-16",
  hasFooter = false,
  className,
}: CardSkeletonProps) {
  const getHeaderHeight = () => {
    switch (headerSize) {
      case "sm": return "h-5 w-40";
      case "md": return "h-7 w-48";
      case "lg": return "h-9 w-56";
      default: return "h-7 w-48";
    }
  };

  return (
    <Card className={className}>
      {hasHeader && (
        <CardHeader>
          <Skeleton className={getHeaderHeight()} />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array(contentCount).fill(0).map((_, index) => (
          <Skeleton key={index} className={`w-full ${contentHeight}`} />
        ))}
      </CardContent>
      {hasFooter && (
        <CardFooter>
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      )}
    </Card>
  );
}
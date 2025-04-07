import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function FormSkeleton({ 
  fields = 4, 
  title = true, 
  description = true,
  footer = true,
  maxWidth
}: { 
  fields?: number; 
  title?: boolean;
  description?: boolean;
  footer?: boolean;
  maxWidth?: string;
}) {
  return (
    <div className={maxWidth ? `${maxWidth} mx-auto` : ""}>
      <Card>
        <CardHeader>
          {title && <Skeleton className="h-6 w-48" />}
          {description && <Skeleton className="h-4 w-64" />}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array(fields).fill(0).map((_, i) => (
              <FormFieldSkeleton key={i} />
            ))}
          </div>
        </CardContent>
        {footer && (
          <CardFooter className="flex justify-end gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
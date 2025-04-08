import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function TaskDetailSkeleton() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Skeleton className="h-10 w-24 mb-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task details skeleton - Left column */}
        <div className="lg:col-span-2 h-auto flex flex-col"> {/* Added flex classes */}
          <Card className="h-full flex-grow"> {/* Added flex-grow */}
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task actions skeleton - Right column */}
        <div className="h-auto flex flex-col"> {/* Added flex classes */}
          <Card className="h-full flex-grow"> {/* Added flex-grow */}
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <Skeleton className="h-10 w-full" />
              
              <div className="pt-4 space-y-3 border-t">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments section skeleton - Full width */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <CommentsSkeleton />
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Skeleton className="h-20 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div>
                        <Skeleton className="h-4 w-48 mb-1" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3.5 w-16" />
                          <Skeleton className="h-3.5 w-16" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <div className="space-y-6 pr-4">
      {Array(3).fill(0).map((_, index) => (
        <div key={`comment-skeleton-${index}`} className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
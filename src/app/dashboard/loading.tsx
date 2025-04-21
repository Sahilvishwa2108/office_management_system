import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Dashboard header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[120px]" />
      </div>
      
      {/* Stats row skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-[120px] mb-1" />
              <Skeleton className="h-8 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full mt-4" />
              <Skeleton className="h-2 w-3/4 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Content area skeletons */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Task card skeletons */}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-[140px] mb-1" />
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="border rounded-md p-3">
                  <Skeleton className="h-4 w-[80%] mb-2" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-9 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
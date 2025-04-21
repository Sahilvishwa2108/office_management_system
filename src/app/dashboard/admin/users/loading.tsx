import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[120px]" />
      </div>
      
      {/* Filter controls */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </div>

          {/* Role tabs skeleton */}
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-[120px] flex-shrink-0" />
            ))}
          </div>

          {/* Users grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-5 w-[80%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-3">
          <Skeleton className="h-5 w-[150px]" />
          <div className="ml-auto flex space-x-2">
            <Skeleton className="h-8 w-[100px]" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
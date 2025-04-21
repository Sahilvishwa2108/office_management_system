import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
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
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[120px]" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-[100px]" />
              <Skeleton className="h-9 w-[100px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </div>

          {/* Task cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-md p-4 space-y-3">
                <Skeleton className="h-5 w-[80%]" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-3">
          <Skeleton className="h-5 w-[200px]" />
          <div className="ml-auto flex space-x-2">
            <Skeleton className="h-8 w-[120px]" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
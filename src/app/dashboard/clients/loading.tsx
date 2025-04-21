import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[180px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
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
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </div>

          {/* Clients grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-[70%]" />
                  <Skeleton className="h-5 w-[20%]" />
                </div>
                <Skeleton className="h-4 w-[50%]" />
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[40%]" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
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
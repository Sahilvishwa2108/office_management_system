import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
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
      
      {/* Tabs skeleton */}
      <div className="border-b mb-4">
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      
      {/* Content area skeletons */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {/* User activity skeleton */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-3 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Pending tasks skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border rounded-md space-y-2">
                  <Skeleton className="h-5 w-[85%]" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
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
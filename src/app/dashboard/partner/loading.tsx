import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerDashboardLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Dashboard header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[180px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="border-b mb-4">
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      
      {/* Content area skeletons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* High priority tasks skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-md p-3">
                <Skeleton className="h-4 w-[85%] mb-2" />
                <Skeleton className="h-3 w-[60%]" />
              </div>
            ))}
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
        
        {/* Upcoming deadlines skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[150px]" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <Skeleton className="h-4 w-[85%]" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                  <Skeleton className="h-4 w-[60px]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Team performance skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-[80px] mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-[100px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Billing approvals section skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[180px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 border rounded-md space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-9 w-[120px]" />
                </div>
                <Skeleton className="h-3 w-[50%]" />
                <div className="flex items-center gap-2 mt-1">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
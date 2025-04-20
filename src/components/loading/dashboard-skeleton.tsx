import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}

export function TaskCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <Skeleton className="h-12 w-full mb-3" />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export const DashboardContentSkeleton = () => {
  return (
    <>
      {/* First row - Quick Actions and Notifications */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-2 lg:col-span-4 h-[350px]">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          {/* Changed from overflow-auto to overflow-hidden */}
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden max-h-[270px]">
            {/* Limit to fewer items to avoid needing scroll */}
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-3 h-[350px]">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="flex-1 pt-4 overflow-hidden flex flex-col">
            {/* Changed from overflow-auto to overflow-hidden */}
            <div className="space-y-3 h-[270px] overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row - Staff Distribution and Upcoming Deadlines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="h-[350px] flex flex-col">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="flex-1 pt-4 overflow-hidden flex flex-col">
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex-1 overflow-hidden">
                {/* Changed from overflow-y-auto to overflow-hidden */}
                <div className="h-full max-h-[230px] overflow-hidden pr-1 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-[350px] flex flex-col">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {/* Changed from overflow-y-auto to overflow-hidden */}
            <div className="h-full max-h-[230px] overflow-hidden pr-1 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[70px] w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third row - Billing Section */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Limit to fewer items to avoid needing scroll */}
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// You might also want to create a specialized skeleton for the analytics tab
export const AnalyticsContentSkeleton = () => {
  return (
    <>
      <DashboardStatsSkeleton />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mt-6">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
              <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-12 mx-auto" />
                    <Skeleton className="h-8 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="h-8 w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="grid grid-cols-4 gap-4 pt-2 text-center">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-12 mx-auto" />
                    <Skeleton className="h-8 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
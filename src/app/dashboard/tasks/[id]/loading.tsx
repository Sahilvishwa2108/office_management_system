import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TaskDetailLoading() {
  return (
    <div className="container mx-auto p-4 md:p-8 pt-6 max-w-6xl">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-4 w-[50px]" />
        <Skeleton className="h-4 w-[20px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
      
      {/* Task header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-[60%] mb-2" />
        <div className="flex flex-wrap gap-2 mt-2">
          <Skeleton className="h-6 w-[100px]" />
          <Skeleton className="h-6 w-[100px]" />
        </div>
      </div>
      
      {/* Task details grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div className="md:col-span-2 space-y-6">
          {/* Task description card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </CardContent>
          </Card>
          
          {/* Comments card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment input skeleton */}
              <Skeleton className="h-20 w-full mb-4" />
              
              {/* Comments list skeleton */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b pb-4 last:border-0 last:pb-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-[80px] mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[90%]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Task sidebar */}
        <div>
          <Card className="sticky top-4">
            <CardContent className="space-y-4 pt-6">
              {/* Status */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* Priority */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* Due date */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* Assignees */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <div className="flex space-x-1">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </div>
              
              {/* Client */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* Action buttons */}
              <div className="pt-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-8 max-w-5xl">
      {/* Page header skeleton */}
      <div className="space-y-0.5">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-5 w-[350px]" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="border-b mb-6">
        <div className="flex space-x-4 overflow-x-auto">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[130px]" />
        </div>
      </div>
      
      {/* Settings form skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form fields */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          <div className="pt-4">
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
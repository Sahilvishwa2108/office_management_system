"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the client component with SSR disabled
const CreateClientForm = dynamic(
  () => import("@/components/clients/create-client-form"),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-20 flex-1" />
          <Skeleton className="h-10 w-20 flex-1" />
        </div>
        
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        
        <div className="flex justify-end gap-2 mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }
);

export default function CreateClientPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <h1 className="text-2xl font-bold">Create New Client</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto border shadow-sm">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Add a new permanent client to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateClientForm />
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex justify-center">
          <p className="text-sm text-muted-foreground py-2">
            This client will be accessible to all administrators and assigned partners.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
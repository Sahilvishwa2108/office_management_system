"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Make sure this is imported

// Import the dynamic component with next/dynamic instead
import dynamic from "next/dynamic";

// Use dynamic import with SSR disabled to properly isolate the client component
const SetPasswordForm = dynamic(
  () => import("@/components/auth/set-password-form"),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }
);

export default function SetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold">Set Your Password</h1>
          <p className="text-muted-foreground">
            Please create a strong password for your account
          </p>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground text-center">
            This link is valid for 24 hours only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
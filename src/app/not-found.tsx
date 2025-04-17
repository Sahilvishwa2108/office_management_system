"use client";

import { Suspense } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// Step 1: Create a very simple component that ONLY uses useSearchParams
function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  
  // Actually use the searchParams to prevent tree-shaking
  const referrer = searchParams.get("from");
  
  // Return JSX that uses the search param
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-6 max-w-md">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          {referrer ? 
            `The page you're looking for doesn't exist or has been moved from ${referrer}.` : 
            "The page you're looking for doesn't exist or has been moved."
          }
        </p>
        <Button asChild>
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Step 2: Export a component that wraps SearchParamsWrapper in Suspense
export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-6 max-w-md">
          <h1 className="text-5xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <Skeleton className="h-16 w-full mb-6" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    }>
      <SearchParamsWrapper />
    </Suspense>
  );
}
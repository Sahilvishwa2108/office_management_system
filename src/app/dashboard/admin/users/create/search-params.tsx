"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react"; // Add Suspense import

// Step 1: Create a component that ONLY handles search params
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  
  // Actually use the search params to prevent tree-shaking
  const source = searchParams.get('source');
  const returnUrl = searchParams.get('returnUrl');
  
  // Log to ensure it's used
  console.log("Search params:", { source, returnUrl });
  
  // This component doesn't render anything visible
  return null;
}

// Step 2: Create a wrapper component that wraps the handler in Suspense
export default function SearchWrapper() {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler />
    </Suspense>
  );
}
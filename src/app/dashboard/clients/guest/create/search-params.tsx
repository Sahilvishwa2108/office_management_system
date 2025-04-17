"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Component that directly uses useSearchParams
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  
  // Example: Extract any URL parameters if needed
  const referral = searchParams.get("referral");
  const source = searchParams.get("source");
  
  // Make sure we use these params so they don't get tree-shaken
  console.log("Using search params:", { referral, source });
  
  // You can use these parameters to modify the form or display information
  // For this example, we'll just return null as we're only using this to properly handle searchParams
  return null;
}

// Export a component that wraps the search params handler in Suspense
export default function SearchParamsComponent() {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler />
    </Suspense>
  );
}
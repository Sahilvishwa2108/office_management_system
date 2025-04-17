"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Component that directly uses useSearchParams
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const referrer = searchParams.get('referrer');
  
  // Log params to ensure they're used (prevents tree-shaking)
  console.log('Source:', source, 'Referrer:', referrer);
  
  return null; // This component doesn't render anything
}

// Export a component that wraps the search params handler in Suspense
export default function SearchParamsComponent() {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler />
    </Suspense>
  );
}
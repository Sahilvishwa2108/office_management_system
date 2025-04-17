"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Component that uses search params
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  
  // Use the search params (even if just logging them)
  // to prevent the component from being removed during optimization
  console.log("Search params available:", searchParams.toString());
  
  return null;
}

// Wrapper with Suspense boundary
export default function SearchParamsComponent() {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler />
    </Suspense>
  );
}
"use client";

import { useSearchParams } from "next/navigation";

export default function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  
  // Get the search params needed for the login page
  const blocked = searchParams.get("blocked");
  const callbackUrl = searchParams.get("callbackUrl");
  const error = searchParams.get("error");
  
  // Log the values to ensure they're actually used (prevents tree-shaking)
  console.log("Search params available:", { blocked, callbackUrl, error });
  
  // This component doesn't render anything visible
  return null;
}
"use client";

import { useSearchParams } from "next/navigation";

export default function SearchWrapper() {
  const searchParams = useSearchParams();
  
  // Actually use the search params to prevent tree-shaking
  const source = searchParams.get('source');
  const returnUrl = searchParams.get('returnUrl');
  
  // Log to ensure it's used
  console.log("Search params:", { source, returnUrl });
  
  // This component doesn't render anything visible
  return null;
}
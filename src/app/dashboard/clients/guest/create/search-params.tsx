"use client";

import { useSearchParams } from "next/navigation";

export default function SearchParamsComponent() {
  const searchParams = useSearchParams();
  
  // Actually use the search params to prevent tree-shaking
  const source = searchParams.get('source');
  const ref = searchParams.get('ref');
  const returnUrl = searchParams.get('returnUrl');
  
  // Log values to ensure they're used (can be removed in production)
  console.log('Search params for guest client create:', { source, ref, returnUrl });
  
  return null;
}
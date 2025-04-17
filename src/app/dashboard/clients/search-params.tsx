"use client";

import { useSearchParams } from "next/navigation";

export default function SearchParamsComponent() {
  const searchParams = useSearchParams();
  
  // Actually use the search params to prevent tree-shaking
  const filter = searchParams.get('filter');
  const view = searchParams.get('view');
  const sort = searchParams.get('sort');
  
  // Log values to ensure they're used
  console.log('Search params:', { filter, view, sort });
  
  return null;
}
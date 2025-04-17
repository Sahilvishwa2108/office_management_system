"use client";

import { useSearchParams } from "next/navigation";

export default function SearchParamsHandler() {
  const searchParams = useSearchParams();
  
  // Actually use the search params to prevent tree-shaking
  const filter = searchParams.get('filter');
  const view = searchParams.get('view');
  const role = searchParams.get('role');
  
  // This component doesn't render anything visible
  return null;
}
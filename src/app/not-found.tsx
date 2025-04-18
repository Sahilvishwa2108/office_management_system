"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [referrer, setReferrer] = useState<string | null>(null);
  
  // Get URL params on mount using window.location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URL(window.location.href).searchParams;
        setReferrer(urlParams.get('from'));
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
    }
  }, []);

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
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Component that uses useSearchParams
function SignOutContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ callbackUrl: error === "blocked" ? "/login?blocked=true" : "/login" });
    };
    
    handleSignOut();
  }, [error]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you out...</h1>
        <p>Please wait while we redirect you.</p>
      </div>
    </div>
  );
}

export default function SignOut() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Signing you out...</h1>
          <p>Please wait while we redirect you.</p>
        </div>
      </div>
    }>
      <SignOutContent />
    </Suspense>
  );
}
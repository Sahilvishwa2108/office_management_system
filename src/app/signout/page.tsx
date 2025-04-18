"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SignOut() {
  useEffect(() => {
    // Extract error directly using window.location if needed
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    
    const handleSignOut = async () => {
      await signOut({ 
        callbackUrl: error === "blocked" ? "/login?blocked=true" : "/login" 
      });
    };
    
    handleSignOut();
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you out...</h1>
        <p>Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
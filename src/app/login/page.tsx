"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read URL parameters using window.location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        setBlocked(url.searchParams.get("blocked") === "true");
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  useEffect(() => {
    console.log("Login page loaded");
    
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        console.log("Session data:", data);
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    
    checkSession();
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        // Check specifically for blocked account error
        if (result.error === "AccountBlocked" || result.error.includes("blocked")) {
          // Reset loading state before redirecting
          setIsSubmitting(false);
          router.push("/login?blocked=true");
          return;
        }

        toast.error("Invalid email or password");
        setIsSubmitting(false);
        return;
      }

      // Get the session to determine role
      const response = await axios.get("/api/auth/session");
      const sessionData = response.data;

      toast.success("Logged in successfully");

      // Redirect based on user role
      if (sessionData?.user?.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (sessionData?.user?.role === "PARTNER") {
        router.push("/dashboard/partner");
      } else if (["PERMANENT_CLIENT", "GUEST_CLIENT"].includes(sessionData?.user?.role)) {
        router.push("/dashboard/client");
      } else if (["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"].includes(sessionData?.user?.role)) {
        // Redirect junior staff to their specific dashboard
        router.push("/dashboard/junior");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch {
      toast.error("Failed to log in");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>
        </CardHeader>
        <CardContent>
          {blocked && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                Your account has been blocked. Please contact an administrator for assistance.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="youremail@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SetPasswordForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get token from URL using window.location on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const urlToken = url.searchParams.get("token");
        setToken(urlToken);
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
        toast.error("Invalid URL format");
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Show error if token is missing after loading completes
  useEffect(() => {
    if (!isLoading && !token) {
      toast.error("Invalid or missing token");
    }
  }, [token, isLoading]);

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!token) {
      toast.error("Invalid or missing token");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/auth/set-password", {
        token,
        password: data.password,
      });

      toast.success("Password set successfully. You can now log in.");
      router.push("/login");
    } catch (error: unknown) {
      const typedError = error as { response?: { data?: { error?: string } } };
      toast.error(typedError.response?.data?.error || "Failed to set password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading indicator while checking for token
  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Don't render form if token is missing
  if (!token) {
    return (
      <div className="text-center p-4 border rounded-md bg-destructive/10 text-destructive">
        <p className="font-medium">Invalid or missing token</p>
        <p className="text-sm mt-2">Please check your email for a valid password reset link.</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => router.push("/login")}
        >
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting Password...
            </>
          ) : (
            "Set Password"
          )}
        </Button>
      </form>
    </Form>
  );
}
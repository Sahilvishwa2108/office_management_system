"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Define the form schema with validation rules
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  assignedRole: z.enum([
    "ADMIN",
    "PARTNER",
    "BUSINESS_EXECUTIVE",
    "BUSINESS_CONSULTANT"
  ]),
});

// Main component - no more Suspense or dynamic imports
export default function CreateUserPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceParam, setSourceParam] = useState<string | null>(null);
  const [returnUrlParam, setReturnUrlParam] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const source = url.searchParams.get('source');
        const returnUrl = url.searchParams.get('returnUrl');
        
        setSourceParam(source);
        setReturnUrlParam(returnUrl);
        
        // Log to ensure it's used (same as the original code did)
        console.log("URL parameters:", { source, returnUrl });
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Pre-set default values
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      assignedRole: "BUSINESS_EXECUTIVE",
    },
  });

  const isAdmin = session?.user?.role === "ADMIN";

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
    setIsSubmitting(true);

    try {
      // Include the URL parameters in the API request
      await axios.post("/api/users", {
        ...data,
        source: sourceParam,
        returnUrl: returnUrlParam
      });

      toast.success(`User ${data.name} created successfully!`);

      // Reset form
      form.reset();

      // If there's a returnUrl parameter, use it for redirection
      const redirectTo = returnUrlParam || 
                        (isAdmin ? "/dashboard/admin/users" : "/dashboard/partner/users");

      // Redirect after short delay
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking session
  if (status === "loading" || isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-56" />
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href={isAdmin ? "/dashboard/admin/users" : "/dashboard/partner/users"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New User</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-xl">User Information</h2>
          <p className="text-muted-foreground">
            Create a new user and send them an invitation email to set up their password.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Only admins can create admin/partner accounts */}
                        {isAdmin && (
                          <>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="PARTNER">Partner</SelectItem>
                          </>
                        )}
                        <SelectItem value="BUSINESS_EXECUTIVE">Business Executive</SelectItem>
                        <SelectItem value="BUSINESS_CONSULTANT">Business Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating User...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground flex justify-center">
        <p>
          An email will be sent to the user with instructions to set up their password. 
          The default password "12345678" is also set automatically.
        </p>
        </CardFooter>
      </Card>
    </div>
  );
}
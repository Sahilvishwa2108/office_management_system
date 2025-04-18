"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Form schema with validation
const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum([
    "ADMIN", 
    "PARTNER", 
    "BUSINESS_EXECUTIVE", 
    "BUSINESS_CONSULTANT"
  ], {
    required_error: "Please select a role",
  }),
});

// Update the params type to reflect that it's a Promise in Next.js 15
export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use React.use to properly unwrap the Promise
  const resolvedParams = React.use(params);
  const userId = resolvedParams.id;

  // Setup form with default values
  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "BUSINESS_EXECUTIVE",
    },
  });

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/users/${userId}`);
        const userData = response.data;
        
        form.reset({
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
      } catch {
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof editUserSchema>) => {
    setIsSubmitting(true);
    try {
      await axios.put(`/api/users/${userId}`, data);
      toast.success("User updated successfully");
      router.push(`/dashboard/admin/users/${userId}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex justify-end gap-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href={`/dashboard/admin/users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit User</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update User Information</CardTitle>
          <CardDescription>
            Edit the user&apos;s personal details and role
          </CardDescription>
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
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                        <SelectItem value="PARTNER">Partner</SelectItem>
                        <SelectItem value="BUSINESS_EXECUTIVE">
                          Business Executive
                        </SelectItem>
                        <SelectItem value="BUSINESS_CONSULTANT">
                          Business Consultant
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
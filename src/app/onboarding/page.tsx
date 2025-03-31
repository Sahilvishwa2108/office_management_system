"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Define validation schema with Zod
const formSchema = z.object({
  role: z.enum(["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"], {
    required_error: "Please select a role",
  }),
})

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !isLoaded) return

    setIsLoading(true)
    console.log("Starting role selection process with:", values);

    try {
      // Important: We need to use the backend API to set publicMetadata
      // 1. Create/update user in your database first
      console.log("Updating user in database");
      const dbResponse = await axios.post("/api/users", {
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        clerkId: user.id,
        role: values.role,
      });
      console.log("Database response:", dbResponse.data);
      
      // 2. Now update the role in Clerk's publicMetadata (this must be done via backend)
      console.log("Updating Clerk metadata");
      const metadataResponse = await axios.post("/api/users/update-metadata", {
        role: values.role
      });
      console.log("Metadata response:", metadataResponse.data);

      toast.success("Profile setup complete!");
      
      // 3. Force a hard refresh to update the session claims
      console.log("Redirecting to dashboard");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong during setup");
    } finally {
      setIsLoading(false);
    }
  }

  // Role options
  const roleOptions = [
    {
      id: "ADMIN",
      label: "Senior Partner / Admin / Owner",
      description: "Full control over the system",
    },
    {
      id: "PARTNER",
      label: "Partner / Senior Employee",
      description: "Limited administrative rights",
    },
    {
      id: "BUSINESS_EXECUTIVE",
      label: "Business Executive",
      description: "Basic access to tasks and communications",
    },
    {
      id: "BUSINESS_CONSULTANT",
      label: "Business Consultant",
      description: "Basic access to tasks and communications",
    },
  ];

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Please select your role in the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Your Role</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          {roleOptions.map((option) => (
                            <div 
                              key={option.id}
                              className="flex items-start space-x-2 rounded-md border p-3 hover:bg-slate-100"
                            >
                              <RadioGroupItem value={option.id} id={option.id} />
                              <div className="flex flex-col">
                                <label htmlFor={option.id} className="font-medium cursor-pointer">
                                  {option.label}
                                </label>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Continue to Dashboard"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
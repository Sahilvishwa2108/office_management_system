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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User, Building, Mail, Phone, MapPin, FileText, Info } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { canModifyClient } from "@/lib/permissions";
import { useSession } from "next-auth/react";

// Schema for permanent client
const clientFormSchema = z.object({
  contactPerson: z.string().min(2, "Contact person name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  gstin: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientCreatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sourceParam, setSourceParam] = useState<string | null>(null);
  const [referrerParam, setReferrerParam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const source = url.searchParams.get('source');
        const referrer = url.searchParams.get('referrer');
        
        setSourceParam(source);
        setReferrerParam(referrer);
        
        // Log the parameters if needed (same as the original code did)
        console.log('Source:', source, 'Referrer:', referrer);
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      } finally {
        // Set loading to false regardless of outcome
        setIsLoading(false);
      }
    }
  }, []);

  // Check for permissions when component mounts
  useEffect(() => {
    // Redirect if not admin
    if (status !== "loading" && !canModifyClient(session)) {
      toast.error("You don't have permission to create clients");
      router.push("/dashboard/clients");
    }
  }, [session, status, router]);

  // Pre-set default values
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      contactPerson: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      gstin: "",
    },
  });

  // Prevent rendering the form for non-admin users
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canModifyClient(session)) {
    return null; // Will redirect in the useEffect
  }

  // Handle form submission
  const onSubmit = async (data: ClientFormValues) => {
    // Ensure at least one contact method is provided
    if (!data.email && !data.phone) {
      toast.error("Please provide either an email or phone number");
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      // Include source and referrer from URL in the API request if available
      await axios.post("/api/clients", {
        ...data,
        isGuest: false, // Explicitly mark as permanent client
        source: sourceParam,
        referrer: referrerParam
      });

      toast.success(`Client ${data.contactPerson} created successfully!`);
      setSuccessMessage(`Client ${data.contactPerson} has been created successfully.`);

      // Reset form
      form.reset();

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard/clients");
        router.refresh();
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error:", error);
      }
      
      // Check if error is an Axios error with response property
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError.response?.data?.error || "Failed to create client";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Client</h1>
      </div>

      <Card className="max-w-2xl mx-auto border shadow-sm">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Add a new permanent client to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <Info className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="basic" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="additional">Additional Details</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person *</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              placeholder="John Smith" 
                              className="pl-9"
                              {...field} 
                            />
                          </FormControl>
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormDescription>Main person to contact at this client</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              placeholder="ACME Corporation" 
                              className="pl-9"
                              {...field} 
                            />
                          </FormControl>
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormDescription>Organization or business name if applicable</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                placeholder="client@example.com" 
                                className="pl-9"
                                {...field} 
                              />
                            </FormControl>
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                          <FormDescription>Email or phone required</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                placeholder="+1 (555) 123-4567" 
                                className="pl-9"
                                {...field} 
                              />
                            </FormControl>
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                          <FormDescription>Email or phone required</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GSTIN" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="additional" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Textarea 
                              placeholder="123 Business St, City, Country" 
                              className="min-h-[80px] resize-none pl-9 pt-7" 
                              {...field} 
                            />
                          </FormControl>
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormDescription>Physical address for this client</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Textarea 
                              placeholder="Additional information about this client" 
                              className="min-h-[120px] resize-none pl-9 pt-7" 
                              {...field} 
                            />
                          </FormControl>
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormDescription>Any additional details that may be useful</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <Separator className="my-4" />
                
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => router.push("/dashboard/clients")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !!successMessage}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      "Create Client"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex justify-center">
          <p className="text-sm text-muted-foreground py-2">
            This client will be accessible to all administrators and assigned partners.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
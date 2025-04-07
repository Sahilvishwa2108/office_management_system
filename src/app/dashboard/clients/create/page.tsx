"use client";

import { useState } from "react";
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

// Schema for permanent client
const clientFormSchema = z.object({
  contactPerson: z.string().min(2, "Contact person name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function CreateClientPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

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
    },
  });

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
      await axios.post("/api/clients", {
        ...data,
        isGuest: false // Explicitly mark as permanent client
      });

      toast.success(`Client ${data.contactPerson} created successfully!`);
      setSuccessMessage(`Client ${data.contactPerson} has been created successfully.`);

      // Reset form
      form.reset();

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard/admin/clients");
        router.refresh();
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to create client";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard/admin/clients">
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
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push("/dashboard/admin/clients")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !!successMessage}
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
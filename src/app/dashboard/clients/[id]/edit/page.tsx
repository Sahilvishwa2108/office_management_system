"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { canModifyClient } from "@/lib/permissions";
import { useSession } from "next-auth/react";

// Form schema with conditional validation
const clientFormSchema = z.object({
  contactPerson: z.string().min(2, "Contact person name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  gstin: z.string().optional(),
  isGuest: z.boolean().default(false),
  accessExpiry: z.date().nullable().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface Client {
  id: string;
  contactPerson: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  gstin: string | null;
  isGuest: boolean;
  accessExpiry: string | null;
}

// Fix any types
interface ApiError {
  response?: {
    data?: {
      error?: string
    }
  }
}

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Unwrap params Promise at the top level of the component
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup form with default values
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
      isGuest: false,
      accessExpiry: null,
    },
  });

  // Watch the isGuest field to conditionally display the expiry date field
  const isGuest = form.watch("isGuest");

  // Check for permissions when component mounts
  useEffect(() => {
    // Redirect if not admin
    if (status !== "loading" && !canModifyClient(session)) {
      toast.error("You don't have permission to edit clients");
      router.push(`/dashboard/clients/${clientId}`);
    }
  }, [session, status, clientId, router]);

  // Fetch client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/clients/${clientId}`);
        setClient(response.data);

        // Set form values from fetched client data
        form.reset({
          contactPerson: response.data.contactPerson,
          companyName: response.data.companyName || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          notes: response.data.notes || "",
          gstin: response.data.gstin || "",
          isGuest: response.data.isGuest,
          accessExpiry: response.data.accessExpiry ? new Date(response.data.accessExpiry) : null,
        });

        setError(null);
      } catch (err: unknown) {
        console.error("Error fetching client details:", err);
        setError((err as ApiError)?.response?.data?.error || "Failed to load client details");
        toast.error("Failed to load client details");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId, form]);

  // Form submission handler
  const onSubmit = async (data: ClientFormValues) => {
    // Ensure at least one contact method is provided
    if (!data.email && !data.phone) {
      toast.error("Please provide either an email or phone number");
      return;
    }

    setSaving(true);

    try {
      // Prepare data for submission (convert Date to ISO string)
      const clientData = {
        ...data,
        accessExpiry: data.isGuest && data.accessExpiry
          ? data.accessExpiry.toISOString()
          : null
      };

      // Submit to API
      await axios.patch(`/api/clients/${clientId}`, clientData);

      toast.success("Client updated successfully");

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/dashboard/clients/${clientId}`);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      console.error("Error updating client:", err);
      const errorMessage = (err as ApiError)?.response?.data?.error || "Failed to update client";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!canModifyClient(session)) {
    return null; // Will redirect in the useEffect
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load client</h3>
        <p className="text-muted-foreground mb-4">{error || "Client not found"}</p>
        <Button onClick={() => router.push("/dashboard/clients")}>
          Return to Clients
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href={`/dashboard/clients/${clientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Client</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Client Information</CardTitle>
          <CardDescription>
            Update client details and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="ACME Corporation" {...field} />
                    </FormControl>
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
                      <FormControl>
                        <Input placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Either email or phone is required
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Business St, City, Country"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
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
                    <FormControl>
                      <Textarea
                        placeholder="Additional information about this client"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl>
                      <Input placeholder="GSTIN Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isGuest"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Guest Client</FormLabel>
                      <FormDescription>
                        Guest clients have temporary access and will expire after a set date
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isGuest && (
                <FormField
                  control={form.control}
                  name="accessExpiry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Access Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""
                                }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick an expiry date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Guest clients will be automatically archived after this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/clients/${clientId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
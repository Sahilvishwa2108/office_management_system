"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building,
  Clock,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
  AlertCircle,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedHistoryTab } from "@/components/clients/unified-history-tab";
import { canModifyClient } from "@/lib/permissions";
import { CredentialsTab } from "@/components/clients/credentials-tab";

interface Client {
  id: string;
  contactPerson: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isGuest: boolean;
  accessExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  gstin: string | null;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assignedTo: {
      id: string;
      name: string;
    } | null;
  }>;
}
export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Correctly unwrap the params promise
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has write access
  const hasWriteAccess = useMemo(() => {
    return canModifyClient(session);
  }, [session]);

  // Fetch client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/clients/${clientId}`);
        setClient(response.data);
        setError(null);
      } catch (err: unknown) {
        console.error("Error fetching client details:", err);
        setError((err as {response?: {data?: {error?: string}}})?.response?.data?.error || "Failed to load client details");
        toast.error("Failed to load client details");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  // Check if client is expired (for guest clients)
  const isClientExpired = (client: Client): boolean => {
    if (!client.isGuest || !client.accessExpiry) return false;
    return new Date() > new Date(client.accessExpiry);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header section skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-8 w-48" />
              <div className="flex items-center gap-2 mt-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>

          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tabs skeleton */}
        <div>
          <Skeleton className="h-10 w-96 mb-4" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.contactPerson}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {client.companyName && <span>{client.companyName}</span>}
              {client.isGuest ? (
                <Badge className="bg-amber-500 hover:bg-amber-600">Guest</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                  Permanent
                </Badge>
              )}
              {client.isGuest && client.accessExpiry && isClientExpired(client) && (
                <Badge variant="destructive">Expired</Badge>
              )}
              {!hasWriteAccess && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Read Only
                </Badge>
              )}
            </div>
          </div>
        </div>

        {hasWriteAccess && (
          <Button asChild>
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Client
            </Link>
          </Button>
        )}
      </div>
      {/* Main content with tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Contact details and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Details</h3>
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{client.contactPerson}</p>
                        <p className="text-xs text-muted-foreground">Contact Person</p>
                      </div>
                    </div>

                    {client.companyName && (
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p>{client.companyName}</p>
                          <p className="text-xs text-muted-foreground">Company</p>
                        </div>
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <a 
                            href={`mailto:${client.email}`}
                            className="text-primary hover:underline"
                          >
                            {client.email}
                          </a>
                          <p className="text-xs text-muted-foreground">Email</p>
                        </div>
                      </div>
                    )}

                    {client.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <a 
                            href={`tel:${client.phone}`}
                            className="text-primary hover:underline"
                          >
                            {client.phone}
                          </a>
                          <p className="text-xs text-muted-foreground">Phone</p>
                        </div>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="whitespace-pre-line">{client.address}</p>
                          <p className="text-xs text-muted-foreground">Address</p>
                        </div>
                      </div>
                    )}

                    {client.gstin && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          GSTIN
                        </p>
                        <p className="text-lg">{client.gstin}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Details</h3>
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p>{format(new Date(client.createdAt), "PPP")}</p>
                        <p className="text-xs text-muted-foreground">Date Added</p>
                      </div>
                    </div>

                    {client.isGuest && client.accessExpiry && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className={isClientExpired(client) ? "text-destructive font-medium" : ""}>
                            {isClientExpired(client) 
                              ? "Access Expired" 
                              : format(new Date(client.accessExpiry), "PPP")}
                          </p>
                          <p className="text-xs text-muted-foreground">Access Expiry</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p>{client.manager.name}</p>
                        <p className="text-xs text-muted-foreground">Account Manager</p>
                      </div>
                    </div>
                  </div>

                  {client.notes && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <div className="bg-muted/50 p-3 rounded-md whitespace-pre-line text-sm">
                        {client.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Client Tasks</CardTitle>
                <CardDescription>
                  Tasks associated with this client
                </CardDescription>
              </div>
              {hasWriteAccess && (
                <Button asChild size="sm">
                  <Link href={`/dashboard/tasks/create?clientId=${client.id}`}>
                    Add New Task
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {client.tasks && client.tasks.length > 0 ? (
                <div className="space-y-4">
                  {client.tasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Link 
                              href={`/dashboard/tasks/${task.id}`}
                              className="font-medium hover:underline"
                            >
                              {task.title}
                            </Link>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  task.status === "completed" ? "outline" :
                                  task.status === "in_progress" ? "secondary" :
                                  task.status === "pending" ? "default" :
                                  "outline"
                                }
                                className="text-xs"
                              >
                                {task.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  task.priority === "high" 
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
                                    : task.priority === "medium"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                }
                              >
                                {task.priority}
                              </Badge>
                              
                              {task.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  Due {format(new Date(task.dueDate), "PPP")}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.assignedTo && (
                            <div className="text-right text-sm">
                              <p className="font-medium">{task.assignedTo.name}</p>
                              <p className="text-xs text-muted-foreground">Assignee</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                  <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Couldn&apos;t find any active tasks for this client.
                  </p>
                  {hasWriteAccess && (
                    <Button asChild>
                      <Link href={`/dashboard/tasks/create?clientId=${client.id}`}>
                        Create First Task
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <UnifiedHistoryTab
            clientId={client.id}
            isPermanent={!client.isGuest}
            isAdmin={hasWriteAccess}
          />
        </TabsContent>

        {/* Placeholder for Documents Tab - will be implemented in detail separately */}
        <TabsContent value="credentials" className="space-y-4">
          <CredentialsTab 
          clientId={client.id}
          isAdmin={hasWriteAccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
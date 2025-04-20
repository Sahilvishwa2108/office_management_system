"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Copy, Eye, EyeOff, Plus, Trash2, Loader2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveTable } from "@/components/ui/responsive-table";

interface Credential {
  id: string;
  title: string;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

interface CredentialsTabProps {
  clientId: string;
  isAdmin: boolean;
}

export function CredentialsTab({ clientId, isAdmin }: CredentialsTabProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  const [newCredential, setNewCredential] = useState({
    title: "",
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch credentials
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/clients/${clientId}/credentials`);
        
        // Check the response format and extract the array correctly
        const credentialData = response.data?.credentials || response.data;
        
        // Ensure we always have an array
        setCredentials(Array.isArray(credentialData) ? credentialData : []);
        setError(null);
      } catch (err: unknown) {
        console.error("Error fetching credentials:", err);
        setError("Failed to load credentials");
        toast.error("Failed to load credentials");
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [clientId]);

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  // Add new credential
  const handleAddCredential = async () => {
    if (!newCredential.title || !newCredential.password) {
      toast.error("Title and Password are required fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`/api/clients/${clientId}/credentials`, newCredential);
      setCredentials(prev => [...prev, response.data]);
      toast.success("Credential added successfully");
      setAddDialogOpen(false);
      setNewCredential({
        title: "",
        username: "",
        password: "",
      });
    } catch (err: unknown) {
      console.error("Error adding credential:", err);
      const errorMessage = (err as {response?: {data?: {error?: string}}})?.response?.data?.error || "Failed to add credential";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete credential
  const deleteCredential = async (id: string) => {
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/clients/${clientId}/credentials/${id}`);
      setCredentials(prev => prev.filter(cred => cred.id !== id));
      toast.success("Credential deleted successfully");
      setDeleteDialogOpen(false);
      setCredentialToDelete(null);
    } catch (err: unknown) {
      console.error("Error deleting credential:", err);
      const errorMessage = (err as {response?: {data?: {error?: string}}})?.response?.data?.error || "Failed to delete credential";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Show delete confirmation dialog
  const confirmDelete = (id: string) => {
    setCredentialToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>Manage access credentials for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-3">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium">Error Loading Credentials</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>Manage access credentials for this client</CardDescription>
        </div>
        {/* Allow both admin and partner to add credentials */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
              <DialogDescription>
                Create a new access credential for this client.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title* (Required)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Website Admin Access"
                  value={newCredential.title}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username/Email (Optional)</Label>
                <Input
                  id="username"
                  placeholder="Username or email"
                  value={newCredential.username}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password* (Required)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={newCredential.password}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCredential} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Credential"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {credentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No Credentials Found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add credentials to provide login details to this client.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              Add First Credential
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((credential) => (
                    <TableRow key={credential.id}>
                      <TableCell className="font-medium">
                        {credential.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[140px]">{credential.username}</span>
                          {credential.username && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => copyToClipboard(credential.username, "Username")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy username</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs rounded bg-muted px-2 py-1">
                            {visiblePasswords.includes(credential.id) 
                              ? credential.password 
                              : '•'.repeat(Math.min(10, credential.password.length))}
                          </span>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => togglePasswordVisibility(credential.id)}
                            >
                              {visiblePasswords.includes(credential.id) 
                                ? <EyeOff className="h-3.5 w-3.5" /> 
                                : <Eye className="h-3.5 w-3.5" />}
                              <span className="sr-only">
                                {visiblePasswords.includes(credential.id) ? "Hide" : "Show"} password
                              </span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => copyToClipboard(credential.password, "Password")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy password</span>
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(credential.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Only admin can delete credentials */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(credential.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          </div>
        )}
        
        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the credential
                and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => credentialToDelete && deleteCredential(credentialToDelete)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

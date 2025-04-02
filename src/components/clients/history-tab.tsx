"use client";
import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Trash2, 
  Clock, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientHistoryEntry {
  id: string;
  description: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface HistoryTabProps {
  clientId: string;
  isPermanent: boolean;
  isAdmin: boolean;
}

// Form schema
const historyFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

type HistoryFormValues = z.infer<typeof historyFormSchema>;

export function HistoryTab({ clientId, isPermanent, isAdmin }: HistoryTabProps) {
  const [history, setHistory] = useState<ClientHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<HistoryFormValues>({
    resolver: zodResolver(historyFormSchema),
    defaultValues: {
      description: "",
    },
  });

  // Fetch history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/clients/${clientId}/history`);
      
      if (!response.ok) {
        throw new Error(`Error fetching history: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHistory(data.historyEntries);
    } catch (err: any) {
      console.error("Failed to fetch client history:", err);
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Add history entry
  const addHistoryEntry = async (values: HistoryFormValues) => {
    try {
      setAdding(true);
      
      const response = await fetch(`/api/clients/${clientId}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error(`Error adding history entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add new entry to state
      setHistory(prev => [data.historyEntry, ...prev]);
      
      // Reset form
      form.reset();
      
      toast.success("History entry added successfully");
    } catch (err: any) {
      console.error("Failed to add history entry:", err);
      toast.error(err.message || "Failed to add history entry");
    } finally {
      setAdding(false);
    }
  };

  // Delete history entry
  const deleteHistoryEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this history entry?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/clients/${clientId}/history?entryId=${entryId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting history entry: ${response.statusText}`);
      }
      
      // Remove entry from state
      setHistory(prev => prev.filter(entry => entry.id !== entryId));
      
      toast.success("History entry deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete history entry:", err);
      toast.error(err.message || "Failed to delete history entry");
    }
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Load history on component mount
  React.useEffect(() => {
    fetchHistory();
  }, [clientId]);

  if (!isPermanent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">History Not Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          History tracking is only available for permanent clients.
          This is a guest client and will expire on its set date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(addHistoryEntry)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add New History Entry</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Record client interaction, meeting notes, changes, etc."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">History Timeline</h3>
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-24 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-muted p-6 text-center rounded-md">
            <p className="text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchHistory}>
              Try Again
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-muted p-6 text-center rounded-md">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No history entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.createdBy.name}`} />
                        <AvatarFallback>{getInitials(entry.createdBy.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{entry.createdBy.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive/80 hover:text-destructive"
                        onClick={() => deleteHistoryEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="mt-4 whitespace-pre-wrap text-sm">
                    {entry.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
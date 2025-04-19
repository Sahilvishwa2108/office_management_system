"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trash2,
  Clock,
  RefreshCcw,
  CalendarIcon,
  XCircle,
  Receipt,
  Pin,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types for different history entries
interface GeneralHistoryEntry {
  id: string;
  content: string;
  type: "general";
  createdAt: string;
  pinned: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface TaskHistoryEntry {
  id: string;
  content: string;
  type: "task_completed" | "task_cancelled";
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  taskStatus: string;
  taskCompletedDate: string;
  taskBilledDate?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  billingDetails?: {
    billedBy: string;
    billedByName: string;
    billedAt: string;
  };
}

type HistoryEntry = GeneralHistoryEntry | TaskHistoryEntry;
interface UnifiedHistoryTabProps {
  clientId: string;
  isPermanent: boolean;
  isAdmin: boolean;
}

// Form schema for adding entries
const historyFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

type HistoryFormValues = z.infer<typeof historyFormSchema>;

export function UnifiedHistoryTab({
  clientId,
  isPermanent,
  isAdmin,
}: UnifiedHistoryTabProps) {
  const [activeTab, setActiveTab] = useState<"all" | "notes" | "tasks">("all");
  const [generalHistory, setGeneralHistory] = useState<GeneralHistoryEntry[]>(
    []
  );
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Initialize form
  const form = useForm<HistoryFormValues>({
    resolver: zodResolver(historyFormSchema),
    defaultValues: {
      description: "",
    },
  });

  const togglePinHistoryEntry = async (entryId: string, pinned: boolean) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/history`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId, pinned }),
      });

      if (!response.ok) {
        throw new Error(`Error updating pinned status: ${response.statusText}`);
      }

      const { updatedEntry } = await response.json();

      // Update the state
      setGeneralHistory((prev) =>
        prev.map((entry) =>
          entry.id === updatedEntry.id
            ? { ...entry, pinned: updatedEntry.pinned }
            : entry
        )
      );

      toast.success(`Entry ${pinned ? "pinned" : "unpinned"} successfully`);
    } catch (err: any) {
      console.error("Failed to update pinned status:", err);
      toast.error(err.message || "Failed to update pinned status");
    }
  };

  // Get all history entries, sorted by date
  const getAllHistory = (): HistoryEntry[] => {
    const allHistory = [...generalHistory, ...taskHistory];
    return allHistory.sort((a, b) => {
      // Check if both entries are GeneralHistoryEntry to compare `pinned`
      if ("pinned" in a && "pinned" in b) {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1; // Pinned entries come first
        }
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Get filtered history based on active tab
  const getFilteredHistory = (): HistoryEntry[] => {
    const allHistory = getAllHistory();

    if (activeTab === "all") return allHistory;
    if (activeTab === "notes") return generalHistory;
    if (activeTab === "tasks") return taskHistory;

    return allHistory;
  };

  // Fetch general history
  const fetchGeneralHistory = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/history`);

      if (!response.ok) {
        throw new Error(
          `Error fetching general history: ${response.statusText}`
        );
      }

      const data = await response.json();
      setGeneralHistory(data.historyEntries || []);
      return data.historyEntries || [];
    } catch (err: any) {
      console.error("Failed to fetch general history:", err);
      throw err;
    }
  };

  // Fetch task history
  const fetchTaskHistory = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/task-history`);

      if (!response.ok) {
        throw new Error(`Error fetching task history: ${response.statusText}`);
      }

      const data = await response.json();
      setTaskHistory(data.taskHistory || []);
      return data.taskHistory || [];
    } catch (err: any) {
      console.error("Failed to fetch task history:", err);
      throw err;
    }
  };

  // Fetch all history
  const fetchAllHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both types of history in parallel
      await Promise.all([
        fetchGeneralHistory(),
        isPermanent ? fetchTaskHistory() : Promise.resolve([]),
      ]);
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
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
        body: JSON.stringify({ description: values.description }),
      });

      if (!response.ok) {
        throw new Error(`Error adding history entry: ${response.statusText}`);
      }

      const data = await response.json();

      // Add new entry to state
      setGeneralHistory((prev) => [data.historyEntry, ...prev]);

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
    try {
      const response = await fetch(
        `/api/clients/${clientId}/history?entryId=${entryId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Error deleting history entry: ${response.statusText}`);
      }

      // Remove entry from state
      setGeneralHistory((prev) => prev.filter((entry) => entry.id !== entryId));
      setDeleteDialogOpen(false);
      setEntryToDelete(null);

      toast.success("History entry deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete history entry:", err);
      toast.error(err.message || "Failed to delete history entry");
    }
  };

  // Helper for avatars
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get status badge for task history
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Check if entry is a task history entry
  const isTaskHistory = (entry: HistoryEntry): entry is TaskHistoryEntry => {
    return entry.type === "task_completed" || entry.type === "task_cancelled";
  };

  // Load history on component mount
  useEffect(() => {
    if (clientId) {
      fetchAllHistory();
    }
  }, [clientId]);

  if (!isPermanent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">History Not Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          History tracking is only available for permanent clients. This is a
          guest client and will expire on its set date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new entry form - only show for admins */}
      {isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(addHistoryEntry)}
                className="space-y-4"
              >
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
                  <Button type="submit" disabled={adding}>
                    {adding ? "Adding..." : "Add Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* If not admin, show read-only notice */}
      {!isAdmin && isPermanent && (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>Read-only access</AlertTitle>
          <AlertDescription>
            You can view client history but cannot add or modify entries.
          </AlertDescription>
        </Alert>
      )}

      {/* History tabs and content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Client History</h3>
          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-fit"
            >
              <TabsList className="grid grid-cols-3 w-[300px]">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary/10">All</TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-primary/10">Notes</TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-primary/10">Tasks</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllHistory}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-muted h-8 w-8 rounded-full"></div>
                      <div>
                        <div className="bg-muted h-4 w-32 rounded-md mb-2"></div>
                        <div className="bg-muted h-3 w-20 rounded-md"></div>
                      </div>
                    </div>
                    <div className="bg-muted h-16 rounded-md w-full"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-muted p-6 text-center rounded-md">
            <p className="text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAllHistory}>
              Try Again
            </Button>
          </div>
        ) : getFilteredHistory().length === 0 ? (
          <div className="bg-muted/30 p-8 text-center rounded-md border border-dashed border-muted-foreground/30">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-70" />
            <p className="text-muted-foreground font-medium">
              {activeTab === "all"
                ? "No history entries yet"
                : activeTab === "notes"
                ? "No notes yet"
                : "No task history yet"}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {activeTab === "all"
                ? "Start by adding a new entry"
                : activeTab === "notes"
                ? "Add a note to keep track of client interactions"
                : "Completed tasks will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredHistory().map((entry) => (
              <Card 
                key={entry.id} 
                className={`overflow-hidden transition-all ${
                  !isTaskHistory(entry) && entry.pinned 
                    ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),0.2)]" 
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  {!isTaskHistory(entry) ? (
                    // General history entry
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 ring-2 ring-muted-foreground/10">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.createdBy.name}`}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(entry.createdBy.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {entry.createdBy.name}
                              {entry.pinned && (
                                <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  <Pin className="h-3 w-3" /> Pinned
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(entry.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          {/* Pin Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`hover:bg-muted/10 p-1 rounded-full ${
                              entry.pinned ? "text-primary" : "text-muted-foreground"
                            }`}
                            onClick={() =>
                              togglePinHistoryEntry(entry.id, !entry.pinned)
                            }
                          >
                            <span title={entry.pinned ? "Unpin" : "Pin"}>
                              <Pin
                                className={`h-5 w-5 transition-all ${
                                  entry.pinned ? "scale-110" : ""
                                }`}
                                fill={entry.pinned ? "currentColor" : "none"} // Fill only when pinned
                              />
                            </span>
                          </Button>

                          {/* Delete Button */}
                          <AlertDialog open={deleteDialogOpen && entryToDelete === entry.id} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => {
                                  setEntryToDelete(entry.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete History Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this history entry.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteHistoryEntry(entry.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="mt-4 whitespace-pre-wrap text-sm bg-card p-3 rounded-md border">
                        {entry.content}
                      </div>
                    </>
                  ) : (
                    // Task history entry
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            entry.taskStatus === "completed" ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                          <h3 className="font-medium">{entry.taskTitle}</h3>
                        </div>
                        {getStatusBadge(entry.taskStatus)}
                      </div>

                      {entry.taskDescription && (
                        <div className="text-sm text-muted-foreground mb-3 bg-muted/50 p-2 rounded-md">
                          {entry.taskDescription}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>
                            Completed:{" "}
                            {format(
                              new Date(entry.taskCompletedDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>

                        {entry.taskBilledDate && (
                          <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
                            <Receipt className="h-3.5 w-3.5" />
                            <span>
                              Billed:{" "}
                              {format(
                                new Date(entry.taskBilledDate),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Added by {entry.createdBy.name} •{" "}
                        {formatDistanceToNow(new Date(entry.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

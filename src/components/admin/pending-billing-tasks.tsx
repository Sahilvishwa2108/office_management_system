"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { BillingApprovalButton } from "@/components/tasks/billing-approval-button";
import { Receipt, RefreshCcw, ExternalLink } from "lucide-react";
import Link from "next/link";

// Update interface to remove assignedTo and add assignees
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  billingStatus: string;
  // REMOVE: assignedTo field
  assignees?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  client?: {
    id: string;
    contactPerson: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function PendingBillingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to fetch pending billing tasks
  const fetchPendingBillingTasks = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching pending billing tasks...");
      
      // Log the request params for verification
      console.log("📤 Request params:", {
        status: "completed",
        billingStatus: "pending_billing"
      });
      
      const response = await axios.get("/api/tasks", {
        params: {
          status: "completed",
          billingStatus: "pending_billing"
        }
      });
      
      // Log the raw response to see its structure
      console.log("📥 Raw API response:", response);
      console.log("📄 Response data:", response.data);
      
      // Handle both new and old response formats
      let tasksData;
      if (response.data && response.data.tasks) {
        // New format with pagination
        console.log("📊 New response format detected with pagination");
        tasksData = response.data.tasks;
      } else if (Array.isArray(response.data)) {
        // Old format (direct array)
        console.log("📊 Old response format detected (direct array)");
        tasksData = response.data;
      } else {
        // Unexpected format
        console.warn("⚠️ Unexpected response format:", typeof response.data);
        tasksData = [];
      }
      
      console.log("📊 Number of tasks to display:", tasksData.length);
      setTasks(tasksData);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching pending billing tasks:", err);
      if (axios.isAxiosError(err)) {
        console.error("❌ Axios error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
      }
      setError("Failed to load pending billing tasks");
      toast.error("Failed to load pending billing tasks");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh handling
  useEffect(() => {
    fetchPendingBillingTasks();
  }, [refreshTrigger]);

  // Refresh function to be called after approval
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-500" />
            Pending Billing Approval
          </CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-5 w-3/5 mb-3" />
                <Skeleton className="h-4 w-4/5 mb-2" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={refreshData} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground">No tasks pending for billing approval</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-lg">{task.title}</h3>
                <TaskStatusBadge status={task.status} billingStatus={task.billingStatus} />
              </div>
              
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                {task.client ? (
                  <span>
                    Client: <strong>{task.client.companyName || task.client.contactPerson}</strong>
                  </span>
                ) : (
                  <span>No client attached</span>
                )}
                <span className="mx-2">•</span>
                <span>
                  {task.assignees && task.assignees.length > 0 
                    ? `Assigned to: ${task.assignees.map(a => a.name).join(', ')}`
                    : "Unassigned"}
                </span>
              </div>
              
              <div className="flex gap-2">
                <BillingApprovalButton
                  task={task}
                  taskId={task.id}
                  onApproved={() => {
                    refreshData();
                    toast.success(`Billing approved for task "${task.title}"`);
                  }}
                />
                <Link href={`/dashboard/tasks/${task.id}`} passHref>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
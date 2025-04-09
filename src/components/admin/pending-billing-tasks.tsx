"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillingApprovalButton } from "@/components/tasks/billing-approval-button";
import { Calendar, Clock, Building, User, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: string;
  billingStatus: string;
  clientId: string;
  dueDate: string | null;
  updatedAt: string;
  client: {
    id: string;
    contactPerson: string;
    companyName: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

export function PendingBillingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingBillingTasks = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/tasks?billingStatus=pending_billing");
        setTasks(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching pending billing tasks:", err);
        setError("Failed to load pending billing tasks");
        toast.error("Failed to load pending billing tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingBillingTasks();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Billing</CardTitle>
          <CardDescription>Tasks awaiting billing approval</CardDescription>
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Billing</CardTitle>
          <CardDescription>Tasks awaiting billing approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Billing</CardTitle>
          <CardDescription>Tasks awaiting billing approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            No tasks pending billing approval
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Billing</CardTitle>
        <CardDescription>Tasks awaiting billing approval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium">{task.title}</h3>
              <div className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                Pending Billing
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {task.client.companyName || task.client.contactPerson}
                </span>
              </div>
              
              {task.assignedTo && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{task.assignedTo.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {format(new Date(task.updatedAt), "MMM d, yyyy")}
                </span>
              </div>
              
              {task.dueDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <BillingApprovalButton 
                taskId={task.id} 
                taskTitle={task.title}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/tasks/${task.id}`}>
                  <ArrowUpRight className="h-4 w-4 mr-1" /> View Task
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
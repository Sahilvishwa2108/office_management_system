"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

export default function TestCronPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (session?.user?.role !== "ADMIN") {
    return <div className="p-6">Only administrators can access this page.</div>;
  }

  const runTest = async (endpoint: string) => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/cron/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Test Cron Jobs</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows administrators to manually test the cron job endpoints.
      </p>

      <Tabs defaultValue="expired-clients">
        <TabsList className="mb-4">
          <TabsTrigger value="expired-clients">Expired Clients</TabsTrigger>
          <TabsTrigger value="scheduled-tasks">Scheduled Task Deletions</TabsTrigger>
          <TabsTrigger value="test-data">Create Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="expired-clients">
          <Card>
            <CardHeader>
              <CardTitle>Test Expired Client Deletion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This will run the cron job that checks for expired guest clients and deletes them.</p>
              <Button 
                onClick={() => runTest("expired-clients")} 
                disabled={isLoading}
              >
                {isLoading ? "Running..." : "Run Test"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled-tasks">
          <Card>
            <CardHeader>
              <CardTitle>Test Scheduled Task Deletion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This will run the cron job that checks for tasks scheduled for deletion.</p>
              <Button 
                onClick={() => runTest("scheduled-task-deletions")} 
                disabled={isLoading}
              >
                {isLoading ? "Running..." : "Run Test"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test-data">
          <Card>
            <CardHeader>
              <CardTitle>Create Test Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Create Expired Guest Client</h3>
                  <p className="mb-2">Creates a test guest client with an expiry date in the past</p>
                  <Button onClick={async () => {
                    try {
                      setIsLoading(true);
                      const pastDate = new Date();
                      pastDate.setDate(pastDate.getDate() - 1);
                      
                      const res = await fetch('/api/clients', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contactPerson: `Test Expired Guest (${format(new Date(), "MMM d HH:mm")})`,
                          email: `test-${Date.now()}@example.com`,
                          phone: "1234567890",
                          isGuest: true,
                          accessExpiry: pastDate.toISOString()
                        })
                      });
                      
                      const data = await res.json();
                      setResult({ message: "Test expired guest client created", client: data });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unknown error");
                    } finally {
                      setIsLoading(false);
                    }
                  }}>
                    Create Expired Guest
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Create Task Scheduled for Deletion</h3>
                  <p className="mb-2">Creates a test task marked as billed with a past deletion date</p>
                  <Button onClick={async () => {
                    try {
                      setIsLoading(true);
                      const pastDate = new Date();
                      pastDate.setDate(pastDate.getDate() - 1);
                      
                      // First, we need a client
                      const clientRes = await fetch('/api/clients', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contactPerson: `Test Client for Task (${format(new Date(), "MMM d HH:mm")})`,
                          email: `client-${Date.now()}@example.com`
                        })
                      });
                      
                      const clientData = await clientRes.json();
                      
                      // Now create a task for that client
                      const taskRes = await fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: `Test Task for Deletion (${format(new Date(), "MMM d HH:mm")})`,
                          description: "This is a test task scheduled for deletion",
                          clientId: clientData.id,
                          priority: "normal",
                          status: "completed",
                          billingStatus: "billed",
                          billingDate: new Date().toISOString(),
                          scheduledDeletionDate: pastDate.toISOString()
                        })
                      });
                      
                      const taskData = await taskRes.json();
                      
                      // Create history entry for the task
                      await fetch(`/api/clients/${clientData.id}/history`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          taskId: taskData.id,
                          taskTitle: taskData.title,
                          taskStatus: "completed",
                          taskCompletedDate: new Date().toISOString(),
                          billingDetails: {
                            amount: 5000,
                            currency: "INR"
                          }
                        })
                      });
                      
                      setResult({ 
                        message: "Test task scheduled for deletion created", 
                        client: clientData,
                        task: taskData 
                      });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unknown error");
                    } finally {
                      setIsLoading(false);
                    }
                  }}>
                    Create Scheduled Task
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <Separator className="mb-4" />
          <pre className="bg-muted p-4 rounded-md overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
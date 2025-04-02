"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart,
  Users,
  CheckCircle,
  Clock,
  Activity,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { StaffCard } from "@/components/dashboard/staff-card";
import { TaskCard } from "@/components/dashboard/task-card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PartnerActivity } from "@/components/dashboard/partner-activity";

interface PartnerDashboardData {
  stats: {
    totalStaff: number;
    activeTasks: number;
    pendingTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    staffUtilization: number;
  };
  staff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    activeTasks: number;
    completedTasks: number;
    status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignedTo?: {
      id: string;
      name: string;
      image?: string;
    };
    progress?: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    user: {
      name: string;
      role: string;
      avatar?: string;
    };
    action: string;
    target: string;
    timestamp: string;
  }>;
}

export default function PartnerDashboard() {
  const [dashboardData, setDashboardData] =
    useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API call to fetch dashboard data
        const response = await fetch("/api/partner/dashboard");

        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch partner dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Default empty data if still loading
  const stats = dashboardData?.stats || {
    totalStaff: 0,
    activeTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
    staffUtilization: 0,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/partner/users/create">
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Staff"
              value={loading ? "..." : stats.totalStaff.toString()}
              description="Active staff members" // Changed from utilization percentage
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              // Remove the trend prop that depends on staffUtilization
            />
            <StatsCard
              title="Active Tasks"
              value={loading ? "..." : stats.activeTasks.toString()}
              description={`${stats.pendingTasks} pending`}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completion Rate"
              value={loading ? "..." : `${stats.taskCompletionRate}%`}
              description="Tasks completed on time"
              trend={
                stats.taskCompletionRate > 80
                  ? "up"
                  : stats.taskCompletionRate < 50
                  ? "down"
                  : "neutral"
              }
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Tasks Completed"
              value={loading ? "..." : stats.completedTasks.toString()}
              description="In the last 30 days"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DashboardCard
              title="Recent Activity"
              className="col-span-4"
              loading={loading}
            >
              {error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <PartnerActivity
                  activities={dashboardData?.recentActivities || []}
                  loading={loading}
                />
              )}
            </DashboardCard>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Priority Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded-md"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                ) : dashboardData?.tasks?.filter((t) => t.priority === "high")
                    .length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No high priority tasks
                    </p>
                  </div>
                ) : (
                  dashboardData?.tasks
                    ?.filter((task) => task.priority === "high")
                    .slice(0, 3)
                    .map((task) => (
                      <Link
                        key={task.id}
                        href={`/dashboard/partner/tasks/${task.id}`}
                      >
                        <div className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium truncate">
                                {task.title}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {task.assignedTo?.name || "Unassigned"}
                              </p>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs ${
                                task.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : task.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : task.status === "review"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                              }`}
                            >
                              {task.status}
                            </div>
                          </div>
                          {task.dueDate && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                )}
                <Link href="/dashboard/partner/tasks">
                  <Button variant="outline" className="w-full justify-between">
                    View All Tasks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // Loading placeholders for staff cards
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-2/3 bg-muted rounded"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : dashboardData?.staff && dashboardData.staff.length > 0 ? (
              dashboardData.staff.map((staff) => (
                <StaffCard
                  key={staff.id}
                  id={staff.id}
                  name={staff.name}
                  email={staff.email}
                  role={staff.role}
                  imageSrc={staff.image}
                  activeTasks={staff.activeTasks}
                  completedTasks={staff.completedTasks}
                  status={staff.status}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">No staff members found</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/partner/users/create">
                    <Plus className="mr-2 h-4 w-4" /> Add Staff Member
                  </Link>
                </Button>
              </div>
            )}
          </div>
          {dashboardData?.staff && dashboardData.staff.length > 0 && (
            <div className="flex justify-end">
              <Button asChild variant="outline">
                <Link href="/dashboard/partner/users">
                  View All Staff Members
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // Loading placeholders for task cards
              [...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 bg-muted rounded"></div>
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-full bg-muted rounded"></div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div className="h-6 w-16 bg-muted rounded"></div>
                    <div className="h-6 w-16 bg-muted rounded"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : dashboardData?.tasks && dashboardData.tasks.length > 0 ? (
              dashboardData.tasks
                .slice(0, 6)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    description={task.description}
                    status={task.status}
                    priority={task.priority}
                    dueDate={task.dueDate}
                    assignee={task.assignedTo}
                    progress={task.progress}
                  />
                ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No tasks found</p>
              </div>
            )}
          </div>
          {dashboardData?.tasks && dashboardData.tasks.length > 0 && (
            <div className="flex justify-end">
              <Button asChild variant="outline">
                <Link href="/dashboard/partner/tasks">
                  View All Tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

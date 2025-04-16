"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Users,
  Users2,
  CheckCircle,
  Clock,
  Activity,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { StaffCard } from "@/components/dashboard/staff-card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { TaskSummary } from "@/components/dashboard/task-summary";
import { useRouter } from "next/navigation";
import { DashboardStatsSkeleton, DashboardContentSkeleton } from "@/components/loading/dashboard-skeleton";
import { UserCardSkeleton } from "@/components/loading/user-skeleton";
import { TaskListSkeleton } from "@/components/loading/task-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

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

function PartnerDashboardContent() {
  const [dashboardData, setDashboardData] =
    useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        {loading ? (
            <>
              <DashboardStatsSkeleton />
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
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
              title="Tasks Completed"
              value={loading ? "..." : stats.completedTasks.toString()}
              description="In the last 30 days"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-center p-1">
                  <div className="text-center">
                    <Users2 className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                    <h3 className="mt-2 font-medium">Client Directory</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Access client information in read-only mode
                    </p>
                    <Button className="mt-3" asChild>
                      <Link href="/dashboard/clients">
                        View Clients
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 lg:col-span-3">
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>Overview of task allocation and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-full bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-muted-foreground">
                    Failed to load task distribution
                  </div>
                ) : (
                  <div className="space-y-6">
                    <TaskProgress 
                      items={[
                        { label: "Completed", value: stats.completedTasks, color: "bg-green-500" },
                        { label: "In Progress", value: stats.activeTasks - stats.pendingTasks, color: "bg-blue-500" },
                        { label: "Pending", value: stats.pendingTasks, color: "bg-amber-500" }
                      ]}
                      size="lg"
                      showLabels={true}
                      showPercentages={true}
                    />
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <Button 
                        onClick={() => router.push("/dashboard/tasks/create")}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push("/dashboard/tasks/assign")}
                        className="w-full"
                      >
                        Assign Tasks
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <DashboardCard title="Team Performance" className="col-span-4" loading={loading}>
              {!loading && !error && dashboardData?.staff && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Staff with tasks</p>
                      <p className="text-2xl font-bold">
                        {dashboardData.staff.filter(s => s.activeTasks > 0).length}/{dashboardData.staff.length}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Average completion</p>
                      <p className="text-2xl font-bold">{stats.taskCompletionRate}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Top Performers</h3>
                    <div className="space-y-2">
                      {dashboardData.staff
                        .sort((a, b) => b.completedTasks - a.completedTasks)
                        .slice(0, 3)
                        .map((staff) => (
                          <div key={staff.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={staff.image || `https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} />
                                <AvatarFallback>{staff.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{staff.name}</span>
                            </div>
                            <span className="text-sm">{staff.completedTasks} completed</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </DashboardCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DashboardCard title="Recent Activity" className="col-span-4" loading={loading}>
              <ActivityFeed 
                fetchUrl="/api/activities"
                loading={loading}
                showUserInfo={true}
                showRoleInfo={true}
              />
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
                        href={`/dashboard/tasks/${task.id}`}
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
                <Link href="/dashboard/tasks">
                  <Button variant="outline" className="w-full justify-between">
                    View All Tasks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          </>
          )}
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
              {Array(6).fill(0).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Task Management</h2>
              <p className="text-sm text-muted-foreground">Overview and management of all team tasks</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => router.push("/dashboard/tasks?filter=overdue")}
              >
                {stats.pendingTasks > 0 && (
                  <span className="h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                    {stats.pendingTasks}
                  </span>
                )}
                Overdue
              </Button>
              
              <Button onClick={() => router.push("/dashboard/tasks/create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <TaskListSkeleton />
          ) : (
            <>
            <TaskSummary
              title="High Priority"
              description="Tasks requiring immediate attention"
              tasks={(dashboardData?.tasks?.filter(t => t.priority === 'high') || []).map(task => ({
                ...task,
                dueDate: task.dueDate || null
              }))}
              limit={5}
              showAssignee={true}
              onTaskClick={(taskId) => router.push(`/dashboard/tasks/${taskId}`)}
            />
            <TaskSummary
              title="In Progress"
              description="Tasks currently being worked on"
              tasks={(dashboardData?.tasks?.filter(t => t.status === 'in-progress') || []).map(task => ({
                ...task,
                dueDate: task.dueDate || null
              }))}
              limit={5}
              showAssignee={true}
              onTaskClick={(taskId) => router.push(`/dashboard/tasks/${taskId}`)}
            />
            <TaskSummary
              title="Recently Completed"
              description="Tasks completed in the last 7 days"
              tasks={(dashboardData?.tasks?.filter(t => t.status === 'completed') || []).map(task => ({
                ...task,
                dueDate: task.dueDate || null
              }))}
              limit={5}
              showAssignee={true}
              onTaskClick={(taskId) => router.push(`/dashboard/tasks/${taskId}`)}
            />
            </>
          )}
          </div>
          
          <div className="flex justify-end">
            <Button asChild variant="outline">
              <Link href="/dashboard/tasks">
                View All Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PartnerDashboard() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
        
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    }>
      <PartnerDashboardContent />
    </Suspense>
  );
}

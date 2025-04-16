"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Users as UsersIcon, 
  UserCheck, 
  Briefcase, 
  Activity, 
  ArrowRight,
  Plus,
  CheckCircle,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsSkeleton, DashboardContentSkeleton } from "@/components/loading/dashboard-skeleton";
import { PendingBillingTasks } from "@/components/admin/pending-billing-tasks";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo?: {
    name: string;
  } | null;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalClients: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasksCount: number;
    newUsersThisMonth: number;
  };
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
  tasks: Task[];
}

function AdminDashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API call to fetch dashboard data
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch data initially
    fetchDashboardData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Poll every 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Calculate stats for display
  const stats = dashboardData?.stats || {
    totalUsers: 0,
    activeUsers: 0,
    totalClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasksCount: 0,
    newUsersThisMonth: 0
  };

  // Calculate percentage of active users
  const activeUserPercentage = useMemo(() => {
    return stats.totalUsers > 0 
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
      : 0;
  }, [stats.activeUsers, stats.totalUsers]);

  // Loading state for dashboard data
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          {/* <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList> */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Task status card skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-3 lg:col-span-1">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-12 w-full rounded-md" />
                  <div className="flex flex-wrap gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-3 lg:col-span-2">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity feed skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="grid gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/dashboard/admin/users/create">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Link>
        </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
            <OverviewStats 
              title="Total Users" 
              value={loading ? "..." : stats.totalUsers.toString()} 
              description={`${activeUserPercentage}% active`}
              icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />} 
            />
            <OverviewStats 
              title="Active Users" 
              value={loading ? "..." : stats.activeUsers.toString()} 
              icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} 
            />
            <OverviewStats 
              title="Total Clients" 
              value={loading ? "..." : stats.totalClients.toString()} 
              icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} 
            />
            <OverviewStats 
              title="Active Tasks" 
              value={loading ? "..." : stats.totalTasks.toString()} 
              icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-3 lg:col-span-1">
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>Overall task distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-full bg-muted rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TaskProgress 
                      items={[
                        { label: "Completed", value: stats.completedTasks || 0, color: "bg-green-500" },
                        { label: "In Progress", value: stats.inProgressTasks || 0, color: "bg-blue-500" },
                        { label: "Pending", value: stats.pendingTasks || 0, color: "bg-amber-500" },
                        { label: "Overdue", value: stats.overdueTasksCount || 0, color: "bg-red-500" }
                      ]}
                      size="md"
                      showLabels={true}
                      showPercentages={true}
                    />
                    
                    <Button asChild variant="outline" className="w-full mt-4">
                      <Link href="/dashboard/tasks">
                        View All Tasks
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-3 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Priority Tasks</CardTitle>
                  <CardDescription>Tasks that need immediate attention</CardDescription>
                </div>
                <Button size="sm" onClick={() => router.push('/dashboard/tasks/create')}>
                  <Plus className="mr-2 h-3 w-3" />
                  New Task
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.tasks && dashboardData.tasks
                    .filter(task => task.priority === 'high' && task.status !== 'completed')
                    .slice(0, 3)
                    .map(task => (
                      <div 
                        key={task.id} 
                        className="border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge className="bg-red-500">{task.priority}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {task.assignedTo ? `Assigned to: ${task.assignedTo.name}` : "Unassigned"}
                          </span>
                          <Badge variant="outline" className="bg-muted">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  
                  {dashboardData?.tasks && dashboardData.tasks.length > 0 && 
                   dashboardData.tasks.filter(task => task.priority === 'high' && task.status !== 'completed').length === 0 && (
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">No high priority tasks</p>
                    </div>
                  )}
                  
                  {(!dashboardData?.tasks || dashboardData.tasks.length === 0) && (
                    <div className="text-center py-6">
                      <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-muted-foreground mb-4">No tasks created yet</p>
                      <Button onClick={() => router.push('/dashboard/tasks/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Task
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <PendingBillingTasks />
            
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
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Link href="/dashboard/admin/users">
                    <Button variant="outline" className="w-full justify-between">
                      Manage Users
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/clients">
                    <Button variant="outline" className="w-full justify-between">
                      Manage Clients
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/tasks">
                    <Button variant="outline" className="w-full justify-between">
                      View All Tasks
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/documents">
                    <Button variant="outline" className="w-full justify-between">
                      Document Repository
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
          </>
          )}
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          {loading ? (
            <>
              <DashboardStatsSkeleton />
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              {/* Metrics section */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.newUsersThisMonth} new this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeUserPercentage}% of total users
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTasks}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedTasks} completed ({Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}%)
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.overdueTasksCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Need immediate attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User statistics cards */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <DashboardCard title="User Analytics" loading={loading} className="col-span-1 lg:col-span-1">
                  {!loading && !error && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Activity Overview</h3>
                        <Badge variant="outline">{activeUserPercentage}% active</Badge>
                      </div>
                      
                      <Progress value={activeUserPercentage} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{stats.activeUsers}</p>
                          <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{stats.totalUsers - stats.activeUsers}</p>
                          <p className="text-xs text-muted-foreground">Inactive</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{Math.round(stats.totalTasks / (stats.activeUsers || 1) * 10) / 10}</p>
                          <p className="text-xs text-muted-foreground">Tasks/User</p>
                        </div>
                      </div>
                    </div>
                  )}
                </DashboardCard>
                    
                <DashboardCard title="Task Performance" loading={loading} className="col-span-1 lg:col-span-2">
                  {!loading && !error && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.completedTasks}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.inProgressTasks}</p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.overdueTasksCount}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Task Status Distribution</span>
                          <span>{stats.totalTasks} total</span>
                        </div>
                        <TaskProgress 
                          items={[
                            { label: "Completed", value: stats.completedTasks || 0, color: "bg-green-500" },
                            { label: "In Progress", value: stats.inProgressTasks || 0, color: "bg-blue-500" },
                            { label: "Pending", value: stats.pendingTasks || 0, color: "bg-amber-500" },
                            { label: "Overdue", value: stats.overdueTasksCount || 0, color: "bg-red-500" }
                          ]}
                          size="lg"
                          showLabels={true}
                          showPercentages={true}
                        />
                      </div>
                    </div>
                  )}
                </DashboardCard>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboard() {
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
      <AdminDashboardContent />
    </Suspense>
  );
}
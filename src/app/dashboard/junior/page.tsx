"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  CheckCircle, 
  Clock, 
  Activity, 
  Calendar, 
  AlertTriangle, 
  FileText,
  BarChart
} from "lucide-react";
import { TaskCard } from "@/components/dashboard/task-card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { JuniorActivity } from "@/components/dashboard/junior-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";

interface JuniorDashboardData {
  stats: {
    activeTasks: number;
    completedTasks: number;
    completionRate: number;
    upcomingDeadlines: number;
    overdueTasksCount: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    progress?: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    action: string;
    target: string;
    timestamp: string;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
    isOverdue: boolean;
  }>;
}

export default function JuniorDashboard() {
  const [dashboardData, setDashboardData] = useState<JuniorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API call to fetch dashboard data
        const response = await fetch('/api/junior/dashboard');
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch junior dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Default empty data if still loading
  const stats = dashboardData?.stats || {
    activeTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    upcomingDeadlines: 0,
    overdueTasksCount: 0
  };
  
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
              title="Active Tasks" 
              value={loading ? "..." : stats.activeTasks.toString()} 
              icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
            />
            <StatsCard 
              title="Completed" 
              value={loading ? "..." : stats.completedTasks.toString()} 
              description="Last 30 days"
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} 
            />
            <StatsCard 
              title="Completion Rate" 
              value={loading ? "..." : `${stats.completionRate}%`} 
              description="Tasks completed on time"
              trend={stats.completionRate > 75 ? "up" : stats.completionRate < 50 ? "down" : "neutral"}
              icon={<BarChart className="h-4 w-4 text-muted-foreground" />} 
            />
            <StatsCard 
              title="Upcoming Deadlines" 
              value={loading ? "..." : stats.upcomingDeadlines.toString()} 
              description={stats.overdueTasksCount > 0 ? `${stats.overdueTasksCount} overdue` : "All on track"}
              trend={stats.overdueTasksCount > 0 ? "down" : "up"}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DashboardCard title="Priority Tasks" className="col-span-4" loading={loading}>
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
              ) : !dashboardData?.tasks || dashboardData.tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
                  <p className="text-muted-foreground">No active tasks</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboardData.tasks
                    .filter(task => task.status !== "completed")
                    .slice(0, 4)
                    .map(task => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        description={task.description}
                        status={task.status}
                        priority={task.priority}
                        dueDate={task.dueDate}
                        progress={task.progress}
                        compact={true}  // For a more compact view in the grid
                      />
                    ))}
                </div>
              )}
              {dashboardData?.tasks && dashboardData.tasks.length > 0 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/junior/tasks">
                      View All Tasks
                    </Link>
                  </Button>
                </div>
              )}
            </DashboardCard>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
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
                ) : (
                  <UpcomingDeadlines deadlines={dashboardData?.deadlines || []} />
                )}
              </CardContent>
            </Card>
          </div>
          
          <DashboardCard title="Recent Activity" loading={loading}>
            {error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : (
              <JuniorActivity 
                activities={dashboardData?.recentActivities || []}
                loading={loading}
              />
            )}
          </DashboardCard>
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
              dashboardData.tasks.map(task => (
                <TaskCard 
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  status={task.status}
                  priority={task.priority}
                  dueDate={task.dueDate}
                  progress={task.progress}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">No tasks available</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <DashboardCard title="Your Activity History" icon="fileText" loading={loading}>
            {error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : (
              <JuniorActivity 
                activities={dashboardData?.recentActivities || []}
                loading={loading}
                expanded={true}
              />
            )}
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
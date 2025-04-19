"use client";

import { useState, useEffect} from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  CheckCircle, 
  Activity, 
  Users2,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  Star
} from "lucide-react";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { DashboardStatsSkeleton, DashboardContentSkeleton } from "@/components/loading/dashboard-skeleton";
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card";
import { Progress } from "@/components/ui/progress";

interface JuniorDashboardData {
  stats: {
    activeTasks: number;
    completedTasks: number;
    completionRate: number;
    upcomingDeadlines: number;
    overdueTasksCount: number;
    onTimeCompletionRate: number;
    highPriorityTasks: number;
    totalTasksAssigned: number;
    weeklyCompletionRate: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    progress?: number;
    client?: string;
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
  timeTracking?: {
    thisWeek: number;
    lastWeek: number;
    weeklyTarget: number;
    dailyAverage: number;
  };
}

// Create a wrapper component for all the dashboard content
function JuniorDashboardContent() {
  const [dashboardData, setDashboardData] = useState<JuniorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const tab = url.searchParams.get('tab');
        if (tab && ['overview', 'analytics', 'activity'].includes(tab)) {
          setActiveTab(tab);
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

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

  // Load analytics data when needed
  useEffect(() => {
    if (activeTab === 'analytics' && !statsLoaded) {
      loadAnalyticsData();
    }
  }, [activeTab, statsLoaded]);

  const loadAnalyticsData = async () => {
    if (statsLoaded) return;
    
    try {
      setLoading(true);
      
      // You would typically fetch extended analytics data here
      // For now, we'll simulate a delayed response with the existing data
      
      setTimeout(() => {
        if (dashboardData) {
          // Extend stats with additional analytics
          const enhancedData = {
            ...dashboardData,
            stats: {
              ...dashboardData.stats,
              onTimeCompletionRate: 85,
              weeklyCompletionRate: 78,
              highPriorityTasks: dashboardData.tasks?.filter(t => t.priority === 'high').length || 0,
              totalTasksAssigned: (dashboardData.stats.activeTasks + dashboardData.stats.completedTasks)
            },
            timeTracking: {
              thisWeek: 38,
              lastWeek: 35,
              weeklyTarget: 40,
              dailyAverage: 7.6
            }
          };
          
          setDashboardData(enhancedData);
          setStatsLoaded(true);
        }
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', value);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Default empty data if still loading
  const stats = dashboardData?.stats || {
    activeTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    upcomingDeadlines: 0,
    overdueTasksCount: 0,
    onTimeCompletionRate: 0,
    highPriorityTasks: 0,
    totalTasksAssigned: 0,
    weeklyCompletionRate: 0
  };

  return (
    <div className="flex flex-col gap-5">
      <Tabs 
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <>
              <DashboardStatsSkeleton />
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Priority Tasks</CardTitle>
                    <CardDescription>Tasks requiring immediate attention</CardDescription>
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
                    ) : !dashboardData?.tasks || dashboardData.tasks.filter(t => t.status !== "completed").length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-2 opacity-50" />
                        <p className="text-muted-foreground">No active tasks</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {dashboardData.tasks
                          .filter(task => task.status !== "completed")
                          .sort((a, b) => {
                            // High priority first, then by due date
                            if (a.priority === 'high' && b.priority !== 'high') return -1;
                            if (a.priority !== 'high' && b.priority === 'high') return 1;
                            
                            // If same priority, sort by due date
                            if (a.dueDate && b.dueDate) {
                              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                            }
                            return 0;
                          })
                          .slice(0, 4)
                          .map(task => (
                            <Link href={`/dashboard/tasks/${task.id}`} key={task.id} className="block">
                              <div className={`border rounded-md p-3 hover:bg-muted/50 transition-colors ${
                                task.priority === 'high' 
                                  ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50' 
                                  : ''
                              }`}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium truncate">{task.title}</p>
                                    {task.client && (
                                      <p className="text-xs text-muted-foreground truncate">{task.client}</p>
                                    )}
                                  </div>
                                  <Badge className={
                                    task.status === "in-progress" 
                                      ? "bg-blue-500" 
                                      : task.status === "review"
                                        ? "bg-amber-500"
                                        : "bg-gray-500"
                                  }>
                                    {task.status.replace('-', ' ')}
                                  </Badge>
                                </div>
                                {task.dueDate && (
                                  <div className={`text-xs mt-2 flex items-center ${
                                    new Date(task.dueDate) < new Date() 
                                      ? 'text-red-700 dark:text-red-400' 
                                      : 'text-muted-foreground'
                                  }`}>
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Due {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                                {task.progress !== undefined && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Progress</span>
                                      <span>{task.progress}%</span>
                                    </div>
                                    <Progress value={task.progress} className="h-1" />
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                      </div>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/tasks">
                        View All Tasks
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <div className="col-span-2 lg:col-span-3 h-full max-h-[350px]">
                  <RecentNotificationsCard className="h-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>Tasks due in the next 7 days</CardDescription>
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
                      <div className="space-y-4">
                        <UpcomingDeadlines deadlines={dashboardData?.deadlines || []} />
                        
                        <div className="pt-2 space-y-3">
                          <h3 className="text-sm font-medium">Task Completion Progress</h3>
                          <TaskProgress 
                            items={[
                              { 
                                label: "Completed", 
                                value: stats.completedTasks, 
                                color: "bg-green-500" 
                              },
                              { 
                                label: "In Progress", 
                                value: stats.activeTasks - (stats.overdueTasksCount || 0), 
                                color: "bg-blue-500" 
                              },
                              { 
                                label: "Overdue", 
                                value: stats.overdueTasksCount || 0, 
                                color: "bg-red-500" 
                              }
                            ]}
                            showLabels={true}
                            showPercentages={true}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Client Directory</CardTitle>
                    <CardDescription>Access client information in read-only mode</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-center py-4">
                        <Users2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                        <p className="text-muted-foreground mb-4">
                          View client details, contact information, and associated task history
                        </p>
                      </div>
                      <Button asChild>
                        <Link href="/dashboard/clients">
                          View Client Directory
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          {loading && !statsLoaded ? (
            <DashboardStatsSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Active Tasks</p>
                        <p className="text-2xl font-bold">{stats.activeTasks}</p>
                      </div>
                      <div className="rounded-full p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                    {/* Decorative stripe */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Due Today</p>
                        <p className="text-2xl font-bold">{dashboardData?.deadlines?.filter(d => 
                          new Date(d.dueDate).toDateString() === new Date().toDateString()).length || 0}
                        </p>
                      </div>
                      <div className="rounded-full p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                    {/* Decorative stripe */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                        <p className="text-2xl font-bold">{stats.completedTasks}</p>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                      </div>
                      <div className="rounded-full p-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                    {/* Decorative stripe */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">High Priority</p>
                        <p className="text-2xl font-bold">{dashboardData?.tasks?.filter(t => t.priority === 'high').length || 0}</p>
                      </div>
                      <div className="rounded-full p-2 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <Star className="h-5 w-5" />
                      </div>
                    </div>
                    {/* Decorative stripe */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function JuniorDashboard() {
  return <JuniorDashboardContent />;
}
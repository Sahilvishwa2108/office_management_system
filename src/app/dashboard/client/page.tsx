"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  FileIcon, 
  MessageSquareIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DownloadIcon,
  UserIcon
} from "lucide-react";

export default function ClientDashboard() {
  const { data: session } = useSession();
  const isGuestClient = session?.user?.role === "GUEST_CLIENT";
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState({
    documents: [],
    services: [],
    activities: [],
    deadlines: []
  });
  
  // Simulate data loading
  useEffect(() => {
    setTimeout(() => {
      // In a real app, these would be API calls
      const currentDate = new Date();
      
      setClientData({
        documents: [
          { id: '1', name: 'Financial Statement.pdf', type: 'PDF', date: new Date(currentDate.setDate(currentDate.getDate() - 1)) },
          { id: '2', name: 'Tax Return 2023.docx', type: 'DOCX', date: new Date(currentDate.setDate(currentDate.getDate() - 5)) },
          { id: '3', name: 'Business Registration.pdf', type: 'PDF', date: new Date(currentDate.setDate(currentDate.getDate() - 10)) },
        ],
        services: [
          { id: '1', name: 'Tax Filing Service', status: 'in-progress', dueDate: new Date(currentDate.setDate(currentDate.getDate() + 7)) },
          { id: '2', name: 'Financial Consulting', status: 'completed', dueDate: new Date(currentDate.setDate(currentDate.getDate() - 5)) },
          { id: '3', name: 'Business Registration', status: 'pending', dueDate: new Date(currentDate.setDate(currentDate.getDate() + 14)) },
        ],
        activities: [
          { id: '1', type: 'document', description: 'Document Uploaded: Financial Statement.pdf', date: new Date(currentDate.setDate(currentDate.getDate() - 1)) },
          { id: '2', type: 'message', description: 'New Message From: John Consultant', date: new Date(currentDate.setDate(currentDate.getDate() - 3)) },
          { id: '3', type: 'service', description: 'Service Updated: Tax Filing Service - In Progress', date: new Date(currentDate.setDate(currentDate.getDate() - 5)) },
          { id: '4', type: 'document', description: 'Document Shared: Tax Instructions.pdf', date: new Date(currentDate.setDate(currentDate.getDate() - 7)) },
        ],
        deadlines: [
          { id: '1', title: 'Tax Filing Deadline', description: 'Submit required documents', date: new Date(currentDate.setDate(currentDate.getDate() + 7)), urgent: true },
          { id: '2', title: 'Quarterly Review', description: 'Virtual meeting with consultant', date: new Date(currentDate.setDate(currentDate.getDate() + 14)), urgent: false },
          { id: '3', title: 'Contract Renewal', description: 'Service agreement expires', date: new Date(currentDate.setDate(currentDate.getDate() + 30)), urgent: false },
        ]
      });
      
      setLoading(false);
    }, 1000);
  }, []);
  
  // Get appropriate icon for activity
  const getActivityIcon = (type) => {
    switch(type) {
      case 'document': return <FileIcon className="h-4 w-4 text-blue-500" />;
      case 'message': return <MessageSquareIcon className="h-4 w-4 text-green-500" />;
      case 'service': return <BriefcaseIcon className="h-4 w-4 text-amber-500" />;
      case 'deadline': return <ClockIcon className="h-4 w-4 text-red-500" />;
      default: return <CheckCircleIcon className="h-4 w-4 text-purple-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}. Here's an overview of your services and documents.
        </p>
      </div>
      
      {isGuestClient && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="text-amber-800 dark:text-amber-500 font-bold">Guest Access</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-500">
            You have temporary access to this portal. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Active Services"
              value={loading ? "..." : clientData.services.filter(s => s.status !== 'completed').length}
              icon={<BriefcaseIcon className="h-4 w-4 text-muted-foreground" />}
              description="In progress"
            />
            <StatsCard
              title="Documents"
              value={loading ? "..." : clientData.documents.length}
              icon={<FileIcon className="h-4 w-4 text-muted-foreground" />}
              description="Total uploaded"
            />
            <StatsCard
              title="Upcoming Deadlines"
              value={loading ? "..." : clientData.deadlines.length}
              icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
              description="Next 30 days"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <DashboardCard title="Recent Activity" loading={loading}>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center pb-2 border-b">
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : clientData.activities.length > 0 ? (
                  clientData.activities.map(activity => (
                    <div key={activity.id} className="flex justify-between items-start pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No recent activity to display
                  </p>
                )}
                
                {clientData.activities.length > 0 && (
                  <div className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Activity
                    </Button>
                  </div>
                )}
              </div>
            </DashboardCard>
            
            {/* Upcoming Deadlines */}
            <DashboardCard title="Upcoming Deadlines" loading={loading}>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center pb-2 border-b">
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : clientData.deadlines.length > 0 ? (
                  clientData.deadlines.map(deadline => (
                    <div key={deadline.id} className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0">
                      <div>
                        <p className={`text-sm font-medium ${deadline.urgent ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {deadline.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{deadline.description}</p>
                      </div>
                      <Badge variant={deadline.urgent ? "destructive" : "outline"}>
                        {format(new Date(deadline.date), 'MMM d')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No upcoming deadlines
                  </p>
                )}
              </div>
            </DashboardCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard 
              title="My Documents" 
              icon="fileText" 
              loading={loading} 
              className="md:col-span-1"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Access your important documents
                </p>
                <Link href="/dashboard/client/documents">
                  <Button className="w-full">View Documents</Button>
                </Link>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="My Services" 
              icon="briefcase" 
              loading={loading} 
              className="md:col-span-1"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  View your active services
                </p>
                <Link href="/dashboard/client/services">
                  <Button className="w-full">View Services</Button>
                </Link>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="Contact Office" 
              icon="message" 
              loading={loading} 
              className="md:col-span-1"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Message your consultant
                </p>
                <Link href="/dashboard/chat">
                  <Button className="w-full">Open Chat</Button>
                </Link>
              </div>
            </DashboardCard>
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <DashboardCard title="My Documents" loading={loading}>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded bg-muted animate-pulse"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded bg-muted animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : clientData.documents.length > 0 ? (
                clientData.documents.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md group hover:bg-muted/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">
                        <FileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No documents found
                </p>
              )}
              
              {!loading && (
                <div className="pt-2">
                  <Link href="/dashboard/client/documents">
                    <Button className="w-full">View All Documents</Button>
                  </Link>
                </div>
              )}
            </div>
          </DashboardCard>
        </TabsContent>
        
        <TabsContent value="services">
          <DashboardCard title="My Services" loading={loading}>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : clientData.services.length > 0 ? (
                clientData.services.map(service => (
                  <div key={service.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(service.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={
                      service.status === 'completed' ? 'outline' : 
                      service.status === 'in-progress' ? 'default' : 
                      'secondary'
                    }>
                      {service.status === 'in-progress' ? 'In Progress' : 
                       service.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No services found
                </p>
              )}
              
              {!loading && (
                <div className="pt-2">
                  <Link href="/dashboard/client/services">
                    <Button className="w-full">View All Services</Button>
                  </Link>
                </div>
              )}
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
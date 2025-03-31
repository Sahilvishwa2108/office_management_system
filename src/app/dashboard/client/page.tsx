"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, MessageSquareIcon, BriefcaseIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ClientDashboard() {
  const { data: session } = useSession();
  const isGuestClient = session?.user?.role === "GUEST_CLIENT";
  const currentDate = new Date();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Client Dashboard</h1>
      
      {isGuestClient && (
        <Alert className="mb-6 border-amber-500">
          <AlertTitle className="text-amber-500 font-bold">Guest Access</AlertTitle>
          <AlertDescription>
            You have temporary access to this portal. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              My Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Access your important documents and files</p>
            <Link href="/dashboard/client/documents">
              <Button className="w-full">View Documents</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View your active services and their status</p>
            <Link href="/dashboard/client/services">
              <Button className="w-full">View Services</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5" />
              Contact Office
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Message your assigned consultant</p>
            <Link href="/dashboard/chat">
              <Button className="w-full">Open Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Document Uploaded</p>
                  <p className="text-sm text-muted-foreground">Financial Statement.pdf</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(currentDate.setDate(currentDate.getDate() - 1)), 'PP')}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">New Message</p>
                  <p className="text-sm text-muted-foreground">From: John Consultant</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(currentDate.setDate(currentDate.getDate() - 3)), 'PP')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Service Updated</p>
                  <p className="text-sm text-muted-foreground">Tax Filing Service - In Progress</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(currentDate.setDate(currentDate.getDate() - 5)), 'PP')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Tax Filing Deadline</p>
                  <p className="text-sm text-muted-foreground">Submit required documents</p>
                </div>
                <span className="text-sm font-medium text-red-500">
                  {format(new Date(currentDate.setDate(currentDate.getDate() + 7)), 'PP')}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Quarterly Review</p>
                  <p className="text-sm text-muted-foreground">Virtual meeting with consultant</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(currentDate.setDate(currentDate.getDate() + 14)), 'PP')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Contract Renewal</p>
                  <p className="text-sm text-muted-foreground">Service agreement expires</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(currentDate.setDate(currentDate.getDate() + 30)), 'PP')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
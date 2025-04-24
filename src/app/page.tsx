"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ClipboardList,
  Users,
  MessageSquare,
  LayoutDashboard,
  Lock,
  CheckCircle,
  Building2,
  FileText,
  Bell,
  History,
  Key,
  Calendar,
  BarChart3,
  Smartphone,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Only show UI after theme is available to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-pink-500/10 blur-3xl"></div>
        <div className="absolute top-[40%] left-[5%] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[15%] w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      {/* Header/Navigation */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-xl">Office Pilot</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6">
              <a
                href="#features"
                className="text-muted-foreground transition-colors hover:text-indigo-500"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-muted-foreground transition-colors hover:text-indigo-500"
              >
                Benefits
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" asChild className="hover:border-indigo-500 hover:text-indigo-500 transition-all">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Revolutionize your workplace
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Office Pilot</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px]">
              Streamline your office operations with our comprehensive management solution. 
              Handle clients, tasks, team communication, and documentation in one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all" asChild>
                <Link href="/login">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-indigo-200 dark:border-indigo-800/40 hover:border-indigo-500 transition-all">
                Learn More
              </Button>
            </div>
          </div>
          <div className="flex-1 relative min-h-[300px] md:min-h-[400px] w-full">
            <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-lg overflow-hidden shadow-xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="absolute -right-20 -bottom-20 h-60 w-60 bg-purple-500/20 rounded-full filter blur-3xl"></div>
              <div className="absolute left-10 top-10 right-10 bottom-10">
                <div className="bg-card/80 backdrop-blur-sm border border-white/10 h-full w-full rounded-md shadow-sm overflow-hidden">
                  <div className="border-b px-4 py-3 flex items-center gap-2 bg-muted/50">
                    <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium text-sm">Dashboard Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4">
                    <div className="bg-background rounded-md border p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Active Tasks</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-full">
                          12
                        </span>
                      </div>
                    </div>
                    <div className="bg-background rounded-md border p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Clients</span>
                        <span className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 px-2 py-1 rounded-full">
                          24
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 bg-background rounded-md border p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium">Recent Activity</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          Task completed: Client onboarding
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                          New client added: Acme Inc.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-[800px] mx-auto mb-16">
            <div className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-4">
              <span>Powerful Tools</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Comprehensive Office Management
            </h2>
            <p className="text-muted-foreground text-lg">
              Office Pilot offers a complete suite of features designed to streamline
              your workflow and boost productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-indigo-200 dark:hover:border-indigo-800/40">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Task Management</h3>
              <p className="text-muted-foreground">
                Create, assign and track tasks with priority levels, due dates, and 
                status updates. Generate reports and monitor team productivity.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-purple-200 dark:hover:border-purple-800/40">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Client Management</h3>
              <p className="text-muted-foreground">
                Manage permanent and guest clients with contact details, notes, and 
                company information. Track client history and set access expiry for guests.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-pink-200 dark:hover:border-pink-800/40">
              <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Team Communication</h3>
              <p className="text-muted-foreground">
                Chat with team members in real-time, discuss tasks, and share files. 
                Keep all project communication in one centralized location.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-blue-200 dark:hover:border-blue-800/40">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Control system access with custom roles for admins, partners, executives, 
                and consultants. Ensure data security with permission-based views.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-amber-200 dark:hover:border-amber-800/40">
              <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Notification System</h3>
              <p className="text-muted-foreground">
                Stay informed with real-time notifications for task assignments, 
                updates, and important deadlines via in-app alerts and email.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-green-200 dark:hover:border-green-800/40">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Document Management</h3>
              <p className="text-muted-foreground">
                Upload, store, and share client documents securely. 
                Track document versions and manage access permissions.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-indigo-200 dark:hover:border-indigo-800/40">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Activity Tracking</h3>
              <p className="text-muted-foreground">
                Monitor all system activities with detailed logs. Track changes to 
                clients, tasks, and documents for complete accountability.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-purple-200 dark:hover:border-purple-800/40">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Credential Management</h3>
              <p className="text-muted-foreground">
                Store client credentials securely. Manage usernames and 
                passwords with encrypted storage and controlled access.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-all group hover:border-pink-200 dark:hover:border-pink-800/40">
              <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Mobile Responsive</h3>
              <p className="text-muted-foreground">
                Access your office management system from any device. Fully 
                responsive design works on desktops, tablets, and smartphones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-[800px] mx-auto mb-16">
            <div className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 mb-4">
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Benefits of Using Office Pilot
            </h2>
            <p className="text-muted-foreground text-lg">
              Discover how our platform can transform your business operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card/70 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Time Savings</h3>
                  <p className="text-muted-foreground">
                    Automate routine tasks and streamline workflows, reducing administrative overhead by up to 40%.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Enhanced Productivity</h3>
                  <p className="text-muted-foreground">
                    Increase team output with clear task allocation, priority management, and deadline tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Better Collaboration</h3>
                  <p className="text-muted-foreground">
                    Foster teamwork with real-time communication and shared access to project resources.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Data Security</h3>
                  <p className="text-muted-foreground">
                    Protect sensitive information with role-based access controls and encrypted credential storage.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Improved Planning</h3>
                  <p className="text-muted-foreground">
                    Plan effectively with visibility into team capacity, deadlines, and client priorities.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Client Satisfaction</h3>
                  <p className="text-muted-foreground">
                    Improve client experience with better communication, transparent tracking, and faster delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="max-w-[800px] mx-auto bg-card/80 backdrop-blur-sm rounded-xl border border-white/20 p-10 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Ready to Transform Your Office Management?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start streamlining your operations today with Office Pilot.
            </p>
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all"
              asChild
            >
              <Link href="/login">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t relative z-10">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            © {new Date().getFullYear()} Office Pilot. All rights reserved.
          </p>
          
          {/* Developer Credits */}
          <div className="mt-6 pt-6 border-t border-border/40">
            <p className="text-sm font-medium mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Designed & Developed by
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center">
                <p className="font-medium">Sahil Vishwakarma</p>
                <a 
                  href="mailto:sahilvishwa2108@gmail.com" 
                  className="text-sm text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  sahilvishwa2108@gmail.com
                </a>
              </div>
              <div className="flex flex-col items-center">
                <p className="font-medium">Priyesh Kurmi</p>
                <a 
                  href="mailto:kpriyesh1908@gmail.com" 
                  className="text-sm text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  kpriyesh1908@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
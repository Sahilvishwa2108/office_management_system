import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="w-full py-6 px-4 md:px-6 border-b">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
              <path d="M13 13h4" />
              <path d="M13 17h4" />
              <path d="M9 13h.01" />
              <path d="M9 17h.01" />
            </svg>
            <span className="font-bold text-xl">Office Pilot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/setup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Efficient Office Management System
                </h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Streamline your team&apos;s workflow with our comprehensive office management platform. 
                  Manage tasks, clients, and communications all in one place.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/login">
                  <Button className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/setup">
                  <Button variant="outline">System Setup</Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 rounded-xl overflow-hidden border shadow-xl">
              <Image 
                src="/images/dashboard-preview.png" 
                alt="Dashboard Preview" 
                width={800} 
                height={450} 
                className="rounded-md border shadow-md" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Role-Based Access</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Secure permission system for different user roles including 
                admins, partners, executives, consultants, and clients.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Task Management</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Assign, track, and collaborate on tasks with powerful 
                tools designed for team productivity.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Client Portal</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Provide clients with secure access to documents, services, 
                and direct communication with your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 px-4 md:px-6 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="text-sm text-gray-500">
            © 2025 Office Management System. All rights reserved.
          </div>
          <nav className="flex gap-4 text-sm">
            <Link className="text-gray-500 hover:underline underline-offset-4" href="#">
              Privacy Policy
            </Link>
            <Link className="text-gray-500 hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-gray-500 hover:underline underline-offset-4" href="#">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
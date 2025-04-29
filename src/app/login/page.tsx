"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Link from "next/link";
import { 
  AlertCircle, Loader2, UserCircle, Shield, Briefcase, 
  User, Building2, Lock, Mail, ThumbsUp, 
  Sparkles, ChevronRight, ChevronLeft, ChevronDown
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Read URL parameters using window.location
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        setBlocked(url.searchParams.get("blocked") === "true");
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        if (result.error === "AccountBlocked" || result.error.includes("blocked")) {
          setIsSubmitting(false);
          router.push("/login?blocked=true");
          return;
        }

        toast.error("Invalid email or password");
        setIsSubmitting(false);
        return;
      }

      // Get the session to determine role
      const response = await axios.get("/api/auth/session");
      const sessionData = response.data;

      toast.success("Logged in successfully");

      // Redirect based on user role
      if (sessionData?.user?.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (sessionData?.user?.role === "PARTNER") {
        router.push("/dashboard/partner");
      } else if (["PERMANENT_CLIENT", "GUEST_CLIENT"].includes(sessionData?.user?.role)) {
        router.push("/dashboard/client");
      } else if (["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"].includes(sessionData?.user?.role)) {
        router.push("/dashboard/junior");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch {
      toast.error("Failed to log in");
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
    // Optionally collapse the demo accounts section after selection
    setShowDemoAccounts(false);
  };
  
  if (!mounted) return null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden py-10 px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-pink-500/5 dark:bg-pink-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-[10%] w-72 h-72 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1 
          }}
        />
      </div>

      {/* Back button and theme toggle */}
      <div className="absolute top-4 left-4 z-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Main content - stacked vertically */}
      <div className="w-full max-w-md mx-auto z-10 mb-5">
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center mb-8"
          variants={itemVariants}
        >
          <Link href="/" className="flex flex-col items-center gap-2">
            <motion.div
              className="flex items-center justify-center p-2 rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              whileHover={{ 
                rotate: 5,
                scale: 1.05 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </motion.div>
            <span className="font-semibold text-xl">Office Pilot</span>
          </Link>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={cardVariants}>
          <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border shadow-md">
            <CardContent className="p-6 pt-6">
              <motion.div 
                className="mb-6 text-center"
                variants={itemVariants}
              >
                <motion.div 
                  className="inline-flex items-center justify-center rounded-full p-1.5 bg-indigo-100 dark:bg-indigo-900/30 mb-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">Enter your credentials to access your workspace</p>
              </motion.div>

              {blocked && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                      Your account has been blocked. Please contact an administrator for assistance.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="youremail@example.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Password</FormLabel>
                            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" type="password" placeholder="••••••••" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Logging in...
                        </>
                      ) : (
                        <>
                          Log In <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Notice about user creation rights */}
      <div className="w-full max-w-md mx-auto z-10 mb-5 mt-5">
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm">
          <div className="flex-shrink-0 p-1 rounded-full bg-blue-100 dark:bg-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 text-blue-700 dark:text-blue-300">
            <span className="font-medium">Note:</span> Only admins and partners can create accounts. Use demo accounts to explore or contact Office Admin.
          </div>
        </div>
      </div>

      {/* Collapsible Demo Accounts Section */}
      <motion.div 
        variants={cardVariants}
        className="w-full max-w-md mx-auto z-10"
      >
        <motion.button
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 backdrop-blur-sm border mb-1 hover:bg-muted/80 transition-colors"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-medium">Demo Accounts</span>
          </div>
          <motion.div
            animate={{ rotate: showDemoAccounts ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </motion.button>

        {/* Demo accounts without animations */}
        {showDemoAccounts && (
          <div className="rounded-lg border bg-card/60 backdrop-blur-sm shadow-sm mb-4">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: <Shield className="h-4 w-4 text-red-500" />,
                    title: "Admin",
                    email: "admin@office-pilot.com",
                    password: "Admin@123",
                    color: "red"
                  },
                  {
                    icon: <UserCircle className="h-4 w-4 text-blue-500" />,
                    title: "Partner",
                    email: "partner@office-pilot.com",
                    password: "Partner@123",
                    color: "blue"
                  },
                  {
                    icon: <Briefcase className="h-4 w-4 text-green-500" />,
                    title: "Executive",
                    email: "executive@office-pilot.com",
                    password: "Executive@123",
                    color: "green"
                  },
                  {
                    icon: <User className="h-4 w-4 text-amber-500" />,
                    title: "Consultant",
                    email: "consultant@office-pilot.com",
                    password: "Consultant@123",
                    color: "amber"
                  }
                ].map((account, i) => (
                  <div 
                    key={account.email}
                    className="relative rounded-md backdrop-blur-sm border bg-card/70 overflow-hidden group hover:-translate-y-1 transition-transform duration-200"
                  >
                    <button 
                      className="w-full text-left p-3"
                      onClick={() => fillDemoCredentials(account.email, account.password)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-shrink-0">
                          {account.icon}
                        </div>
                        <span className="font-medium text-sm">{account.title}</span>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <ThumbsUp className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                      <div className="ml-6 text-xs text-muted-foreground truncate">
                        {account.email}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 border-t bg-card/40">
              <p className="text-xs text-muted-foreground text-center">
                Click any account to auto-fill credentials
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Copyright text at bottom */}
      <motion.div
        variants={itemVariants}
        className="text-xs text-muted-foreground mt-4"
      >
        © {new Date().getFullYear()} Office Pilot
      </motion.div>
    </motion.div>
  );
}
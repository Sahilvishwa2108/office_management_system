"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
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
  Github,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// Utility function to get color-specific classes
const getColorClasses = (color) => {
  const classes = {
    indigo: {
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      text: "text-indigo-600 dark:text-indigo-400",
      hover: "hover:border-indigo-200 dark:hover:border-indigo-800/40",
      groupHoverText: "group-hover:text-indigo-600 group-hover:dark:text-indigo-400",
      gradient: "from-indigo-600 to-indigo-400",
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      hover: "hover:border-purple-200 dark:hover:border-purple-800/40",
      groupHoverText: "group-hover:text-purple-600 group-hover:dark:text-purple-400",
      gradient: "from-purple-600 to-purple-400",
    },
    pink: {
      bg: "bg-pink-100 dark:bg-pink-900/30",
      text: "text-pink-600 dark:text-pink-400",
      hover: "hover:border-pink-200 dark:hover:border-pink-800/40",
      groupHoverText: "group-hover:text-pink-600 group-hover:dark:text-pink-400",
      gradient: "from-pink-600 to-pink-400",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      hover: "hover:border-blue-200 dark:hover:border-blue-800/40",
      groupHoverText: "group-hover:text-blue-600 group-hover:dark:text-blue-400",
      gradient: "from-blue-600 to-blue-400",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
      hover: "hover:border-amber-200 dark:hover:border-amber-800/40",
      groupHoverText: "group-hover:text-amber-600 group-hover:dark:text-amber-400",
      gradient: "from-amber-600 to-amber-400",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      hover: "hover:border-green-200 dark:hover:border-green-800/40",
      groupHoverText: "group-hover:text-green-600 group-hover:dark:text-green-400",
      gradient: "from-green-600 to-green-400",
    },
  };
  return classes[color] || classes.indigo; // fallback to indigo
};

// Smooth scroll function
const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    window.scrollTo({
      behavior: "smooth",
      top: element.offsetTop - 80, // Adjust for header height
    });
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  // Refs for scroll animations
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Parallax scroll effects
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -200]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.5]);

  // Only show UI after theme is available to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };
  
  // Feature card variants - slide in from left, right and top alternating
  const featureVariants = {
    hidden: index => {
      // Alternating directions based on column position
      const directions = [
        { x: -50, y: 0 },    // left column
        { x: 0, y: -50 },    // middle column
        { x: 50, y: 0 }      // right column
      ];
      const position = index % 3;
      return {
        ...directions[position],
        opacity: 0,
        scale: 0.8,
      };
    },
    visible: {
      x: 0,
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
        duration: 0.5
      }
    }
  };

  // Benefit card variants - slide in from edges to center
  const benefitVariants = {
    hidden: index => {
      // Cards come from outside toward center
      const isLeft = index % 3 === 0;
      const isRight = index % 3 === 2;
      const isCenter = !isLeft && !isRight;
      
      if (isLeft) return { x: -100, opacity: 0 };
      if (isRight) return { x: 100, opacity: 0 };
      return { y: 50, opacity: 0 }; // center column comes from bottom
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated decorative elements - reduced for better performance */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-pink-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
          style={{ y: y1 }}
        ></motion.div>
        <motion.div 
          className="absolute top-[40%] left-[5%] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1 
          }}
          style={{ y: y2 }}
        ></motion.div>
      </div>

      {/* Header/Navigation */}
      <motion.header 
        className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-md"
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut", 
              }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-semibold text-xl">Office Pilot</span>
          </motion.div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6">
              <motion.button
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground transition-colors hover:text-indigo-500"
                whileHover={{ scale: 1.1, color: "#6366f1" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Features
              </motion.button>
              <motion.button
                onClick={() => scrollToSection("benefits")}
                className="text-muted-foreground transition-colors hover:text-indigo-500"
                whileHover={{ scale: 1.1, color: "#6366f1" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Benefits
              </motion.button>
              <motion.a
                href="https://github.com/sahilvishwa2108/office_management_system"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-indigo-500 flex items-center gap-1.5"
                whileHover={{ scale: 1.1, color: "#6366f1" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Github className="h-4 w-4" />
                GitHub
              </motion.a>
            </nav>
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 15 }}>
                <ThemeToggle />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" asChild className="hover:border-indigo-500 hover:text-indigo-500 transition-all">
                  <Link href="/login">Log In</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="flex-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-2"
            >
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Revolutionize your workplace
              </span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Welcome to <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Office Pilot</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground max-w-[600px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Streamline your office operations with our comprehensive management solution. 
              Handle clients, tasks, team communication, and documentation in one secure platform.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all group" asChild>
                  <Link href="/login">
                    Get Started 
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-indigo-200 dark:border-indigo-800/40 hover:border-indigo-500 transition-all">
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Scroll down indicator */}
            <motion.div 
              className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs">Scroll Down</span>
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
          <motion.div 
            className="flex-1 relative min-h-[300px] md:min-h-[400px] w-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ opacity }}
          >
            <motion.div 
              className="absolute top-0 right-0 h-full w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-lg overflow-hidden shadow-xl border border-indigo-100 dark:border-indigo-900/50"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div 
                className="absolute -right-20 -bottom-20 h-60 w-60 bg-purple-500/20 rounded-full filter blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              ></motion.div>
              <div className="absolute left-10 top-10 right-10 bottom-10">
                <motion.div 
                  className="bg-card/80 backdrop-blur-sm border border-white/10 h-full w-full rounded-md shadow-sm overflow-hidden"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <div className="border-b px-4 py-3 flex items-center gap-2 bg-muted/50">
                    <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium text-sm">Dashboard Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4">
                    <motion.div 
                      className="bg-background rounded-md border p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Active Tasks</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-full">
                          12
                        </span>
                      </div>
                    </motion.div>
                    <motion.div 
                      className="bg-background rounded-md border p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Clients</span>
                        <span className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 px-2 py-1 rounded-full">
                          24
                        </span>
                      </div>
                    </motion.div>
                    <motion.div 
                      className="col-span-2 bg-background rounded-md border p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium">Recent Activity</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <motion.div 
                            className="h-1.5 w-1.5 rounded-full bg-green-500"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                          ></motion.div>
                          Task completed: Client onboarding
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <motion.div 
                            className="h-1.5 w-1.5 rounded-full bg-blue-500"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "loop" }}
                          ></motion.div>
                          New client added: Acme Inc.
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Optimized Animations */}
      <section id="features" className="py-20 relative z-10" ref={featuresRef}>
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center max-w-[800px] mx-auto mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-4">
              <span>Powerful Tools</span>
            </div>
            {/* Text reveal animation */}
            <div className="overflow-hidden">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Comprehensive Office Management
              </motion.h2>
            </div>
            <div className="overflow-hidden">
              <motion.p 
                className="text-muted-foreground text-lg"
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                Office Pilot offers a complete suite of features designed to streamline
                your workflow and boost productivity.
              </motion.p>
            </div>
          </motion.div>

          {/* Feature cards with improved animations */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
          >
            {[
              {
                icon: <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
                title: "Task Management",
                description: "Create, assign and track tasks with priority levels, due dates, and status updates. Generate reports and monitor team productivity.",
                color: "indigo"
              },
              {
                icon: <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
                title: "Client Management",
                description: "Manage permanent and guest clients with contact details, notes, and company information. Track client history and set access expiry for guests.",
                color: "purple"
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
                title: "Team Communication",
                description: "Chat with team members in real-time, discuss tasks, and share files. Keep all project communication in one centralized location.",
                color: "pink"
              },
              {
                icon: <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
                title: "Role-Based Access",
                description: "Control system access with custom roles for admins, partners, executives, and consultants. Ensure data security with permission-based views.",
                color: "blue"
              },
              {
                icon: <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
                title: "Notification System",
                description: "Stay informed with real-time notifications for task assignments, updates, and important deadlines via in-app alerts and email.",
                color: "amber"
              },
              {
                icon: <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />,
                title: "Document Management",
                description: "Upload, store, and share client documents securely. Track document versions and manage access permissions.",
                color: "green"
              },
              {
                icon: <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
                title: "Activity Tracking",
                description: "Monitor all system activities with detailed logs. Track changes to clients, tasks, and documents for complete accountability.",
                color: "indigo"
              },
              {
                icon: <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
                title: "Credential Management",
                description: "Store client credentials securely. Manage usernames and passwords with encrypted storage and controlled access.",
                color: "purple"
              },
              {
                icon: <Smartphone className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
                title: "Mobile Responsive",
                description: "Access your office management system from any device. Fully responsive design works on desktops, tablets, and smartphones.",
                color: "pink"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                custom={index}
                variants={featureVariants}
                className={`bg-card rounded-lg border p-6 transition-all group hover:border-${feature.color}-200 dark:hover:border-${feature.color}-800/40 hover:shadow-lg`}
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className={`h-12 w-12 rounded-lg ${getColorClasses(feature.color).bg} flex items-center justify-center mb-6`}>
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {feature.icon}
                  </motion.div>
                </div>
                
                <h3 className={`text-xl font-semibold mb-2 transition-colors ${getColorClasses(feature.color).groupHoverText}`}>
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section with Simplified Animations */}
      <section id="benefits" className="py-20 relative z-10" ref={benefitsRef}>
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="text-center max-w-[800px] mx-auto mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 mb-4">
              <span>Why Choose Us</span>
            </div>
            
            {/* Text reveal animation */}
            <div className="overflow-hidden">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Benefits of Using Office Pilot
              </motion.h2>
            </div>
            <div className="overflow-hidden">
              <motion.p 
                className="text-muted-foreground text-lg"
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                Discover how our platform can transform your business operations
              </motion.p>
            </div>
          </motion.div>

          {/* Benefits cards with edge-to-center animations */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
          >
            {[
              {
                icon: <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
                title: "Time Savings",
                description: "Automate routine tasks and streamline workflows, reducing administrative overhead by up to 40%.",
                color: "indigo"
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
                title: "Enhanced Productivity",
                description: "Increase team output with clear task allocation, priority management, and deadline tracking.",
                color: "purple"
              },
              {
                icon: <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />,
                title: "Better Collaboration",
                description: "Foster teamwork with real-time communication and shared access to project resources.",
                color: "pink"
              },
              {
                icon: <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
                title: "Data Security",
                description: "Protect sensitive information with role-based access controls and encrypted credential storage.",
                color: "blue"
              },
              {
                icon: <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
                title: "Improved Planning",
                description: "Plan effectively with visibility into team capacity, deadlines, and client priorities.",
                color: "amber"
              },
              {
                icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
                title: "Seamless Integration",
                description: "Integrate with popular tools and platforms for a unified experience. Sync data and streamline processes across your organization.",
                color: "green"
              }
            ].map((benefit, index) => (
              <motion.div 
                key={index}
                custom={index}
                variants={benefitVariants}
                className={`bg-card/80 backdrop-blur-sm rounded-lg border border-${benefit.color}-100/10 dark:border-${benefit.color}-900/10 p-6 shadow-sm hover:shadow-lg transition-all`}
                whileHover={{ 
                  y: -8,
                  x: 0,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-full ${getColorClasses(benefit.color).bg} flex items-center justify-center flex-shrink-0`}>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {benefit.icon}
                    </motion.div>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${getColorClasses(benefit.color).text}`}>
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
                
                {/* Subtle accent line */}
                <div className={`h-0.5 w-1/4 mt-4 bg-gradient-to-r ${getColorClasses(benefit.color).gradient} rounded opacity-60`}></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section with Optimized animations */}
      <section className="py-20 relative z-10" ref={ctaRef}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div 
            className="max-w-[800px] mx-auto bg-card/80 backdrop-blur-sm rounded-xl border border-white/20 p-10 shadow-xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: {
                duration: 0.8,
                type: "spring",
                stiffness: 200,
                damping: 20
              }
            }}
            whileHover={{ 
              boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.3)"
            }}
          >
            {/* Reduced number of particles for better performance */}
            {!isMobile && Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-indigo-500/30 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
            
            {/* Simplified background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
            
            {/* Text with simplified animation */}
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Ready to Transform Your Office Management?
            </motion.h2>
            
            <motion.p 
              className="text-xl text-muted-foreground mb-8 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Start streamlining your operations today with Office Pilot.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="relative z-10"
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all relative overflow-hidden group"
                  asChild
                >
                  <Link href="/login">
                    <motion.span 
                      className="absolute inset-0 rounded-md"
                      initial={{ opacity: 0 }}
                      whileHover={{ 
                        opacity: 1, 
                        boxShadow: "0 0 20px 5px rgba(99, 102, 241, 0.5)"
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10">Get Started</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                    
                    {/* Improved button shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-white opacity-0"
                      animate={{
                        left: ["-100%", "200%"],
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 5
                      }}
                      style={{
                        width: "30%",
                        transform: "skewX(-20deg)"
                      }}
                    />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t relative z-10">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <motion.div 
            className="flex justify-center items-center mb-4"
            whileHover={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </motion.div>
          <p className="text-muted-foreground text-sm mb-4">
            © {new Date().getFullYear()} Office Pilot. All rights reserved.
          </p>
          
          {/* Developer Credits */}
          <div className="mt-6 pt-6 border-t border-border/40">
            <motion.p 
              className="text-sm font-medium mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            >
              Designed & Developed by
            </motion.p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <motion.div 
                className="flex flex-col items-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <p className="font-medium">Sahil Vishwakarma</p>
                <a 
                  href="mailto:sahilvishwa2108@gmail.com" 
                  className="text-sm text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  sahilvishwa2108@gmail.com
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
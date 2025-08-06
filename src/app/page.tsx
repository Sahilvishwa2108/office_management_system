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
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// Smooth scroll function
const scrollToSection = (id: string) => {
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
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  // Refs for scroll animations
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const ctaRef = useRef(null);
  const heroRef = useRef(null);
  
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

  // Handle header visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollPos]);

  // Handle hero background fade
  useEffect(() => {
    const handleScrollFade = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fadeThreshold = viewportHeight * 0.3;

      if (scrollPosition > fadeThreshold) {
        setHeroVisible(false);
      } else {
        setHeroVisible(true);
      }
    };

    handleScrollFade();
    window.addEventListener("scroll", handleScrollFade);
    return () => {
      window.removeEventListener("scroll", handleScrollFade);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated decorative elements */}
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

        {/* Grid paper background */}
        <div
          className={`fixed inset-0 transition-opacity duration-1000 ${
            heroVisible ? "opacity-30" : "opacity-0"
          }`}
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(156, 163, 175, 0.3) 25%, rgba(156, 163, 175, 0.3) 26%, transparent 27%, transparent 74%, rgba(156, 163, 175, 0.3) 75%, rgba(156, 163, 175, 0.3) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(156, 163, 175, 0.3) 25%, rgba(156, 163, 175, 0.3) 26%, transparent 27%, transparent 74%, rgba(156, 163, 175, 0.3) 75%, rgba(156, 163, 175, 0.3) 76%, transparent 77%, transparent)
            `,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      {/* Header/Navigation - Floating Design */}
      <motion.header 
        className={`fixed w-full z-[100] transition-all duration-300 ${
          visible ? "top-4" : "-top-28"
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-background/90 backdrop-blur-md rounded-full shadow-lg border border-border/50 px-6 py-3 flex h-16 items-center justify-between">
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
            
            <nav className="hidden md:flex gap-8">
              <motion.button
                onClick={() => scrollToSection("features")}
                className="nav-link text-muted-foreground transition-colors hover:text-indigo-500"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Features
              </motion.button>
              <motion.button
                onClick={() => scrollToSection("benefits")}
                className="nav-link text-muted-foreground transition-colors hover:text-indigo-500"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Benefits
              </motion.button>
              <motion.a
                href="https://github.com/sahilvishwa2108/office_management_system"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link text-muted-foreground transition-colors hover:text-indigo-500 flex items-center gap-1.5"
                whileHover={{ scale: 1.1 }}
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
                <Button 
                  variant="outline" 
                  asChild 
                  className="fancy-btn hover:border-indigo-500 hover:text-indigo-500 transition-all"
                >
                  <Link href="/login">Log In</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .nav-link {
            position: relative;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
          }

          .nav-link:after {
            content: "";
            position: absolute;
            bottom: -4px;
            left: 50%;
            width: 0%;
            height: 2px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            transform: translateX(-50%);
          }

          .nav-link:hover:after {
            width: 100%;
          }

          .fancy-btn {
            background: linear-gradient(45deg, transparent, transparent);
            border: 2px solid;
            border-image: linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899) 1;
            transition: all 0.3s ease;
          }

          .fancy-btn:hover {
            background: linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899);
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
        `}</style>
      </motion.header>

      {/* Hero Section - Enhanced with Better Animations */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Floating geometric elements */}
        <div className="absolute top-[20%] right-[10%] w-64 h-64 rounded-full bg-blue-200/20 opacity-60 animate-float"></div>
        <div className="absolute bottom-[15%] left-[5%] w-48 h-48 rounded-full bg-purple-200/20 opacity-60 animate-float-delay"></div>
        <div className="absolute top-[60%] right-[20%] w-32 h-32 rounded-lg bg-pink-200/20 opacity-40 rotate-45 animate-float"></div>
        <div className="absolute top-[10%] left-[15%] w-24 h-24 rounded-lg bg-indigo-200/20 opacity-40 -rotate-12 animate-float-delay"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="w-full max-w-5xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300 mb-6"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Transform Your Workplace Today
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Run Your Business
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Like a Pro!!
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              From managing teams to tracking tasks and clients, Office Pilot keeps everything—and everyone—in perfect sync.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="hero-cta-btn bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all text-lg px-8 py-4 h-auto group" 
                  asChild
                >
                  <Link href="/login">
                    <span className="relative z-10">Get Started Free</span>
                    <motion.span
                      className="relative z-10 ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.span>
                    
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-white opacity-0 group-hover:animate-shine"
                      initial={{ left: "-100%" }}
                      animate={{
                        left: ["-100%", "200%"],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                      style={{
                        width: "30%",
                        transform: "skewX(-20deg)"
                      }}
                    />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="secondary-btn border-2 border-indigo-200 dark:border-indigo-800/40 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all text-lg px-8 py-4 h-auto"
                  onClick={() => scrollToSection("mission")}
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm font-medium">Discover More</span>
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }

          @keyframes float-delay {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(-5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }

          @keyframes shine {
            0% { left: -100%; opacity: 0; }
            50% { opacity: 0.3; }
            100% { left: 200%; opacity: 0; }
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }

          .animate-float-delay {
            animation: float-delay 7s ease-in-out infinite;
            animation-delay: 1s;
          }

          .hero-cta-btn {
            position: relative;
            overflow: hidden;
          }

          .animate-shine {
            animation: shine 2s ease-out;
          }

          .secondary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
          }
        `}</style>
      </section>

      {/* Mission Section */}
      <section id="mission" className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/20 dark:to-background">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="absolute inset-0">
            <pattern
              id="wave-pattern"
              width="100"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0,10 C30,0 70,0 100,10 C130,20 170,20 200,10"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>
        </div>

        {/* Floating elements */}
        <div className="absolute top-[30%] left-[20%] w-32 h-32 rounded-lg bg-blue-200/20 opacity-60 rotate-12 animate-float"></div>
        <div className="absolute bottom-[20%] right-[15%] w-20 h-20 rounded-lg bg-blue-300/20 opacity-60 -rotate-12 animate-float-delay"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="w-full max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.3 }}
          >
            <motion.div 
              className="mb-10 transform transition-transform duration-500 hover:scale-105"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Building2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.h3 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: false }}
            >
              Our Mission
            </motion.h3>
            
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: false }}
            >
              At Office Pilot, we help business owners easily manage their teams, tasks, and clients—all in one place.
              <br />
              <br />
              <span className="font-semibold text-foreground">
                With simple tools for communication, task tracking, and client management, we make running your business smoother and more efficient.
              </span>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Sticky Scrolling */}
      <div id="features" className="relative">
        {/* Feature Section: User & Role Management */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-gradient-to-tr from-blue-50/80 to-blue-100/80 dark:from-blue-950/20 dark:to-blue-900/20 rounded-tl-[4rem] rounded-tr-[4rem]">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234F46E5' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
                backgroundSize: "24px 24px",
              }}
            ></div>
          </div>

          {/* Abstract user silhouettes */}
          <div className="absolute top-[10%] right-[5%] opacity-10">
            <Users className="h-32 w-32 text-indigo-500" />
          </div>
          <div className="absolute bottom-[15%] left-[10%] opacity-10">
            <Users className="h-24 w-24 text-indigo-500" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              className="flex flex-col md:flex-row items-stretch max-w-7xl mx-auto gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              {/* Left side - User Management Screenshots */}
              <motion.div 
                className="w-full md:w-3/5 mb-6 md:mb-0"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: false }}
              >
                <div className="space-y-4">
                  {/* Main User Management Dashboard */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-indigo-200/50 dark:border-indigo-800/50">
                    <img 
                      src="/images/user-list-page.png" 
                      alt="User Management Dashboard - Table View" 
                      className="w-full h-[200px] object-cover object-top"
                    />
                  </div>
                  
                  {/* Cards View */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-indigo-200/50 dark:border-indigo-800/50">
                    <img 
                      src="/images/user-list-cards-view-page.png" 
                      alt="User Management Dashboard - Cards View" 
                      className="w-full h-[180px] object-cover object-top"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Right side - Content */}
              <motion.div 
                className="w-full md:w-2/5 md:pl-10 flex flex-col justify-center"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: false }}
              >
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                  User & Role Management
                </h3>
                <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-3 md:mb-4">
                  Put the Right People in the Right Seats
                </h4>
                <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                  No more access chaos. Create and manage users with laser-precise Role-Based Access Control.
                </p>
                
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {[
                    { role: "Admins", desc: "Full control of your business backend" },
                    { role: "Partners", desc: "High-level collaborators" },
                    { role: "Business Executives", desc: "Manage, assign, monitor" },
                    { role: "Consultants", desc: "Strategic advisors with curated access" }
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-start transform transition duration-300 hover:translate-x-2 text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      viewport={{ once: false }}
                    >
                      <span className="font-medium mr-2 text-blue-500">•</span>
                      <span>
                        <span className="font-semibold">{item.role}</span> – {item.desc}
                      </span>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.p 
                  className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-200"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  viewport={{ once: false }}
                >
                  You decide who sees what—nothing more, nothing less.
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Feature Section: Task Management */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50/80 to-white dark:from-green-950/20 dark:to-background rounded-tl-[4rem] rounded-tr-[4rem]">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              className="flex flex-col md:flex-row-reverse items-stretch max-w-7xl mx-auto gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              {/* Right side - Task Management Screenshots */}
              <motion.div 
                className="w-full md:w-3/5 mb-6 md:mb-0"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: false }}
              >
                <div className="space-y-4">
                  {/* Task List Dashboard */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-green-200/50 dark:border-green-800/50">
                    <img 
                      src="/images/task-list-page.png" 
                      alt="Task Management Dashboard - List View" 
                      className="w-full h-[200px] object-cover object-top"
                    />
                  </div>
                  
                  {/* Task Details View */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-green-200/50 dark:border-green-800/50">
                    <img 
                      src="/images/task-details-page.png" 
                      alt="Task Details and Discussion" 
                      className="w-full h-[180px] object-cover object-top"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Left side - Content */}
              <motion.div 
                className="w-full md:w-2/5 md:pr-10 flex flex-col justify-center"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: false }}
              >
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                  Task Management
                </h3>
                <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-green-600 dark:text-green-400 mb-3 md:mb-4">
                  Make Work Flow Like Clockwork
                </h4>
                <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                  Stop wasting time in endless status meetings. With Office Pilot, seniors can assign tasks directly to their juniors, track progress, and hit deadlines without chasing.
                </p>
                
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {[
                    "Assign & track tasks with real-time updates",
                    "Set priorities and deadlines effortlessly", 
                    "Monitor team productivity from your dashboard",
                    "Automated notifications and reminders"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-start transform transition duration-300 hover:translate-x-2 text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      viewport={{ once: false }}
                    >
                      <span className="font-medium mr-2 text-green-500">•</span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.p 
                  className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-200"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  viewport={{ once: false }}
                >
                  Your team's day just got 10x more productive.
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Feature Section: Communication */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-50/80 to-white dark:from-yellow-950/20 dark:to-background rounded-tl-[4rem] rounded-tr-[4rem]">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              className="flex flex-col md:flex-row items-stretch max-w-7xl mx-auto gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              {/* Left side - Communication Screenshots */}
              <motion.div 
                className="w-full md:w-3/5 mb-6 md:mb-0"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: false }}
              >
                <div className="space-y-4">
                  {/* Chat/Communication Interface */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-yellow-200/50 dark:border-yellow-800/50">
                    <img 
                      src="/images/chatroom-page.png" 
                      alt="Team Communication - Chat Interface" 
                      className="w-full h-[250px] object-cover object-top"
                    />
                  </div>
                  
                  {/* Activity Feeds */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-yellow-200/50 dark:border-yellow-800/50">
                    <img 
                      src="/images/activity-feeds.png" 
                      alt="Activity Feeds and Notifications" 
                      className="w-full h-[130px] object-cover object-top"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Right side - Content */}
              <motion.div 
                className="w-full md:w-2/5 md:pl-10 flex flex-col justify-center"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: false }}
              >
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                  Team Communication
                </h3>
                <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mb-3 md:mb-4">
                  One Team. One Thread.
                </h4>
                <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                  Bring your whole team together. Discuss tasks, brainstorm ideas, or make quick decisions in real-time with our built-in group chat.
                </p>
                
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {[
                    "Fast internal communication",
                    "Task-specific discussions",
                    "File sharing and collaboration",
                    "Available on all devices"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-start transform transition duration-300 hover:translate-x-2 text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      viewport={{ once: false }}
                    >
                      <span className="font-medium mr-2 text-yellow-500">•</span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.p 
                  className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-200"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  viewport={{ once: false }}
                >
                  Communication has never been this seamless.
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Dashboard Showcase Section */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-950/20 dark:to-background rounded-tl-[4rem] rounded-tr-[4rem]">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              className="text-center max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                Role-Based Dashboards
              </h3>
              <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-slate-600 dark:text-slate-400 mb-3 md:mb-4">
                Tailored Experience for Every Team Member
              </h4>
              <p className="text-base md:text-lg text-muted-foreground mb-6">
                Each role gets a personalized dashboard with the tools and information they need to excel.
              </p>
            </motion.div>

            {/* Dashboard Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: false, amount: 0.1 }}
            >
              {/* Admin Dashboard */}
              <motion.div 
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden border-2 border-red-200/50 dark:border-red-800/50 group"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: false }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="p-4 bg-red-50 dark:bg-red-950/30">
                  <h5 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </h5>
                  <p className="text-sm text-red-500 dark:text-red-300">Complete system control</p>
                </div>
                <img 
                  src="/images/admin-dashboard.png" 
                  alt="Admin Dashboard - Full Control Interface" 
                  className="w-full h-[180px] object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </motion.div>

              {/* Partner Dashboard */}
              <motion.div 
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden border-2 border-purple-200/50 dark:border-purple-800/50 group"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: false }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30">
                  <h5 className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Partner Dashboard
                  </h5>
                  <p className="text-sm text-purple-500 dark:text-purple-300">Team management focused</p>
                </div>
                <img 
                  src="/images/partner-dashboard.png" 
                  alt="Partner Dashboard - Team Management Interface" 
                  className="w-full h-[180px] object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </motion.div>

              {/* Junior Dashboard */}
              <motion.div 
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden border-2 border-blue-200/50 dark:border-blue-800/50 group"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: false }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30">
                  <h5 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Junior Dashboard
                  </h5>
                  <p className="text-sm text-blue-500 dark:text-blue-300">Task-focused interface</p>
                </div>
                <img 
                  src="/images/junior-dashboard.png" 
                  alt="Junior Dashboard - Task Management Interface" 
                  className="w-full h-[180px] object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            </motion.div>

            {/* Client Management Section */}
            <motion.div 
              className="mt-12 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: false }}
            >
              <div className="text-center mb-8">
                <h4 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Client Management Suite
                </h4>
                <p className="text-muted-foreground">
                  Comprehensive client relationship management tools
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client List */}
                <motion.div 
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden border-2 border-green-200/50 dark:border-green-800/50 group"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="p-4 bg-green-50 dark:bg-green-950/30">
                    <h5 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Client Directory
                    </h5>
                  </div>
                  <img 
                    src="/images/client-list-page.png" 
                    alt="Client Management - Directory View" 
                    className="w-full h-[160px] object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </motion.div>

                {/* Client Details */}
                <motion.div 
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden border-2 border-green-200/50 dark:border-green-800/50 group"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="p-4 bg-green-50 dark:bg-green-950/30">
                    <h5 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Client Profiles
                    </h5>
                  </div>
                  <img 
                    src="/images/client-details-page.png" 
                    alt="Client Management - Detailed Profiles" 
                    className="w-full h-[160px] object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Analytics & Reporting Section */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50/80 to-white dark:from-orange-950/20 dark:to-background rounded-tl-[4rem] rounded-tr-[4rem]">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              className="flex flex-col md:flex-row items-stretch max-w-7xl mx-auto gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              {/* Left side - Content */}
              <motion.div 
                className="w-full md:w-2/5 md:pr-10 flex flex-col justify-center"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: false }}
              >
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                  Analytics & Insights
                </h3>
                <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-3 md:mb-4">
                  Data-Driven Decision Making
                </h4>
                <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                  Get comprehensive insights into your team's performance, task progress, and business metrics with powerful analytics tools.
                </p>
                
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {[
                    "Task completion analytics and trends",
                    "Team productivity metrics", 
                    "Client engagement tracking",
                    "Custom reports and dashboards"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-start transform transition duration-300 hover:translate-x-2 text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      viewport={{ once: false }}
                    >
                      <span className="font-medium mr-2 text-orange-500">•</span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.p 
                  className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-200"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  viewport={{ once: false }}
                >
                  Turn your data into actionable insights.
                </motion.p>
              </motion.div>

              {/* Right side - Analytics Screenshot */}
              <motion.div 
                className="w-full md:w-3/5 mb-6 md:mb-0"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: false }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition duration-500 hover:scale-105 overflow-hidden border-2 border-orange-200/50 dark:border-orange-800/50">
                  <img 
                    src="/images/Task-analytics-page.png" 
                    alt="Task Analytics Dashboard - Performance Insights" 
                    className="w-full h-[400px] object-cover object-top"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 relative z-10 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-950/20 dark:to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center max-w-[800px] mx-auto mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: false, amount: 0.3 }}
          >
            <div className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-4">
              <span>Why Choose Us</span>
            </div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: false }}
            >
              Benefits of Using Office Pilot
            </motion.h2>
            
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: false }}
            >
              Discover how our platform can transform your business operations
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
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
                icon: <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />,
                title: "Improved Planning",
                description: "Plan effectively with visibility into team capacity, deadlines, and client priorities.",
                color: "green"
              },
              {
                icon: <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
                title: "Seamless Integration",
                description: "Integrate with popular tools and platforms for a unified experience.",
                color: "orange"
              }
            ].map((benefit, index) => (
              <motion.div 
                key={index}
                className="bg-card/80 backdrop-blur-sm rounded-lg border p-6 shadow-sm hover:shadow-lg transition-all group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: false }}
                whileHover={{ y: -8 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-full bg-${benefit.color}-100 dark:bg-${benefit.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {benefit.icon}
                    </motion.div>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 text-${benefit.color}-600 dark:text-${benefit.color}-400`}>
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section with Star Button */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-black to-blue-800 text-white">
        {/* Radial highlight */}
        <div
          className="absolute inset-0 bg-no-repeat bg-center"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
          }}
        ></div>

        {/* Floating star elements */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-${[16, 20, 24, 16, 12, 20][i]} h-${[16, 20, 24, 16, 12, 20][i]} opacity-15 animate-float${i % 2 === 0 ? '' : '-delay'}`}
            style={{
              top: `${[15, 25, 25, 15, 10, 20][i]}%`,
              left: `${[10, 15, 20, 85, 80, 90][i]}%`,
              right: i > 2 ? `${[15, 10, 10][i - 3]}%` : 'auto',
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Star className="h-full w-full text-white fill-current" />
          </motion.div>
        ))}

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-6 md:mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
          >
            Ready to Take Control of Your Business?
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-2xl mb-8 md:mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: false }}
          >
            Start your journey with Office Pilot today. Get a free walkthrough and see how effortless business management can be.
          </motion.p>

          {/* Star Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: false }}
          >
            <Link href="/login">
              <button className="star-button relative">
                Create Your Free Account
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`star-${i + 1}`}>
                    <Star className="h-full w-full fill-current" />
                  </div>
                ))}
              </button>
            </Link>
          </motion.div>
        </div>

        <style jsx>{`
          .star-button {
            position: relative;
            padding: 12px 35px;
            background: #000000;
            font-size: 18px;
            font-weight: 500;
            color: #fff;
            border: 3px solid #fec195;
            border-radius: 8px;
            box-shadow: 0 0 0 #fec1958c;
            transition: all 0.3s ease-in-out;
            cursor: pointer;
          }

          .star-1, .star-2, .star-3, .star-4, .star-5, .star-6 {
            position: absolute;
            filter: drop-shadow(0 0 0 #fffdef);
            z-index: -5;
            transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
          }

          .star-1 {
            top: 20%;
            left: 20%;
            width: 25px;
            height: 25px;
          }

          .star-2 {
            top: 45%;
            left: 45%;
            width: 15px;
            height: 15px;
          }

          .star-3 {
            top: 40%;
            left: 40%;
            width: 5px;
            height: 5px;
          }

          .star-4 {
            top: 20%;
            left: 40%;
            width: 8px;
            height: 8px;
          }

          .star-5 {
            top: 25%;
            left: 45%;
            width: 15px;
            height: 15px;
          }

          .star-6 {
            top: 5%;
            left: 50%;
            width: 5px;
            height: 5px;
          }

          .star-button:hover {
            background: transparent;
            color: #fec195;
            box-shadow: 0 0 25px #fec1958c;
          }

          .star-button:hover .star-1 {
            top: -80%;
            left: -30%;
            filter: drop-shadow(0 0 10px #fffdef);
            z-index: 2;
          }

          .star-button:hover .star-2 {
            top: -25%;
            left: 10%;
            filter: drop-shadow(0 0 10px #fffdef);
            z-index: 2;
          }

          .star-button:hover .star-3 {
            top: 55%;
            left: 25%;
            filter: drop-shadow(0 0 10px #fffdef);
            z-index: 2;
          }

          .star-button:hover .star-4 {
            top: 30%;
            left: 80%;
            filter: drop-shadow(0 0 10px #fffdef);
            z-index: 2;
          }

          .star-button:hover .star-5 {
            top: 25%;
            left: 115%;
            filter: drop-shadow(0 0 10px #fffdef);
            z-index: 2;
          }

          .star-button:hover .star-6 {
            top: 5%;
            left: 60%;
            filter: drop-shadow(0 0 10px #fffdef);
            z-index: 2;
          }
        `}</style>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="mb-8">
            <motion.div 
              className="flex justify-center items-center mb-4"
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Office Pilot
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Streamline your business operations and boost productivity with Office Pilot. 
              The all-in-one solution for modern teams.
            </p>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400">
                © {new Date().getFullYear()} Office Pilot. All rights reserved.
              </p>
              <motion.div 
                className="flex flex-col items-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <p className="text-gray-400 flex items-center">
                  Designed & Developed with 
                  <span className="text-red-500 mx-1 animate-pulse">♥</span>
                  by 
                  <span className="text-indigo-400 ml-1 font-semibold">Sahil Vishwakarma</span>
                </p>
                <a 
                  href="mailto:sahilvishwa2108@gmail.com" 
                  className="text-sm text-gray-500 hover:text-indigo-400 transition-colors"
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

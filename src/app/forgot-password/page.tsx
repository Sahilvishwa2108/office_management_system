"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { 
  Loader2, Building2, Mail, ArrowLeft, 
  KeyRound, CheckCircle2, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/auth/forgot-password", {
        email: data.email,
      });
      
      setEmailSent(true);
      toast.success("If your email exists in our system, you'll receive password reset instructions");
    } finally {
      setIsSubmitting(false);
    }
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
          className="absolute top-40 right-[20%] w-64 h-64 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute bottom-40 left-[20%] w-72 h-72 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl"
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
          <Link href="/login">
            <Button variant="outline" size="icon" className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
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

        <motion.div variants={cardVariants}>
          <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border shadow-md">
            <CardContent className="p-6 md:p-8">
              {emailSent ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <motion.div 
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20 
                    }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  
                  <motion.h1 
                    className="text-2xl font-bold mb-3"
                    variants={itemVariants}
                  >
                    Check Your Email
                  </motion.h1>
                  
                  <motion.p 
                    className="text-muted-foreground mb-6"
                    variants={itemVariants}
                  >
                    We've sent password reset instructions to your email if it exists in our system.
                  </motion.p>
                  
                  <motion.div
                    className="p-4 rounded-lg bg-muted/50 border mb-6 text-sm text-left"
                    variants={itemVariants}
                  >
                    <p className="mb-2 font-medium">Important:</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Check your inbox and spam folder</li>
                      <li>The reset link is valid for 24 hours</li>
                      <li>For security, only click links from emails you requested</li>
                    </ul>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Button 
                      className="gap-2"
                      variant="outline" 
                      onClick={() => router.push("/login")}
                    >
                      <ArrowLeft className="h-4 w-4" /> Return to Login
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div>
                  <motion.div 
                    className="mb-6 text-center"
                    variants={itemVariants}
                  >
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 20 
                      }}
                    >
                      <KeyRound className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </motion.div>
                    
                    <h1 className="text-2xl font-bold mb-3">Reset Password</h1>
                    <p className="text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password
                    </p>
                  </motion.div>

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

                      <motion.div 
                        className="flex flex-col sm:flex-row gap-3 pt-2"
                        variants={itemVariants}
                      >
                        <Button
                          type="submit"
                          className="flex-1 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Form>
                  
                  <motion.div 
                    className="mt-8 pt-5 border-t text-center text-sm text-muted-foreground"
                    variants={itemVariants}
                  >
                    Remembered your password? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                  </motion.div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
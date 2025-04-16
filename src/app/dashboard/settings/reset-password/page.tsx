"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Lock, Check, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const resetPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");
  
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains numbers
    if (/[0-9]/.test(password)) strength += 15;
    
    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    return Math.min(100, strength);
  };
  
  const getStrengthText = (strength: number) => {
    if (strength <= 25) return "Weak";
    if (strength <= 50) return "Fair";
    if (strength <= 75) return "Good";
    return "Strong";
  };
  
  const getStrengthColor = (strength: number) => {
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const passwordStrength = calculatePasswordStrength(newPassword);
  const strengthText = getStrengthText(passwordStrength);
  const strengthColor = getStrengthColor(passwordStrength);

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/auth/reset-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      toast.success("Password updated successfully");
      setPasswordUpdated(true);
      form.reset();
    } catch (error: unknown) {
      const errorMessage = (error as {response?: {data?: {error?: string}}})?.response?.data?.error || "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = [
    { text: "At least 8 characters", check: (password: string) => password.length >= 8 },
    { text: "At least one uppercase letter", check: (password: string) => /[A-Z]/.test(password) },
    { text: "At least one lowercase letter", check: (password: string) => /[a-z]/.test(password) },
    { text: "At least one number", check: (password: string) => /[0-9]/.test(password) },
  ];

  return (
    <div className="container max-w-2xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-muted-foreground">Update your password to keep your account secure</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5 text-primary" />
            Password Settings
          </CardTitle>
          <CardDescription>
            Choose a strong password that you don&apos;t use elsewhere
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {passwordUpdated ? (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your password has been updated successfully. You&apos;ll use your new password the next time you sign in.
              </AlertDescription>
              <Button 
                className="mt-4 bg-green-600 hover:bg-green-700" 
                onClick={() => setPasswordUpdated(false)}
              >
                Update another password
              </Button>
            </Alert>
          ) : (
            <>
              <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Password Security</AlertTitle>
                <AlertDescription>
                  For your security, your password must include at least 8 characters with uppercase letters, lowercase letters, and numbers.
                </AlertDescription>
              </Alert>
            
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showCurrentPassword ? "text" : "password"}
                              placeholder="••••••••" 
                              className="pl-9 pr-9"
                              {...field} 
                            />
                          </FormControl>
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <button 
                            type="button"
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            tabIndex={-1}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormDescription>
                          Enter your current password to verify your identity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="pl-9 pr-9"
                              {...field} 
                            />
                          </FormControl>
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <button 
                            type="button"
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex={-1}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Password strength:</span>
                        <span className="text-sm font-medium">{strengthText}</span>
                      </div>
                      <Progress value={passwordStrength} className={strengthColor} />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {passwordRequirements.map((req, index) => (
                          <div 
                            key={index}
                            className={`text-xs flex items-center ${
                              newPassword && req.check(newPassword) 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-muted-foreground"
                            }`}
                          >
                            {newPassword && req.check(newPassword) ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border mr-1" />
                            )}
                            {req.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="pl-9 pr-9"
                              {...field} 
                            />
                          </FormControl>
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <button 
                            type="button"
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormDescription>
                          Re-enter your new password to confirm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/30 border-t">
          <div className="flex items-start w-full">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
            <p className="text-xs text-muted-foreground">
              For security reasons, you&apos;ll be asked to enter your new password the next time you log in. Keep your password secure and don&apos;t share it with anyone.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
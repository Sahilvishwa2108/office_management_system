"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Lock, Check, Eye, EyeOff, AlertCircle, Phone, Building2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phone: z.string()
    .optional()
    .transform(val => {
      if (!val) return val;
      
      // Remove all spaces from the input
      const cleaned = val.replace(/\s+/g, '');
      
      // Check if it's a 10-digit number without country code
      if (/^[6-9]\d{9}$/.test(cleaned)) {
        return `+91${cleaned}`;
      }
      
      // If it has country code already, ensure format is correct
      if (/^\+91\d{10}$/.test(cleaned)) {
        return cleaned;
      }
      
      // If it's in another format but has country code indicator, clean it
      if (cleaned.includes('+91')) {
        const digits = cleaned.match(/\d{10}$/)?.[0];
        if (digits) return `+91${digits}`;
      }
      
      return cleaned; // Return as is if it doesn't match known patterns
    })
    .refine(val => !val || /^\+91[6-9]\d{9}$/.test(val), {
      message: "Phone number must be a valid Indian mobile number in format +91XXXXXXXXXX"
    })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SetPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Read URL parameters using window.location in useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const tokenParam = url.searchParams.get('token');
        const userIdParam = url.searchParams.get('id');
        
        setToken(tokenParam);
        setUserId(userIdParam);
        
        // Validate token presence
        if (!tokenParam || !userIdParam) {
          setInvalidToken(true);
        }
        
        setTokenChecked(true);
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
        setInvalidToken(true);
        setTokenChecked(true);
      }
    }
  }, []);

  // Verify token validity
  useEffect(() => {
    if (token && userId && !invalidToken) {
      verifyToken();
    }
  }, [token, userId, invalidToken]);

  const verifyToken = async () => {
    try {
      await axios.get(`/api/auth/verify-token?token=${token}&userId=${userId}`);
    } catch (error) {
      console.error("Error verifying token:", error);
      setInvalidToken(true);
    }
  };

  // Update form default values
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const password = form.watch("password");
  
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

  const passwordStrength = calculatePasswordStrength(password);
  const strengthText = getStrengthText(passwordStrength);
  const strengthColor = getStrengthColor(passwordStrength);

  // Update onSubmit to include phone
  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!token || !userId) {
      toast.error("Missing token or user ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/auth/set-password", {
        password: data.password,
        phone: data.phone, // Include phone
        token,
        userId,
      });
      
      toast.success("Password set successfully");
      setPasswordSet(true);
    } catch (error: unknown) {
      const errorMessage = (error as {response?: {data?: {error?: string}}})?.response?.data?.error || "Failed to set password";
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

  if (!tokenChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Checking link...</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
            <p className="text-center mb-6">
              Please request a new password reset link or contact support if you continue to experience issues.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">{passwordSet ? "Password Set!" : "Set Your Password"}</CardTitle>
          <CardDescription>
            {passwordSet 
              ? "Your password has been set successfully." 
              : "Create a strong password for your account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {passwordSet ? (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription className="mb-6">
                Your password has been set successfully. You can now log in to your account.
              </AlertDescription>
              <Button 
                onClick={() => router.push("/login")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Login
              </Button>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-10 pr-10"
                            {...field} 
                          />
                        </FormControl>
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <button 
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
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

                {password && (
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
                            password && req.check(password) 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-muted-foreground"
                          }`}
                        >
                          {password && req.check(password) ? (
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
                      <FormLabel>Confirm Password</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Add phone field to the form */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            placeholder="Enter 10 digits or +91XXXXXXXXXX" 
                            className="pl-10"
                            {...field} 
                          />
                        </FormControl>
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting Password...
                    </>
                  ) : (
                    "Set Password"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t p-4">
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
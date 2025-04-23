"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Check,
  Shield,
  AlertCircle,
  Trash,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Update the profile schema with the phone formatting logic

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email").optional(),
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
});

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "", // Added avatar property
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Load user data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await axios.get("/api/users/profile");
  
        const userData = {
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          avatar: response.data.avatar || "", // Ensure avatar is included
        };
  
        console.log("Fetched user profile:", userData); // Debugging log
  
        form.reset(userData);
        setProfile(userData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
  
    loadUserProfile();
  }, [form]);

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true);
    setUpdateSuccess(false);

    try {
      const updateData = {
        name: data.name,
        phone: data.phone || "", // Ensure phone is a string, not undefined
        ...(session?.user?.role === "ADMIN" ? { email: data.email } : {}),
      };

      await axios.put("/api/users/profile", updateData);

      await update({
        name: data.name,
        ...(session?.user?.role === "ADMIN" ? { email: data.email } : {}),
      });

      setProfile((prevProfile) => ({
        ...prevProfile,
        name: data.name,
        phone: data.phone || "", // Fix the type issue here
        ...(session?.user?.role === "ADMIN" ? { email: data.email || "" } : {}),
      }));

      setUpdateSuccess(true);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("No file selected. Please choose a file to upload.");
      return;
    }
  
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp
    const folder = "office_management/avatar";
  
    try {
      // Request a signature from the backend
      const signatureResponse = await axios.post("/api/users/profile/avatar", {
        folder,
        timestamp,
      });
  
      const { signature, apiKey, cloudName } = signatureResponse.data;
  
      // Prepare the form data for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey); // Use your Cloudinary API key
      formData.append("timestamp", timestamp.toString());
      formData.append("folder", folder);
      formData.append("signature", signature);
  
      // Upload the file to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
  
      const avatarUrl = response.data.secure_url;
  
      // Update the avatar in the backend
      await axios.put("/api/users/profile/avatar", { avatar: avatarUrl });
  
      // Update the profile state with the new avatar URL
      setProfile((prevProfile) => ({
        ...prevProfile,
        avatar: avatarUrl,
      }));

      // Update the session with the new avatar
      await update({
        ...session,
        user: {
          ...session?.user,
          avatar: avatarUrl,
        },
      });
  
      toast.success("Profile picture uploaded successfully");
    } catch (error) {
      console.error("Error during upload:", error);
      toast.error("Failed to upload profile picture. Please try again.");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      // Send DELETE request to the backend
      const response = await fetch(`/api/users/profile/avatar?avatar=${encodeURIComponent(profile.avatar)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // Update the profile state to remove the avatar
        setProfile((prevProfile) => ({
          ...prevProfile,
          avatar: "", // Clear the avatar in the state
        }));

        // Update the session to remove the avatar
        await update({
          ...session,
          user: {
            ...session?.user,
            avatar: null,
          },
        });

        toast.success("Profile picture removed successfully");
      } else {
        // Even if Cloudinary deletion fails, update the UI
        if (data.error === "Failed to delete avatar from Cloudinary") {
          setProfile((prevProfile) => ({
            ...prevProfile,
            avatar: "", // Clear the avatar in the state
          }));
          toast.warning("Profile picture removed from database, but Cloudinary deletion failed.");
        } else {
          toast.error(data.error || "Failed to remove profile picture");
        }
      }
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove profile picture. Please try again.");
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatRoleName = (role: string) => {
    return role?.replace(/_/g, " ") || "User";
  };

  // Loading UI with skeletons
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-6">
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 border shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4 border-2 border-primary/10">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} />
              ) : (
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`}
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile.name ? getInitials(profile.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {profile.email}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-full mb-4">
              <Shield className="h-3 w-3" />
              {formatRoleName(session?.user?.role || "")}
            </div>

            {profile.avatar ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleRemoveAvatar}
              >
                <Trash className="h-4 w-4 mr-2" /> Remove Profile Picture
              </Button>
            ) : (
              <div className="w-full">
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload} // Trigger the upload function when a file is selected
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  } // Programmatically open the file input
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Profile Picture
                </Button>
              </div>
            )}

            <Separator className="my-4 w-full" />

            <div className="w-full space-y-4 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard/settings/reset-password">
                  Change Password
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updateSuccess && (
              <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
                <Check className="h-4 w-4" />
                <AlertTitle>Profile Updated</AlertTitle>
                <AlertDescription>
                  Your profile information has been successfully updated.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input {...field} className="pl-9" />
                        </FormControl>
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                      <FormDescription>
                        Your name as it appears throughout the system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            className="pl-9"
                            disabled={session?.user?.role !== "ADMIN"}
                          />
                        </FormControl>
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                      {session?.user?.role !== "ADMIN" && (
                        <FormDescription>
                          Only administrators can change email addresses.
                          Contact your administrator for assistance.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            className="pl-9"
                            placeholder="+91xxxxxxxxxx"
                          />
                        </FormControl>
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                      <FormDescription>
                        Don't forget to add your mobile number with{" "}
                        <strong>+91</strong> to receive notifications on
                        WhatsApp.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t">
            <div className="flex items-start w-full">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
              <p className="text-xs text-muted-foreground">
                Your profile information is visible to administrators and may be
                shared with team members as needed for collaboration.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

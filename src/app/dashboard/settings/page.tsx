"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Settings</CardTitle>
          <CardDescription>
            Select a category above to manage your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Security Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Use a strong, unique password</li>
                    <li>Enable two-factor authentication</li>
                    <li>Review your account activity regularly</li>
                    <li>Keep your contact information updated</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Did You Know?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>You can customize notification preferences</li>
                    <li>Profile information helps colleagues find you</li>
                    <li>Your settings sync across all devices</li>
                    <li>You can export your account data anytime</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
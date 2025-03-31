"use client"

import { SignUp } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Create Employee Account</CardTitle>
            <CardDescription>
              Enter details to create a new employee account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 
                    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
                  formFieldInput: 
                    "border-input bg-background focus:ring-2 focus:ring-primary",
                  card: "bg-transparent shadow-none",
                  header: "hidden",
                  footer: "text-xs text-muted-foreground text-center"
                }
              }}
              fallbackRedirectUrl="/onboarding"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
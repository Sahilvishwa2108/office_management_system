import { ReactNode } from "react"
import { UserButton } from "@clerk/nextjs"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SideNav from "@/components/dashboard/SideNav"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }
  
  // Get the user from Clerk
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId)
  
  // Check if user has selected a role
  const role = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
  if (!role) {
    redirect("/onboarding")
  }
  
  // Check if user exists in our database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  })
  
  // If not, create the user record
  if (!dbUser) {
    await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.emailAddresses[0].emailAddress,
        role: role as any,
      },
    })
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-white border-b shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.firstName} {user.lastName}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
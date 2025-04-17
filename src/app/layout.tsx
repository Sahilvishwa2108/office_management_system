"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/components/notifications/notification-system";
import { Toaster } from "sonner";
import { LoadingBar } from "@/components/ui/loading-bar";
import SearchParamsComponent from "@/components/search-params-handler";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <NotificationProvider>
                <LoadingBar />
                <SearchParamsComponent />
                {children}
                <Toaster position="top-right" richColors closeButton />
            </NotificationProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

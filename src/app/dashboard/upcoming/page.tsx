import { redirect } from "next/navigation";

export default function UpcomingIndexPage() {
  // Redirect to dashboard if someone accesses /dashboard/upcoming directly
  redirect("/dashboard");
}
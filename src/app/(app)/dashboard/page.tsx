import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return <DashboardClient isAdmin={user.role === "admin"} />;
}

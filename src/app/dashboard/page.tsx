import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import Shell from "@/components/Shell";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return (
    <Shell user={user}>
      <DashboardClient isAdmin={user.role === "admin"} />
    </Shell>
  );
}

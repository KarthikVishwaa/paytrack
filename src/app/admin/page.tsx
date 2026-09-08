import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import Shell from "@/components/Shell";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  return (
    <Shell user={user}>
      <AdminClient meId={user.id} />
    </Shell>
  );
}

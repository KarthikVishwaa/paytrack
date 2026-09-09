import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import Shell from "@/components/Shell";
import ProgressClient from "./ProgressClient";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return (
    <Shell user={user}>
      <ProgressClient />
    </Shell>
  );
}

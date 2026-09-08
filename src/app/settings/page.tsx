import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import Shell from "@/components/Shell";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return (
    <Shell user={user}>
      <SettingsClient user={user} />
    </Shell>
  );
}

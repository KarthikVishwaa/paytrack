import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return <SettingsClient user={user} />;
}

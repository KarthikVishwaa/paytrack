import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import ProgressClient from "./ProgressClient";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return <ProgressClient />;
}

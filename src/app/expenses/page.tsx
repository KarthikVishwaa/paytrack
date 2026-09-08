import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import Shell from "@/components/Shell";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const user = await activeUser();
  if (!user) redirect("/login");
  return (
    <Shell user={user}>
      <ExpensesClient user={user} />
    </Shell>
  );
}

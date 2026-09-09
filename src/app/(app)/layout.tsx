import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";

/**
 * Shared chrome for every signed-in page. Living here — one level above the
 * routes instead of inside each page.tsx — means Shell (header + bottom tab
 * bar) stays mounted across navigation: only the page segment below it
 * swaps, instead of the whole app remounting on every click.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await activeUser();
  if (!user) redirect("/login");
  return <Shell user={user}>{children}</Shell>;
}

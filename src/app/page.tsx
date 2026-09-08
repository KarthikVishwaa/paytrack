import { redirect } from "next/navigation";
import { activeUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  redirect((await activeUser()) ? "/dashboard" : "/login");
}

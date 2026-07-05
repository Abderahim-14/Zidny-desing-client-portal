import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/current-actor";

export default async function Home() {
  // getCurrentActor() redirects to /login itself if there's no session.
  const actor = await getCurrentActor();

  if (actor.role === "client") {
    redirect("/client");
  }
  if (actor.role === "freelancer") {
    redirect("/freelancer");
  }
  redirect("/admin");
}

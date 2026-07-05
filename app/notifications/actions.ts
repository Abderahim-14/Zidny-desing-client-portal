"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Marking a notification read isn't role-gated -- any authenticated user
// may mark their OWN notifications read, which is exactly what
// notifications_update_own RLS (migration 0005) already enforces. These
// use the session-bound client, not the service-role client: RLS is the
// actual boundary here, same as every other per-user read/write in this
// app that isn't a workflow state transition.

function homePathFor(role: string): string {
  if (role === "admin") return "/admin/notifications";
  if (role === "client") return "/client/notifications";
  return "/freelancer/notifications";
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const actor = await getCurrentActor();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("recipient_id", actor.userId);
  if (error) throw error;
  revalidatePath(homePathFor(actor.role));
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const actor = await getCurrentActor();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", actor.userId)
    .eq("read", false);
  if (error) throw error;
  revalidatePath(homePathFor(actor.role));
}

import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Session-bound reads only -- notifications_select_own RLS (migration
// 0005) already restricts every query here to recipient_id = auth.uid(),
// same as every other per-user table in this app.

export type NotificationType = "upload" | "submit" | "approve" | "rework";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  message: string;
  projectId: string;
  read: boolean;
  createdAt: string;
}

export async function listNotifications(recipientId: string): Promise<NotificationRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, message, project_id, read, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    projectId: n.project_id,
    read: n.read,
    createdAt: n.created_at,
  }));
}

export async function getUnreadNotificationCount(recipientId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

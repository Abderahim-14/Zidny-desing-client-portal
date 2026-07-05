import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProjectTrack } from "@/lib/portal/types";

// Read-only reference menu (deliverable_templates_select_all RLS, migration
// 0008, allows any authenticated role -- it's just a menu, not project
// data). Session-bound client per CLAUDE.md's "session client for
// role-scoped reads", even though this particular table isn't actually
// role-scoped.

export interface DeliverableTemplate {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  sortOrder: number;
}

export async function getDeliverableTemplates(
  track: ProjectTrack,
  stageNumber: number
): Promise<DeliverableTemplate[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("deliverable_templates")
    .select("id, name, description, is_default, sort_order")
    .eq("track", track)
    .eq("stage_number", stageNumber)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    isDefault: t.is_default,
    sortOrder: t.sort_order,
  }));
}

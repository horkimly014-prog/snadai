import { supabase } from "./supabaseClient";

export async function getFavoriteIds() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("artwork_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load favorites:", error.message);
    return [];
  }

  return data.map((row) => row.artwork_id);
}

export async function toggleFavoriteId(id) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const current = await getFavoriteIds();

  if (current.includes(id)) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("artwork_id", id);
    if (error) console.error("Failed to remove favorite:", error.message);
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, artwork_id: id });
    if (error) console.error("Failed to add favorite:", error.message);
  }

  return getFavoriteIds();
}

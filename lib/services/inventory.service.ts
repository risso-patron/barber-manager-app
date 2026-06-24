import { createClient } from "@/lib/supabase/client"

export async function getInventory() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("product_name")

  if (error) throw error

  return data
}
"use client"

import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return client
}

// Helper function to get user's organization ID
export async function getUserOrganizationId(userId: string) {
  const supabase = getSupabaseBrowserClient()
  
  const { data, error } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    console.error("Error fetching organization:", error)
    return null
  }

  return data.organization_id
}

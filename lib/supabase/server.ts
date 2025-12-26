import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Helper function to get user's organization ID (server-side)
export async function getUserOrganizationId(userId: string) {
  const supabase = await getSupabaseServerClient()
  
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

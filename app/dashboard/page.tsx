"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, Palette, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [businessData, setBusinessData] = useState<any>(null)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          setError(`Authentication error: ${authError.message}`)
          setLoading(false)
          return
        }

        if (!user) {
          router.push("/")
          return
        }

        setUser(user)

        const { data: profileData, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setError(`Failed to load profile: ${profileError.message}`)
        }

        setProfile(profileData)
        setBusinessData(profileData?.business_data || {})
        setLoading(false)
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    })
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-sm">Please check your Supabase configuration and ensure your project is active.</p>
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              Return to Home
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Quotify</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {profile?.full_name ? getInitials(profile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCompanyDetails(!showCompanyDetails)} className="text-sm">
                <Building2 className="mr-2 h-3.5 w-3.5" />
                {showCompanyDetails ? "Hide" : "View"} Company Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings/company")} className="text-sm">
                <Building2 className="mr-2 h-3.5 w-3.5" />
                Edit Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/onboarding/template")} className="text-sm">
                <Palette className="mr-2 h-3.5 w-3.5" />
                Edit Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive text-sm">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, {profile?.full_name?.split(" ")[0]}!</h2>
            <p className="text-sm text-muted-foreground">
              Your quotation workspace is ready. Start creating professional quotes for your business.
            </p>
          </div>

          {showCompanyDetails && profile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Company Name</p>
                    <p className="text-sm">{businessData?.companyName || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Contact Person</p>
                    <p className="text-sm">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{businessData?.email || user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{businessData?.phone || "Not set"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">
                      {businessData?.address
                        ? `${businessData.address.street}, ${businessData.address.city}, ${businessData.address.state} ${businessData.address.postalCode}`
                        : "Not set"}
                    </p>
                  </div>
                  {businessData?.website && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">Website</p>
                      <p className="text-sm">{businessData.website}</p>
                    </div>
                  )}
                  {businessData?.tax?.gst && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">GST</p>
                      <p className="text-sm">{businessData.tax.gst}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">Start creating your first quote</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Draft Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">No drafts yet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Sent Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">No sent quotes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

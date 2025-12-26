"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Building2, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CompanyDetailsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoUploading, setLogoUploading] = useState(false)

  // Address
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("")

  // Tax (optional - only GST)
  const [gst, setGst] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
      } else {
        setUser(user)
        setEmail(user.email || "")
      }
    }
    checkAuth()
  }, [router])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setLogoUploading(true)

    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
        toast({
          title: "Logo uploaded",
          description: "Your logo has been uploaded successfully",
        })
        setLogoUploading(false)
      }
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to upload logo. Please try again.",
          variant: "destructive",
        })
        setLogoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("[v0] Logo upload error:", err)
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
      setLogoUploading(false)
    }
  }

  const isFormValid = () => {
    return companyName && email && phone && street && city && state && postalCode
  }

  const handleContinue = async () => {
    if (!isFormValid()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Get user's organization ID
      const { data: orgUserData } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (!orgUserData) {
        throw new Error("Organization not found")
      }

      // Get existing organization data
      const { data: existing } = await supabase
        .from("organizations")
        .select("org_data")
        .eq("id", orgUserData.organization_id)
        .single()

      const existingBusinessData = existing?.org_data || {}

      const updatedBusinessData = {
        ...existingBusinessData,
        companyName,
        email,
        phone,
        website,
        logo: logoUrl,
        address: {
          street,
          city,
          state,
          postalCode,
          country,
        },
        tax: {
          gst,
        },
      }

      const { error } = await supabase
        .from("organizations")
        .update({
          name: companyName,
          org_data: updatedBusinessData,
        })
        .eq("id", orgUserData.organization_id)

      if (error) throw error

      toast({
        title: "Company details saved",
        description: "Your company information has been saved successfully",
      })

      router.push("/onboarding/template")
    } catch (err: any) {
      console.error("[v0] Save error:", err)
      toast({
        title: "Failed to save",
        description: err.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold">Company Details</h1>
          <div className="ml-auto text-xs text-muted-foreground">Step 2 of 3</div>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Information
              </CardTitle>
              <CardDescription className="text-sm">Tell us about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo" className="text-sm">
                  Company Logo
                </Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={logoUrl || "/placeholder.svg"}
                        alt="Company logo"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={logoUploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo")?.click()}
                      disabled={logoUploading}
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-sm">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corporation"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@company.com"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-sm">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="street" className="text-sm">
                  Street Address *
                </Label>
                <Textarea
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Business Street, Suite 100"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-sm">
                    City *
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-sm">
                    State / Province *
                  </Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode" className="text-sm">
                    Postal Code *
                  </Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-sm">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Tax Info */}
              <div className="border-t pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gst" className="text-sm">
                    GST Number (Optional)
                  </Label>
                  <Input
                    id="gst"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleContinue} disabled={loading || !isFormValid()} className="flex-1 text-sm">
                  {loading ? "Saving..." : "Continue to Template Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

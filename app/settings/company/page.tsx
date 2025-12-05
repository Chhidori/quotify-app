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
import { ArrowLeft, Building2, Save, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EditCompanyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("")
  const [gst, setGst] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/")
          return
        }

        setUser(user)

        const { data: profile } = await supabase.from("business_profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setFullName(profile.full_name || "")
          const businessData = profile.business_data || {}

          setCompanyName(businessData.companyName || "")
          setEmail(businessData.email || user.email || "")
          setPhone(businessData.phone || "")
          setWebsite(businessData.website || "")
          setStreet(businessData.address?.street || "")
          setCity(businessData.address?.city || "")
          setState(businessData.address?.state || "")
          setPostalCode(businessData.address?.postalCode || "")
          setCountry(businessData.address?.country || "")
          setGst(businessData.tax?.gst || "")
          setLogoUrl(businessData.logo || "")
        }

        setLoading(false)
      } catch (err) {
        console.error("[v0] Error loading company data:", err)
        toast({
          title: "Failed to load data",
          description: "Please try again",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [router, toast])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()

      const { data: existing } = await supabase
        .from("business_profiles")
        .select("business_data")
        .eq("id", user.id)
        .single()

      const existingBusinessData = existing?.business_data || {}

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
        .from("business_profiles")
        .update({
          full_name: fullName,
          business_data: updatedBusinessData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Company details updated",
        description: "Your changes have been saved successfully",
      })
      router.push("/dashboard")
    } catch (err: any) {
      console.error("[v0] Save error:", err)
      toast({
        title: "Failed to save",
        description: err.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Company Details</h1>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </CardTitle>
              <CardDescription className="text-sm">
                Update your business details and contact information
              </CardDescription>
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

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="text-sm"
                    />
                  </div>

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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm">
                      Phone Number
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
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Address</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="street" className="text-sm">
                    Street Address
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
                      City
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
                      State / Province
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
                      Postal Code
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
              </div>

              {/* Tax Information */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Tax Information</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="gst" className="text-sm">
                    GST Number
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
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving || !fullName || !companyName} className="flex-1 text-sm">
                  <Save className="mr-2 h-3 w-3" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="text-sm">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

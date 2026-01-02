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

  // Quotation Numbering
  const [quotationStartNumber, setQuotationStartNumber] = useState("")
  const [quotationPrefix, setQuotationPrefix] = useState("QT-")

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

        // Get user's organization
        const { data: orgUserData } = await supabase
          .from("organization_users")
          .select("organization_id")
          .eq("user_id", user.id)
          .single()

        if (!orgUserData) {
          throw new Error("Organization not found")
        }

        const { data: org } = await supabase.from("organizations").select("*").eq("id", orgUserData.organization_id).single()

        if (org) {
          const orgData = org.org_data || {}

          setFullName(orgData.owner_name || "")
          setCompanyName(orgData.companyName || org.name || "")
          setEmail(orgData.email || user.email || "")
          setPhone(orgData.phone || "")
          setWebsite(orgData.website || "")
          setStreet(orgData.address?.street || "")
          setCity(orgData.address?.city || "")
          setState(orgData.address?.state || "")
          setPostalCode(orgData.address?.postalCode || "")
          setCountry(orgData.address?.country || "")
          setGst(orgData.tax?.gst || "")
          setLogoUrl(orgData.logo || "")
          setQuotationPrefix(orgData.quotationNumbering?.prefix || "QT-")
          setQuotationStartNumber(orgData.quotationNumbering?.startNumber?.toString() || "")
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

      // Get organization_id from organization_users table
      const { data: orgUser } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (!orgUser?.organization_id) {
        throw new Error("Organization not found")
      }

      // Get existing data from organizations table
      const { data: existing } = await supabase
        .from("organizations")
        .select("org_data")
        .eq("id", orgUser.organization_id)
        .single()

      const existingBusinessData = existing?.org_data || {}

      const updatedBusinessData = {
        ...existingBusinessData,
        owner_name: fullName,
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
        quotationNumbering: {
          prefix: quotationPrefix || "QT-",
          startNumber: quotationStartNumber ? parseInt(quotationStartNumber) : 1,
          currentNumber: existingBusinessData?.quotationNumbering?.currentNumber || (quotationStartNumber ? parseInt(quotationStartNumber) : 1),
        },
      }

      // Update organizations table
      const { error } = await supabase
        .from("organizations")
        .update({
          name: companyName,
          org_data: updatedBusinessData,
        })
        .eq("id", orgUser.organization_id)

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
        <div className="container mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold truncate">Edit Company Details</h1>
        </div>
      </header>

      <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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
                  <div className="flex-1 w-full sm:w-auto">
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
                      className="w-full sm:w-auto"
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG up to 2MB</p>
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

              {/* Quotation Numbering */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Quotation Numbering</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure how your quotations are numbered. Changes only affect new quotations.
                  </p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="quotationPrefix" className="text-sm">
                      Quotation Prefix
                    </Label>
                    <Input
                      id="quotationPrefix"
                      value={quotationPrefix}
                      onChange={(e) => setQuotationPrefix(e.target.value)}
                      placeholder="QT-"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      E.g., "QT-" will generate QT-1001, QT-1002, etc.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quotationStartNumber" className="text-sm">
                      Starting Number
                    </Label>
                    <Input
                      id="quotationStartNumber"
                      type="number"
                      value={quotationStartNumber}
                      onChange={(e) => setQuotationStartNumber(e.target.value)}
                      placeholder="1"
                      min="1"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Initial number for new quotations (e.g., 1001)
                    </p>
                  </div>
                </div>

                {quotationPrefix && quotationStartNumber && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                    <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                    <p className="text-sm font-medium">
                      {quotationPrefix}{quotationStartNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving || !fullName || !companyName} className="flex-1 text-sm">
                  <Save className="mr-2 h-3 w-3" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="text-sm sm:w-auto w-full">
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

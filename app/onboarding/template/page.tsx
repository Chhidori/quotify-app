"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { QuotationPreview } from "@/components/quotation-preview"
import { ArrowLeft, Palette, Type, Layout, Eye, Save, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

type TemplateType = "modern" | "classic" | "minimal"
type LogoPosition = "left" | "center" | "right"
type PageSize = "A4" | "Letter" | "Legal"

export default function TemplateCustomizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [companyData] = useState({
    name: "Acme Corporation",
    email: "info@acmecorp.com",
    phone: "+1 (555) 123-4567",
    address: {
      line1: "123 Business Street",
      line2: "Suite 100",
      city: "New York",
      state: "NY",
      postalCode: "10001",
    },
    logo: "https://placeholder.svg?height=80&width=80&query=company+logo",
    gst: "22AAAAA0000A1Z5",
    pan: "ABCDE1234F",
    website: "https://acmecorp.com",
  })

  const [templateType, setTemplateType] = useState<TemplateType>("modern")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState("#64748b")
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("left")
  const [pageSize, setPageSize] = useState<PageSize>("A4")
  const [headerText, setHeaderText] = useState("QUOTATION")
  const [footerText, setFooterText] = useState("Thank you for your business")

  // Toggle switches
  const [showLogo, setShowLogo] = useState(true)
  const [showAddress, setShowAddress] = useState(true)
  const [showGST, setShowGST] = useState(true)
  const [showPAN, setShowPAN] = useState(true)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [showTerms, setShowTerms] = useState(true)
  const [showNotes, setShowNotes] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    const loadExistingTemplate = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: template } = await supabase
        .from("quotation_templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single()

      if (template?.template_data) {
        const data = template.template_data as any
        setTemplateType(data.type || "modern")
        setPrimaryColor(data.primaryColor || "#3b82f6")
        setSecondaryColor(data.secondaryColor || "#64748b")
        setLogoPosition(data.logoPosition || "left")
        setPageSize(data.pageSize || "A4")
        setHeaderText(data.headerText || "QUOTATION")
        setFooterText(data.footerText || "Thank you for your business")

        if (data.sections) {
          setShowLogo(data.sections.showLogo ?? true)
          setShowAddress(data.sections.showAddress ?? true)
          setShowGST(data.sections.showGST ?? true)
          setShowPAN(data.sections.showPAN ?? true)
          setShowBankDetails(data.sections.showBankDetails ?? false)
          setShowTerms(data.sections.showTerms ?? true)
          setShowNotes(data.sections.showNotes ?? true)
        }
      }
    }

    loadExistingTemplate()
  }, [])

  const handleComplete = async () => {
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const templateData = {
        type: templateType,
        primaryColor,
        secondaryColor,
        logoPosition,
        pageSize,
        headerText,
        footerText,
        sections: {
          showLogo,
          showAddress,
          showGST,
          showPAN,
          showBankDetails,
          showTerms,
          showNotes,
        },
      }

      const { data: existing } = await supabase
        .from("quotation_templates")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single()

      let error
      if (existing) {
        const result = await supabase
          .from("quotation_templates")
          .update({
            template_data: templateData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
        error = result.error
      } else {
        const result = await supabase.from("quotation_templates").insert([
          {
            user_id: user.id,
            template_data: templateData,
            is_default: true,
          },
        ])
        error = result.error
      }

      if (error) throw error

      toast({
        title: "Template saved",
        description: "Your quotation template has been saved successfully",
      })

      router.push("/dashboard")
    } catch (err: any) {
      console.error("[v0] Template save error:", err)
      toast({
        title: "Failed to save template",
        description: err.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Template Customization</h1>
            <p className="text-xs text-muted-foreground">Design your perfect quotation template</p>
          </div>
          <Button onClick={handleComplete} disabled={loading} size="sm">
            <Save className="mr-2 h-3 w-3" />
            {loading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Settings with organized tabs */}
        <div className="w-1/2 overflow-y-auto border-r">
          <div className="p-6">
            <Tabs defaultValue="style" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="style" className="gap-2 text-xs">
                  <Palette className="h-3 w-3" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-2 text-xs">
                  <Layout className="h-3 w-3" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="sections" className="gap-2 text-xs">
                  <Eye className="h-3 w-3" />
                  Sections
                </TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Template Style</CardTitle>
                    <CardDescription className="text-xs">Choose your template design</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {(["modern", "classic", "minimal"] as TemplateType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setTemplateType(type)}
                          className={`p-3 border-2 rounded-lg capitalize transition-all hover:scale-105 ${
                            templateType === type
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-xs font-medium">{type}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Color Scheme</CardTitle>
                    <CardDescription className="text-xs">Customize your brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="primaryColor" className="text-xs">
                        Primary Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 font-mono text-xs"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="secondaryColor" className="text-xs">
                        Secondary Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 font-mono text-xs"
                          placeholder="#64748b"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Page Size
                    </CardTitle>
                    <CardDescription className="text-xs">Choose your document size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {(["A4", "Letter", "Legal"] as PageSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setPageSize(size)}
                          className={`p-3 border-2 rounded-lg transition-all hover:scale-105 ${
                            pageSize === size
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-xs font-medium">{size}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {size === "A4" && "210 × 297 mm"}
                            {size === "Letter" && "8.5 × 11 in"}
                            {size === "Legal" && "8.5 × 14 in"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Logo Position</CardTitle>
                    <CardDescription className="text-xs">Where should your logo appear?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {(["left", "center", "right"] as LogoPosition[]).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setLogoPosition(pos)}
                          className={`p-3 border-2 rounded-lg capitalize transition-all hover:scale-105 ${
                            logoPosition === pos
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-xs font-medium">{pos}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Type className="h-3.5 w-3.5" />
                      Text Content
                    </CardTitle>
                    <CardDescription className="text-xs">Customize header and footer text</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="headerText" className="text-xs">
                        Header Text
                      </Label>
                      <Input
                        id="headerText"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder="QUOTATION"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="footerText" className="text-xs">
                        Footer Text
                      </Label>
                      <Input
                        id="footerText"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Thank you for your business"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sections" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Visible Sections</CardTitle>
                    <CardDescription className="text-xs">Show or hide sections in your quotation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Show Logo", state: showLogo, setter: setShowLogo },
                      { label: "Show Address", state: showAddress, setter: setShowAddress },
                      { label: "Show GST", state: showGST, setter: setShowGST },
                      { label: "Show PAN", state: showPAN, setter: setShowPAN },
                      { label: "Show Bank Details", state: showBankDetails, setter: setShowBankDetails },
                      { label: "Show Terms", state: showTerms, setter: setShowTerms },
                      { label: "Show Notes", state: showNotes, setter: setShowNotes },
                    ].map(({ label, state, setter }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-xs font-medium">{label}</span>
                        <button
                          onClick={() => setter(!state)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            state ? "bg-primary" : "bg-muted"
                          }`}
                          role="switch"
                          aria-checked={state}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-lg transition-transform ${
                              state ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Full Page Live Preview */}
        <div className="w-1/2 bg-muted/30 overflow-y-auto">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Live Preview</h3>
                <p className="text-xs text-muted-foreground">Your changes appear instantly • {pageSize} format</p>
              </div>
            </div>
            <QuotationPreview
              companyData={companyData}
              layout={{
                type: templateType,
                primaryColor,
                secondaryColor,
                logoPosition,
                pageSize,
                headerText,
                footerText,
                sections: {
                  showLogo,
                  showAddress,
                  showGST,
                  showPAN,
                  showBankDetails,
                  showTerms,
                  showNotes,
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

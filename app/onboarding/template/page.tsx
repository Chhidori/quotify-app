"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { QuotationPreview } from "@/components/quotation-preview"
import { ArrowLeft, Palette, Type, Layout, Eye, Save, FileText, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

type TemplateType = "modern" | "classic" | "minimal"
type LogoPosition = "left" | "center" | "right"
type PageSize = "A4" | "Letter" | "Legal"
type FontSize = "small" | "medium" | "large"
type BorderStyle = "none" | "light" | "medium" | "heavy"

export default function TemplateCustomizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [companyData, setCompanyData] = useState<any>(null)
  const [templateType, setTemplateType] = useState<TemplateType>("modern")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState("#64748b")
  const [accentColor, setAccentColor] = useState("#10b981")
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("left")
  const [pageSize, setPageSize] = useState<PageSize>("A4")
  const [headerText, setHeaderText] = useState("QUOTATION")
  const [footerText, setFooterText] = useState("Thank you for your business")

  // Typography
  const [fontSize, setFontSize] = useState<FontSize>("medium")
  const [fontFamily, setFontFamily] = useState("default")

  // Header customization
  const [showHeaderBorder, setShowHeaderBorder] = useState(true)
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState("#ffffff")
  const [logoSize, setLogoSize] = useState(80) // in pixels

  // Company info customization
  const [showLogo, setShowLogo] = useState(true)
  const [showCompanyName, setShowCompanyName] = useState(true)
  const [showAddress, setShowAddress] = useState(true)
  const [showEmail, setShowEmail] = useState(true)
  const [showPhone, setShowPhone] = useState(true)
  const [showWebsite, setShowWebsite] = useState(true)
  const [showGST, setShowGST] = useState(true)

  // Customer section
  const [customerSectionTitle, setCustomerSectionTitle] = useState("Bill To")
  const [showCustomerSection, setShowCustomerSection] = useState(true)

  // Table customization
  const [tableBorderStyle, setTableBorderStyle] = useState<BorderStyle>("medium")
  const [showTableHeader, setShowTableHeader] = useState(true)
  const [showItemNumber, setShowItemNumber] = useState(true)
  const [showDescription, setShowDescription] = useState(true)
  const [showQuantity, setShowQuantity] = useState(true)
  const [showRate, setShowRate] = useState(true)
  const [showAmount, setShowAmount] = useState(true)
  const [showTax, setShowTax] = useState(true)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showHSN, setShowHSN] = useState(false)
  const [alternateRowColor, setAlternateRowColor] = useState(true)

  // Totals section
  const [showSubtotal, setShowSubtotal] = useState(true)
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true)
  const [showDiscountRow, setShowDiscountRow] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [showGrandTotal, setShowGrandTotal] = useState(true)
  const [totalsSectionPosition, setTotalsSectionPosition] = useState<"right" | "full">("right")

  // Terms and notes
  const [showTerms, setShowTerms] = useState(true)
  const [termsTitle, setTermsTitle] = useState("Terms & Conditions")
  const [termsContent, setTermsContent] = useState(
    "Payment is due within 30 days of invoice date. Late payments may incur additional charges.",
  )
  const [showNotes, setShowNotes] = useState(true)
  const [notesTitle, setNotesTitle] = useState("Notes")
  const [notesContent, setNotesContent] = useState("Thank you for your business!")

  // Signature section
  const [showSignature, setShowSignature] = useState(true)
  const [signatureLabel, setSignatureLabel] = useState("Authorized Signature")
  const [showSignatureDate, setShowSignatureDate] = useState(true)

  // Additional options
  const [showWatermark, setShowWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState("DRAFT")
  const [showPageNumbers, setShowPageNumbers] = useState(false)
  const [showDate, setShowDate] = useState(true)
  const [showQuotationNumber, setShowQuotationNumber] = useState(true)
  const [showValidUntil, setShowValidUntil] = useState(true)

  // Margins and spacing
  const [pageMargin, setPageMargin] = useState(20) // in mm
  const [sectionSpacing, setSectionSpacing] = useState(16) // in px

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }

      // Get user's organization
      const { data: orgUserData } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (!orgUserData) return

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgUserData.organization_id)
        .single()

      if (org) {
        const orgData = org.org_data || {}
        setCompanyData({
          name: orgData.companyName || org.name || "Your Company",
          email: orgData.email || user.email || "",
          phone: orgData.phone || "",
          address: orgData.address || {
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
          },
          logo: orgData.logo || "",
          gst: orgData.tax?.gst || "",
          website: orgData.website || "",
        })
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

      // Get user's organization ID
      const { data: orgUserData } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (!orgUserData) return

      const { data: template } = await supabase
        .from("quotation_templates")
        .select("*")
        .eq("organization_id", orgUserData.organization_id)
        .single()

      if (template?.template_data) {
        const data = template.template_data as any
        setTemplateType(data.type || "modern")
        setPrimaryColor(data.primaryColor || "#3b82f6")
        setSecondaryColor(data.secondaryColor || "#64748b")
        setAccentColor(data.accentColor || "#10b981")
        setLogoPosition(data.logoPosition || "left")
        setPageSize(data.pageSize || "A4")
        setHeaderText(data.headerText || "QUOTATION")
        setFooterText(data.footerText || "Thank you for your business")

        // Load all new options
        if (data.typography) {
          setFontSize(data.typography.fontSize || "medium")
          setFontFamily(data.typography.fontFamily || "default")
        }

        if (data.header) {
          setShowHeaderBorder(data.header.showBorder ?? true)
          setHeaderBackgroundColor(data.header.backgroundColor || "#ffffff")
          setLogoSize(data.header.logoSize || 80)
        }

        if (data.sections) {
          setShowLogo(data.sections.showLogo ?? true)
          setShowCompanyName(data.sections.showCompanyName ?? true)
          setShowAddress(data.sections.showAddress ?? true)
          setShowEmail(data.sections.showEmail ?? true)
          setShowPhone(data.sections.showPhone ?? true)
          setShowWebsite(data.sections.showWebsite ?? true)
          setShowGST(data.sections.showGST ?? true)
          setShowCustomerSection(data.sections.showCustomerSection ?? true)
          setShowTerms(data.sections.showTerms ?? true)
          setShowNotes(data.sections.showNotes ?? true)
          setShowSignature(data.sections.showSignature ?? true)
          setShowDate(data.sections.showDate ?? true)
          setShowQuotationNumber(data.sections.showQuotationNumber ?? true)
          setShowValidUntil(data.sections.showValidUntil ?? true)
        }

        if (data.table) {
          setTableBorderStyle(data.table.borderStyle || "medium")
          setShowTableHeader(data.table.showHeader ?? true)
          setShowItemNumber(data.table.showItemNumber ?? true)
          setShowDescription(data.table.showDescription ?? true)
          setShowQuantity(data.table.showQuantity ?? true)
          setShowRate(data.table.showRate ?? true)
          setShowAmount(data.table.showAmount ?? true)
          setShowTax(data.table.showTax ?? true)
          setShowDiscount(data.table.showDiscount ?? false)
          setShowHSN(data.table.showHSN ?? false)
          setAlternateRowColor(data.table.alternateRowColor ?? true)
        }

        if (data.totals) {
          setShowSubtotal(data.totals.showSubtotal ?? true)
          setShowTaxBreakdown(data.totals.showTaxBreakdown ?? true)
          setShowDiscountRow(data.totals.showDiscountRow ?? false)
          setShowShipping(data.totals.showShipping ?? false)
          setShowGrandTotal(data.totals.showGrandTotal ?? true)
          setTotalsSectionPosition(data.totals.position || "right")
        }

        if (data.content) {
          setCustomerSectionTitle(data.content.customerSectionTitle || "Bill To")
          setTermsTitle(data.content.termsTitle || "Terms & Conditions")
          setTermsContent(data.content.termsContent || "Payment is due within 30 days of invoice date.")
          setNotesTitle(data.content.notesTitle || "Notes")
          setNotesContent(data.content.notesContent || "Thank you for your business!")
          setSignatureLabel(data.content.signatureLabel || "Authorized Signature")
          setWatermarkText(data.content.watermarkText || "DRAFT")
        }

        if (data.advanced) {
          setShowWatermark(data.advanced.showWatermark ?? false)
          setShowPageNumbers(data.advanced.showPageNumbers ?? false)
          setShowSignatureDate(data.advanced.showSignatureDate ?? true)
          setPageMargin(data.advanced.pageMargin || 20)
          setSectionSpacing(data.advanced.sectionSpacing || 16)
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
        accentColor,
        logoPosition,
        pageSize,
        headerText,
        footerText,
        typography: {
          fontSize,
          fontFamily,
        },
        header: {
          showBorder: showHeaderBorder,
          backgroundColor: headerBackgroundColor,
          logoSize,
        },
        sections: {
          showLogo,
          showCompanyName,
          showAddress,
          showEmail,
          showPhone,
          showWebsite,
          showGST,
          showCustomerSection,
          showTerms,
          showNotes,
          showSignature,
          showDate,
          showQuotationNumber,
          showValidUntil,
        },
        table: {
          borderStyle: tableBorderStyle,
          showHeader: showTableHeader,
          showItemNumber,
          showDescription,
          showQuantity,
          showRate,
          showAmount,
          showTax,
          showDiscount,
          showHSN,
          alternateRowColor,
        },
        totals: {
          showSubtotal,
          showTaxBreakdown,
          showDiscountRow,
          showShipping,
          showGrandTotal,
          position: totalsSectionPosition,
        },
        content: {
          customerSectionTitle,
          termsTitle,
          termsContent,
          notesTitle,
          notesContent,
          signatureLabel,
          watermarkText,
        },
        advanced: {
          showWatermark,
          showPageNumbers,
          showSignatureDate,
          pageMargin,
          sectionSpacing,
        },
      }

      // Get organization_id from organization_users table
      const { data: orgUserData, error: orgError } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (orgError || !orgUserData) {
        throw new Error("Failed to get organization")
      }

      const { data: existing } = await supabase
        .from("quotation_templates")
        .select("id")
        .eq("organization_id", orgUserData.organization_id)
        .single()

      let error
      if (existing) {
        const result = await supabase
          .from("quotation_templates")
          .update({
            template_data: templateData,
          })
          .eq("id", existing.id)
        error = result.error
      } else {
        const result = await supabase.from("quotation_templates").insert([
          {
            organization_id: orgUserData.organization_id,
            template_data: templateData,
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="style" className="gap-1 text-xs">
                  <Palette className="h-3 w-3" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1 text-xs">
                  <Layout className="h-3 w-3" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="sections" className="gap-1 text-xs">
                  <Eye className="h-3 w-3" />
                  Sections
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-1 text-xs">
                  <Type className="h-3 w-3" />
                  Content
                </TabsTrigger>
              </TabsList>

              {/* Style Tab */}
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
                    {[
                      { label: "Primary Color", value: primaryColor, setter: setPrimaryColor, id: "primaryColor" },
                      {
                        label: "Secondary Color",
                        value: secondaryColor,
                        setter: setSecondaryColor,
                        id: "secondaryColor",
                      },
                      { label: "Accent Color", value: accentColor, setter: setAccentColor, id: "accentColor" },
                      {
                        label: "Header Background",
                        value: headerBackgroundColor,
                        setter: setHeaderBackgroundColor,
                        id: "headerBg",
                      },
                    ].map(({ label, value, setter, id }) => (
                      <div key={id} className="space-y-1.5">
                        <Label htmlFor={id} className="text-xs">
                          {label}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={id}
                            type="color"
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            className="h-10 w-16 p-1 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            className="flex-1 font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Typography</CardTitle>
                    <CardDescription className="text-xs">Font settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Font Size</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["small", "medium", "large"] as FontSize[]).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`p-2 border rounded capitalize text-xs ${
                              fontSize === size ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Font Family</Label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full p-2 border rounded text-xs"
                      >
                        <option value="default">Default (Sans-serif)</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Monospace</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
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
                    <CardTitle className="text-sm">Logo Settings</CardTitle>
                    <CardDescription className="text-xs">Customize logo appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Logo Position</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["left", "center", "right"] as LogoPosition[]).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setLogoPosition(pos)}
                            className={`p-2 border rounded capitalize text-xs ${
                              logoPosition === pos ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="logoSize" className="text-xs">
                        Logo Size: {logoSize}px
                      </Label>
                      <Input
                        id="logoSize"
                        type="range"
                        min="40"
                        max="200"
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Spacing & Margins</CardTitle>
                    <CardDescription className="text-xs">Adjust page layout spacing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pageMargin" className="text-xs">
                        Page Margin: {pageMargin}mm
                      </Label>
                      <Input
                        id="pageMargin"
                        type="range"
                        min="10"
                        max="40"
                        value={pageMargin}
                        onChange={(e) => setPageMargin(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="sectionSpacing" className="text-xs">
                        Section Spacing: {sectionSpacing}px
                      </Label>
                      <Input
                        id="sectionSpacing"
                        type="range"
                        min="8"
                        max="32"
                        value={sectionSpacing}
                        onChange={(e) => setSectionSpacing(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Header Options</CardTitle>
                    <CardDescription className="text-xs">Customize header appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleOption label="Show Header Border" state={showHeaderBorder} setter={setShowHeaderBorder} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sections Tab */}
              <TabsContent value="sections" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Company Information</CardTitle>
                    <CardDescription className="text-xs">Choose what to display</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleOption label="Show Logo" state={showLogo} setter={setShowLogo} />
                    <ToggleOption label="Show Company Name" state={showCompanyName} setter={setShowCompanyName} />
                    <ToggleOption label="Show Address" state={showAddress} setter={setShowAddress} />
                    <ToggleOption label="Show Email" state={showEmail} setter={setShowEmail} />
                    <ToggleOption label="Show Phone" state={showPhone} setter={setShowPhone} />
                    <ToggleOption label="Show Website" state={showWebsite} setter={setShowWebsite} />
                    <ToggleOption label="Show GST Number" state={showGST} setter={setShowGST} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Document Details</CardTitle>
                    <CardDescription className="text-xs">Quotation metadata</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleOption label="Show Date" state={showDate} setter={setShowDate} />
                    <ToggleOption
                      label="Show Quotation Number"
                      state={showQuotationNumber}
                      setter={setShowQuotationNumber}
                    />
                    <ToggleOption label="Show Valid Until" state={showValidUntil} setter={setShowValidUntil} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Additional Sections</CardTitle>
                    <CardDescription className="text-xs">Optional content areas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleOption
                      label="Show Customer Section"
                      state={showCustomerSection}
                      setter={setShowCustomerSection}
                    />
                    <ToggleOption label="Show Terms & Conditions" state={showTerms} setter={setShowTerms} />
                    <ToggleOption label="Show Notes" state={showNotes} setter={setShowNotes} />
                    <ToggleOption label="Show Signature" state={showSignature} setter={setShowSignature} />
                    <ToggleOption label="Show Signature Date" state={showSignatureDate} setter={setShowSignatureDate} />
                    <ToggleOption label="Show Watermark" state={showWatermark} setter={setShowWatermark} />
                    <ToggleOption label="Show Page Numbers" state={showPageNumbers} setter={setShowPageNumbers} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Table Tab */}
              <TabsContent value="table" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Table Columns</CardTitle>
                    <CardDescription className="text-xs">Choose which columns to display</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ToggleOption label="Show Item Number" state={showItemNumber} setter={setShowItemNumber} />
                    <ToggleOption label="Show Description" state={showDescription} setter={setShowDescription} />
                    <ToggleOption label="Show HSN/SAC Code" state={showHSN} setter={setShowHSN} />
                    <ToggleOption label="Show Quantity" state={showQuantity} setter={setShowQuantity} />
                    <ToggleOption label="Show Rate/Price" state={showRate} setter={setShowRate} />
                    <ToggleOption label="Show Discount" state={showDiscount} setter={setShowDiscount} />
                    <ToggleOption label="Show Tax" state={showTax} setter={setShowTax} />
                    <ToggleOption label="Show Amount" state={showAmount} setter={setShowAmount} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Table Style</CardTitle>
                    <CardDescription className="text-xs">Customize table appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Border Style</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["none", "light", "medium", "heavy"] as BorderStyle[]).map((style) => (
                          <button
                            key={style}
                            onClick={() => setTableBorderStyle(style)}
                            className={`p-2 border rounded capitalize text-xs ${
                              tableBorderStyle === style ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ToggleOption label="Show Table Header" state={showTableHeader} setter={setShowTableHeader} />
                    <ToggleOption
                      label="Alternate Row Colors"
                      state={alternateRowColor}
                      setter={setAlternateRowColor}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      Totals Section
                    </CardTitle>
                    <CardDescription className="text-xs">Configure totals display</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Totals Position</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["right", "full"].map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setTotalsSectionPosition(pos as any)}
                            className={`p-2 border rounded capitalize text-xs ${
                              totalsSectionPosition === pos ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            {pos === "right" ? "Right Aligned" : "Full Width"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ToggleOption label="Show Subtotal" state={showSubtotal} setter={setShowSubtotal} />
                    <ToggleOption label="Show Tax Breakdown" state={showTaxBreakdown} setter={setShowTaxBreakdown} />
                    <ToggleOption label="Show Discount Row" state={showDiscountRow} setter={setShowDiscountRow} />
                    <ToggleOption label="Show Shipping" state={showShipping} setter={setShowShipping} />
                    <ToggleOption label="Show Grand Total" state={showGrandTotal} setter={setShowGrandTotal} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Header & Footer</CardTitle>
                    <CardDescription className="text-xs">Customize document text</CardDescription>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Section Titles</CardTitle>
                    <CardDescription className="text-xs">Customize section headings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="customerTitle" className="text-xs">
                        Customer Section Title
                      </Label>
                      <Input
                        id="customerTitle"
                        value={customerSectionTitle}
                        onChange={(e) => setCustomerSectionTitle(e.target.value)}
                        placeholder="Bill To"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="termsTitle" className="text-xs">
                        Terms Title
                      </Label>
                      <Input
                        id="termsTitle"
                        value={termsTitle}
                        onChange={(e) => setTermsTitle(e.target.value)}
                        placeholder="Terms & Conditions"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="notesTitle" className="text-xs">
                        Notes Title
                      </Label>
                      <Input
                        id="notesTitle"
                        value={notesTitle}
                        onChange={(e) => setNotesTitle(e.target.value)}
                        placeholder="Notes"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signatureLabel" className="text-xs">
                        Signature Label
                      </Label>
                      <Input
                        id="signatureLabel"
                        value={signatureLabel}
                        onChange={(e) => setSignatureLabel(e.target.value)}
                        placeholder="Authorized Signature"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Terms & Conditions</CardTitle>
                    <CardDescription className="text-xs">Default terms text</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={termsContent}
                      onChange={(e) => setTermsContent(e.target.value)}
                      placeholder="Enter your terms and conditions..."
                      className="text-sm min-h-24"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notes</CardTitle>
                    <CardDescription className="text-xs">Default notes text</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={notesContent}
                      onChange={(e) => setNotesContent(e.target.value)}
                      placeholder="Enter additional notes..."
                      className="text-sm min-h-24"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Watermark</CardTitle>
                    <CardDescription className="text-xs">Watermark text (if enabled)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="DRAFT"
                      className="text-sm"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-1/2 overflow-y-auto bg-muted/30 p-6">
          <div className="max-w-4xl mx-auto">
            {companyData && (
              <QuotationPreview
                companyData={companyData}
                layout={{
                  type: templateType,
                  primaryColor,
                  secondaryColor,
                  accentColor,
                  logoPosition,
                  pageSize,
                  headerText,
                  footerText,
                  typography: {
                    fontSize,
                    fontFamily,
                  },
                  header: {
                    showBorder: showHeaderBorder,
                    backgroundColor: headerBackgroundColor,
                    logoSize,
                  },
                  sections: {
                    showLogo,
                    showCompanyName,
                    showAddress,
                    showEmail,
                    showPhone,
                    showWebsite,
                    showGST,
                    showCustomerSection,
                    showTerms,
                    showNotes,
                    showSignature,
                    showDate,
                    showQuotationNumber,
                    showValidUntil,
                  },
                  table: {
                    borderStyle: tableBorderStyle,
                    showHeader: showTableHeader,
                    showItemNumber,
                    showDescription,
                    showQuantity,
                    showRate,
                    showAmount,
                    showTax,
                    showDiscount,
                    showHSN,
                    alternateRowColor,
                  },
                  totals: {
                    showSubtotal,
                    showTaxBreakdown,
                    showDiscountRow,
                    showShipping,
                    showGrandTotal,
                    position: totalsSectionPosition,
                  },
                  content: {
                    customerSectionTitle,
                    termsTitle,
                    termsContent,
                    notesTitle,
                    notesContent,
                    signatureLabel,
                    watermarkText,
                  },
                  advanced: {
                    showWatermark,
                    showPageNumbers,
                    showSignatureDate,
                    pageMargin,
                    sectionSpacing,
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleOption({ label, state, setter }: { label: string; state: boolean; setter: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
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
  )
}

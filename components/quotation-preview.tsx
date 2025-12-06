interface QuotationPreviewProps {
  companyData: any
  layout: any
}

export function QuotationPreview({ companyData, layout }: QuotationPreviewProps) {
  const {
    type = "modern",
    primaryColor,
    secondaryColor,
    accentColor,
    logoPosition,
    pageSize,
    headerText,
    footerText,
    typography = {},
    header = {},
    sections = {},
    table = {},
    totals = {},
    content = {},
    advanced = {},
  } = layout

  const logoAlignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[logoPosition]

  const fontSizeMap = {
    small: { base: "text-xs", heading: "text-lg", subheading: "text-sm" },
    medium: { base: "text-sm", heading: "text-2xl", subheading: "text-base" },
    large: { base: "text-base", heading: "text-3xl", subheading: "text-lg" },
  }
  const fontSize = fontSizeMap[typography.fontSize || "medium"]

  const fontFamilyClass = {
    default: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[typography.fontFamily || "default"]

  const borderWidth = {
    none: "border-0",
    light: "border",
    medium: "border-2",
    heavy: "border-4",
  }[table.borderStyle || "medium"]

  const getStylePreset = () => {
    switch (type) {
      case "modern":
        return {
          borderRadius: "8px",
          headerStyle: "rounded-t-lg",
          cardShadow: "shadow-lg",
        }
      case "classic":
        return {
          borderRadius: "0px",
          headerStyle: "",
          cardShadow: "shadow-sm",
        }
      case "minimal":
        return {
          borderRadius: "4px",
          headerStyle: "rounded-t",
          cardShadow: "shadow-none",
        }
      default:
        return {
          borderRadius: "8px",
          headerStyle: "rounded-t-lg",
          cardShadow: "shadow-lg",
        }
    }
  }

  const stylePreset = getStylePreset()

  const getPageDimensions = () => {
    switch (pageSize) {
      case "A4":
        return { width: "210mm", minHeight: "297mm" }
      case "Letter":
        return { width: "8.5in", minHeight: "11in" }
      case "Legal":
        return { width: "8.5in", minHeight: "14in" }
      default:
        return { width: "210mm", minHeight: "297mm" }
    }
  }

  const pageDimensions = getPageDimensions()

  return (
    <div
      className={`bg-white ${stylePreset.cardShadow} border ${fontSize.base} text-gray-900 ${fontFamilyClass} relative mx-auto`}
      style={{
        width: pageDimensions.width,
        minHeight: pageDimensions.minHeight,
        borderRadius: stylePreset.borderRadius,
        padding: `${advanced.pageMargin || 20}mm`,
        backgroundColor: header.backgroundColor || "#ffffff",
      }}
    >
      {advanced.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
          <span className="text-8xl font-bold rotate-[-45deg] text-gray-400">{content.watermarkText || "DRAFT"}</span>
        </div>
      )}

      {/* Header */}
      <div
        className={`${logoAlignmentClass} ${stylePreset.headerStyle}`}
        style={{
          marginBottom: `${advanced.sectionSpacing || 16}px`,
          paddingBottom: `${advanced.sectionSpacing || 16}px`,
          borderBottom:
            header.showBorder !== false
              ? type === "classic"
                ? `3px double ${primaryColor}`
                : type === "minimal"
                  ? `1px solid ${primaryColor}40`
                  : `2px solid ${primaryColor}20`
              : "none",
        }}
      >
        {sections.showLogo && (
          <div className="mb-3">
            {companyData.logo ? (
              <img
                src={companyData.logo || "/placeholder.svg"}
                alt="Company Logo"
                style={{ width: `${header.logoSize || 80}px`, height: `${header.logoSize || 80}px` }}
                className="object-contain inline-block"
                onError={(e) => {
                  e.currentTarget.src = "/generic-company-logo.png"
                }}
              />
            ) : (
              <div
                style={{ width: `${header.logoSize || 80}px`, height: `${header.logoSize || 80}px` }}
                className="bg-muted rounded-lg inline-flex items-center justify-center text-muted-foreground text-xs"
              >
                Logo
              </div>
            )}
          </div>
        )}
        <h1 className={`${fontSize.heading} font-bold`} style={{ color: primaryColor }}>
          {headerText}
        </h1>

        <div className="mt-2 space-y-1">
          {sections.showQuotationNumber && <p className="text-xs text-gray-600">Quotation #: QT-2024-001</p>}
          {sections.showDate && <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString()}</p>}
          {sections.showValidUntil && (
            <p className="text-xs text-gray-600">
              Valid Until: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Company Info */}
      <div
        style={{
          marginBottom: `${advanced.sectionSpacing || 16}px`,
          paddingBottom: `${advanced.sectionSpacing || 16}px`,
        }}
        className="border-b"
      >
        {sections.showCompanyName && (
          <h2 className={`font-bold ${fontSize.subheading} mb-2`} style={{ color: primaryColor }}>
            {companyData.name}
          </h2>
        )}
        {sections.showAddress && (companyData.address?.line1 || companyData.address?.city) && (
          <p className={`${fontSize.base} text-gray-600 leading-relaxed`}>
            {companyData.address.line1}
            {companyData.address.line2 && `, ${companyData.address.line2}`}
            {companyData.address.line1 && <br />}
            {companyData.address.city && (
              <>
                {companyData.address.city}
                {companyData.address.state && `, ${companyData.address.state}`} {companyData.address.postalCode}
              </>
            )}
          </p>
        )}
        {((sections.showEmail && companyData.email) || (sections.showPhone && companyData.phone)) && (
          <p className={`${fontSize.base} text-gray-600 mt-2`}>
            {sections.showEmail && companyData.email}
            {sections.showEmail && companyData.email && sections.showPhone && companyData.phone && " | "}
            {sections.showPhone && companyData.phone}
          </p>
        )}
        <div className="mt-2 space-y-1">
          {sections.showWebsite && companyData.website && (
            <p className={`${fontSize.base} text-gray-600`}>Website: {companyData.website}</p>
          )}
          {sections.showGST && companyData.gst && (
            <p className={`${fontSize.base} text-gray-600`}>GST: {companyData.gst}</p>
          )}
        </div>
      </div>

      {/* Customer Details */}
      {sections.showCustomerSection && (
        <div style={{ marginBottom: `${advanced.sectionSpacing || 16}px` }}>
          <h3 className={`font-semibold ${fontSize.subheading} mb-2`} style={{ color: secondaryColor }}>
            {content.customerSectionTitle || "Bill To"}:
          </h3>
          <p className={`${fontSize.base} text-gray-600`}>
            Sample Customer
            <br />
            123 Customer Street
            <br />
            City, State 12345
          </p>
        </div>
      )}

      {/* Line Items Table */}
      <div style={{ marginBottom: `${advanced.sectionSpacing || 16}px` }}>
        <table className={`w-full ${fontSize.base} ${borderWidth}`}>
          {table.showHeader && (
            <thead>
              <tr style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                {table.showItemNumber && <th className="text-left p-3 font-semibold">#</th>}
                {table.showDescription && <th className="text-left p-3 font-semibold">Description</th>}
                {table.showHSN && <th className="text-left p-3 font-semibold">HSN</th>}
                {table.showQuantity && <th className="text-right p-3 font-semibold">Qty</th>}
                {table.showRate && <th className="text-right p-3 font-semibold">Rate</th>}
                {table.showDiscount && <th className="text-right p-3 font-semibold">Disc %</th>}
                {table.showTax && <th className="text-right p-3 font-semibold">Tax</th>}
                {table.showAmount && <th className="text-right p-3 font-semibold">Amount</th>}
              </tr>
            </thead>
          )}
          <tbody>
            {[
              { id: 1, desc: "Sample Product A", hsn: "1234", qty: 2, rate: 100, disc: 10, tax: 18 },
              { id: 2, desc: "Sample Product B", hsn: "5678", qty: 1, rate: 150, disc: 0, tax: 18 },
            ].map((item, idx) => (
              <tr
                key={item.id}
                className="border-b"
                style={table.alternateRowColor && idx % 2 === 1 ? { backgroundColor: `${secondaryColor}08` } : {}}
              >
                {table.showItemNumber && <td className="p-3">{item.id}</td>}
                {table.showDescription && <td className="p-3">{item.desc}</td>}
                {table.showHSN && <td className="p-3">{item.hsn}</td>}
                {table.showQuantity && <td className="text-right p-3">{item.qty}</td>}
                {table.showRate && <td className="text-right p-3">${item.rate}.00</td>}
                {table.showDiscount && <td className="text-right p-3">{item.disc}%</td>}
                {table.showTax && <td className="text-right p-3">{item.tax}%</td>}
                {table.showAmount && (
                  <td className="text-right p-3">${(item.qty * item.rate * (1 - item.disc / 100)).toFixed(2)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div
        className={totals.position === "right" ? "flex justify-end" : ""}
        style={{ marginBottom: `${advanced.sectionSpacing || 16}px` }}
      >
        <div className={totals.position === "right" ? "w-1/2" : "w-full"}>
          <div className="space-y-2 border-t pt-3">
            {totals.showSubtotal && (
              <div className="flex justify-between">
                <span className={fontSize.base}>Subtotal:</span>
                <span className={fontSize.base}>$320.00</span>
              </div>
            )}
            {totals.showDiscountRow && (
              <div className="flex justify-between text-green-600">
                <span className={fontSize.base}>Discount:</span>
                <span className={fontSize.base}>-$20.00</span>
              </div>
            )}
            {totals.showTaxBreakdown && (
              <div className="flex justify-between">
                <span className={fontSize.base}>Tax (18%):</span>
                <span className={fontSize.base}>$57.60</span>
              </div>
            )}
            {totals.showShipping && (
              <div className="flex justify-between">
                <span className={fontSize.base}>Shipping:</span>
                <span className={fontSize.base}>$10.00</span>
              </div>
            )}
            {totals.showGrandTotal && (
              <div className="flex justify-between font-bold border-t pt-2" style={{ color: primaryColor }}>
                <span className={fontSize.subheading}>Total:</span>
                <span className={fontSize.subheading}>$377.60</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms */}
      {sections.showTerms && (
        <div style={{ marginBottom: `${advanced.sectionSpacing || 16}px` }}>
          <h3 className={`font-semibold ${fontSize.subheading} mb-2`} style={{ color: secondaryColor }}>
            {content.termsTitle || "Terms & Conditions"}
          </h3>
          <p className={`text-gray-600 ${fontSize.base} leading-relaxed whitespace-pre-wrap`}>
            {content.termsContent || "Payment terms, delivery time, and warranty information will appear here."}
          </p>
        </div>
      )}

      {/* Notes */}
      {sections.showNotes && (
        <div style={{ marginBottom: `${advanced.sectionSpacing || 16}px` }}>
          <h3 className={`font-semibold ${fontSize.subheading} mb-2`} style={{ color: secondaryColor }}>
            {content.notesTitle || "Notes"}
          </h3>
          <p className={`text-gray-600 ${fontSize.base} leading-relaxed whitespace-pre-wrap`}>
            {content.notesContent || "Additional notes and comments will appear here."}
          </p>
        </div>
      )}

      {/* Signature */}
      {sections.showSignature && (
        <div style={{ marginBottom: `${advanced.sectionSpacing || 16}px` }} className="border-t pt-6">
          <div className="flex justify-between items-end">
            <div>
              <div className="border-b border-gray-400 w-48 mb-2"></div>
              <p className={`${fontSize.base} text-gray-600`}>{content.signatureLabel || "Authorized Signature"}</p>
              {advanced.showSignatureDate && <p className="text-xs text-gray-500 mt-1">Date: ___________</p>}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center">
        <p className={`${fontSize.base} text-gray-500`}>{footerText}</p>
        {advanced.showPageNumbers && <p className="text-xs text-gray-400 mt-2">Page 1 of 1</p>}
      </div>
    </div>
  )
}

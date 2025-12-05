interface QuotationPreviewProps {
  companyData: any
  layout: any
}

export function QuotationPreview({ companyData, layout }: QuotationPreviewProps) {
  const { primaryColor, secondaryColor, logoPosition, headerText, footerText, sections } = layout

  const logoAlignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[logoPosition]

  return (
    <div className="bg-white rounded-lg shadow-lg border p-8 text-sm text-gray-900">
      {/* Header */}
      <div className={`mb-6 ${logoAlignmentClass}`}>
        {sections.showLogo && companyData.logo && (
          <div className="mb-3">
            <img
              src={companyData.logo || "/placeholder.svg"}
              alt="Company Logo"
              className="w-20 h-20 object-contain inline-block"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
          {headerText}
        </h1>
      </div>

      {/* Company Info */}
      <div className="mb-6 pb-6 border-b">
        <h2 className="font-bold text-lg mb-2" style={{ color: primaryColor }}>
          {companyData.name}
        </h2>
        {sections.showAddress && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {companyData.address.line1}
            {companyData.address.line2 && `, ${companyData.address.line2}`}
            <br />
            {companyData.address.city}, {companyData.address.state} {companyData.address.postalCode}
          </p>
        )}
        <p className="text-sm text-gray-600 mt-2">
          {companyData.email} | {companyData.phone}
        </p>
        <div className="mt-2 space-y-1">
          {sections.showGST && companyData.gst && <p className="text-sm text-gray-600">GST: {companyData.gst}</p>}
          {sections.showPAN && companyData.pan && <p className="text-sm text-gray-600">PAN: {companyData.pan}</p>}
        </div>
      </div>

      {/* Customer Details */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-base" style={{ color: secondaryColor }}>
          Bill To:
        </h3>
        <p className="text-sm text-gray-600">
          Sample Customer
          <br />
          123 Customer Street
          <br />
          City, State 12345
        </p>
      </div>

      {/* Line Items Table */}
      <div className="mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <th className="text-left p-3 font-semibold">#</th>
              <th className="text-left p-3 font-semibold">Description</th>
              <th className="text-right p-3 font-semibold">Qty</th>
              <th className="text-right p-3 font-semibold">Rate</th>
              <th className="text-right p-3 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">1</td>
              <td className="p-3">Sample Product A</td>
              <td className="text-right p-3">2</td>
              <td className="text-right p-3">$100.00</td>
              <td className="text-right p-3">$200.00</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">2</td>
              <td className="p-3">Sample Product B</td>
              <td className="text-right p-3">1</td>
              <td className="text-right p-3">$150.00</td>
              <td className="text-right p-3">$150.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td colSpan={4} className="text-right p-3 text-base" style={{ color: primaryColor }}>
                Total:
              </td>
              <td className="text-right p-3 text-base" style={{ color: primaryColor }}>
                $350.00
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terms */}
      {sections.showTerms && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-base" style={{ color: secondaryColor }}>
            Terms & Conditions
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Payment terms, delivery time, and warranty information will appear here.
          </p>
        </div>
      )}

      {/* Notes */}
      {sections.showNotes && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-base" style={{ color: secondaryColor }}>
            Notes
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">Additional notes and comments will appear here.</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center">
        <p className="text-sm text-gray-500">{footerText}</p>
      </div>
    </div>
  )
}

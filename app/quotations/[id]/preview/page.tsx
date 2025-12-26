"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";

interface QuotationItem {
  product_name: string;
  quantity: number;
  per_item_price: number;
}

interface QuotationDataStructure {
  customer: string;
  quotation_data: QuotationItem[];
  total_amount: number;
}

interface TemplateData {
  type?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headerText?: string;
  footerText?: string;
  logoPosition?: "left" | "center" | "right";
  pageSize?: "A4" | "Letter";
  sections?: {
    showLogo?: boolean;
    showCompanyName?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showWebsite?: boolean;
    showGST?: boolean;
    showDate?: boolean;
    showQuotationNumber?: boolean;
    showCustomerSection?: boolean;
    showNotes?: boolean;
    showTerms?: boolean;
    showSignature?: boolean;
    showValidUntil?: boolean;
  };
  content?: {
    notesTitle?: string;
    notesContent?: string;
    termsTitle?: string;
    termsContent?: string;
    customerSectionTitle?: string;
    signatureLabel?: string;
    watermarkText?: string;
    itemColumnName?: string;
    quantityColumnName?: string;
    rateColumnName?: string;
    totalColumnName?: string;
    subtotalLabel?: string;
    taxLabel?: string;
    grandTotalLabel?: string;
    footerText?: string;
  };
  table?: {
    showItemNumber?: boolean;
    showDescription?: boolean;
    showQuantity?: boolean;
    showRate?: boolean;
    showAmount?: boolean;
    showHSN?: boolean;
    showTax?: boolean;
    showDiscount?: boolean;
    alternateRowColor?: boolean;
    alternateRowColors?: boolean;
    borderStyle?: "light" | "medium" | "heavy";
    showHeader?: boolean;
    headerBgColor?: string;
    rowBorders?: boolean;
  };
  header?: {
    backgroundColor?: string;
    logoSize?: number;
    showBorder?: boolean;
  };
  totals?: {
    position?: "right" | "full";
    showSubtotal?: boolean;
    showTaxBreakdown?: boolean;
    showTax?: boolean;
    showDiscountRow?: boolean;
    showDiscount?: boolean;
    showShipping?: boolean;
    showGrandTotal?: boolean;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: "small" | "medium" | "large";
    totalsSize?: "small" | "medium" | "large";
    grandTotalSize?: "small" | "medium" | "large";
  };
  advanced?: {
    pageMargin?: number;
    sectionSpacing?: number;
    showWatermark?: boolean;
    showPageNumbers?: boolean;
    showSignatureDate?: boolean;
    showFooter?: boolean;
  };
}

interface Template {
  id: string;
  template_name: string;
  template_data: TemplateData;
  organization_id: number;
}

interface Organization {
  name?: string;
  org_data?: {
    logo?: string;
    address?: any;
    phone?: string;
    email?: string;
    website?: string;
    gst?: string;
  };
}

interface Quotation {
  id: string;
  quote_number: string;
  quotation_data: QuotationDataStructure;
  template: Template;
  organization: Organization;
  created_at: string;
  status: string;
}

export default function QuotationPreview() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchQuotation();
  }, [params.id]);

  const fetchQuotation = async () => {
    try {
      console.log("Fetching quotation:", params.id);
      const response = await fetch(`/api/quotations/${params.id}`);
      const result = await response.json();

      console.log("API Response:", result);

      if (result.status === "success") {
        console.log("Quotation data:", result.data);
        console.log("Template data:", result.data.template);
        setQuotation(result.data);
      } else {
        setError(result.message || "Failed to load quotation");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Quotation_${quotation?.quote_number || "Unknown"}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}`,
  });

  const handleDownloadPDF = useReactToPrint({
    contentRef,
    documentTitle: `Quotation_${quotation?.quote_number || "Unknown"}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}`,
    onBeforePrint: async () => {
      setIsDownloading(true);
      toast({
        title: "Generating PDF",
        description: "Opening print dialog to save as PDF...",
      });
    },
    onAfterPrint: async () => {
      setIsDownloading(false);
      toast({
        title: "PDF Ready",
        description: "Select 'Save as PDF' in the print dialog.",
      });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!quotation.template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Template Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            No template is associated with this quotation.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const template = quotation.template;
  const templateData = template.template_data || {};
  const data = quotation.quotation_data;
  const org = quotation.organization || {};
  const orgData = org.org_data || {};

  // Extract all template settings
  const primaryColor = templateData.primaryColor || "#3b82f6";
  const secondaryColor = templateData.secondaryColor || "#64748b";
  const accentColor = templateData.accentColor || "#10b981";
  const headerBgColor = templateData.header?.backgroundColor || primaryColor;
  const logoSize = templateData.header?.logoSize || 80;
  const showBorder = templateData.header?.showBorder !== false;
  
  const sections = templateData.sections || {};
  const content = templateData.content || {};
  const tableSettings = templateData.table || {};
  const totalsSettings = templateData.totals || {};
  const typography = templateData.typography || {};
  const advanced = templateData.advanced || {};

  // Typography settings
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px'
  };
  const baseFontSize = fontSizeMap[typography.fontSize as keyof typeof fontSizeMap] || '16px';
  const fontFamily = typography.fontFamily || 'inherit';

  // Page settings
  const pageMargin = advanced.pageMargin || 20;
  const sectionSpacing = advanced.sectionSpacing || 16;

  // Determine text color for header
  const isLightBackground = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };
  const headerTextColor = isLightBackground(headerBgColor) ? 'text-gray-900' : 'text-white';

  // Format address
  const formatAddress = (address: any) => {
    if (!address) return "";
    if (typeof address === "string") return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.join(", ");
  };

  // Calculate subtotals and amounts
  const itemsWithSubtotals = data.quotation_data.map((item: any) => ({
    ...item,
    subtotal: item.quantity * item.per_item_price,
  }));

  const subtotal = itemsWithSubtotals.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const taxRate = 0.18;
  const taxAmount = subtotal * taxRate;
  const grandTotal = data.total_amount;

  // Calculate Valid Until date (30 days from creation)
  const validUntilDate = new Date(quotation.created_at);
  validUntilDate.setDate(validUntilDate.getDate() + 30);

  // Border style for table
  const borderStyleMap = {
    light: 1,
    medium: 2,
    heavy: 3
  };
  
  const logoAlignmentMap = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };
  const logoAlignment = logoAlignmentMap[templateData.logoPosition as keyof typeof logoAlignmentMap] || 'justify-start';

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{ fontSize: baseFontSize, fontFamily }}>
      {/* Action Buttons - Hidden on print */}
      <div className="max-w-4xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              {isDownloading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Quotation Document */}
      <div className="max-w-4xl mx-auto px-4">
        <div 
          ref={contentRef}
          id="quotation-content" 
          className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none relative" 
          style={{ 
            padding: `${pageMargin}px`,
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
        >
          {/* Watermark */}
          {advanced.showWatermark && content.watermarkText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className="text-9xl font-bold opacity-5 transform -rotate-45"
                style={{ color: secondaryColor }}
              >
                {content.watermarkText}
              </div>
            </div>
          )}

          {/* Header */}
          <div
            className={`p-8 ${headerTextColor} ${showBorder ? 'border-b-4' : ''}`}
            style={{ 
              backgroundColor: headerBgColor,
              borderColor: showBorder ? primaryColor : 'transparent',
              marginBottom: `${sectionSpacing}px`
            }}
          >
            <div className={`flex items-start ${logoAlignment === 'justify-center' ? 'flex-col items-center text-center' : 'justify-between'}`}>
              <div className={logoAlignment === 'justify-center' ? 'mb-4' : ''}>
                {sections.showLogo && orgData.logo && (
                  <img
                    src={orgData.logo}
                    alt="Company Logo"
                    style={{ height: `${logoSize}px` }}
                    className="mb-4 bg-white rounded p-2"
                  />
                )}
                {sections.showCompanyName && (
                  <h1 className="text-3xl font-bold mb-2">
                    {org.name || "Company Name"}
                  </h1>
                )}
                {sections.showAddress && orgData.address && (
                  <p className="text-sm opacity-90 mb-1">
                    {formatAddress(orgData.address)}
                  </p>
                )}
                <div className="text-sm opacity-90 space-y-1">
                  {sections.showPhone && orgData.phone && <p>Ph: {orgData.phone}</p>}
                  {sections.showEmail && orgData.email && <p>Email: {orgData.email}</p>}
                  {sections.showWebsite && orgData.website && <p>Web: {orgData.website}</p>}
                  {sections.showGST && orgData.gst && <p>GST: {orgData.gst}</p>}
                </div>
              </div>
              <div className={`text-right ${logoAlignment === 'justify-center' ? 'text-center' : ''}`}>
                <h2 className="text-2xl font-bold mb-2">
                  {templateData.headerText || "QUOTATION"}
                </h2>
                {sections.showQuotationNumber && (
                  <p className="text-sm opacity-90">
                    Quotation #: {quotation.quote_number}
                  </p>
                )}
                {sections.showDate && (
                  <p className="text-sm opacity-90">
                    Date: {new Date(quotation.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                )}
                {sections.showValidUntil && (
                  <p className="text-sm opacity-90">
                    Valid Until: {validUntilDate.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Section */}
          {sections.showCustomerSection && (
            <div className="px-8" style={{ marginBottom: `${sectionSpacing}px` }}>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold" style={{ color: secondaryColor }}>
                  {content.customerSectionTitle || "Bill To"}:
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{data.customer}</p>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="px-8" style={{ marginBottom: `${sectionSpacing}px` }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: tableSettings.rowBorders ? 'collapse' : 'separate' }}>
                <thead>
                  <tr style={{
                    backgroundColor: tableSettings.headerBgColor || secondaryColor,
                    color: isLightBackground(tableSettings.headerBgColor || secondaryColor) ? '#000' : '#fff',
                    borderBottom: `${borderStyleMap[tableSettings.borderStyle as keyof typeof borderStyleMap] || 2}px solid ${secondaryColor}`,
                  }}>
                    <th className="text-left py-3 px-2 font-semibold">#</th>
                    <th className="text-left py-3 px-2 font-semibold">
                      {content.itemColumnName || "Description"}
                    </th>
                    {tableSettings.showHSN && (
                      <th className="text-center py-3 px-2 font-semibold">HSN</th>
                    )}
                    <th className="text-center py-3 px-2 font-semibold">
                      {content.quantityColumnName || "Qty"}
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">
                      {content.rateColumnName || "Rate"}
                    </th>
                    {tableSettings.showTax && (
                      <th className="text-right py-3 px-2 font-semibold">Tax %</th>
                    )}
                    {tableSettings.showDiscount && (
                      <th className="text-right py-3 px-2 font-semibold">Discount</th>
                    )}
                    <th className="text-right py-3 px-2 font-semibold">
                      {content.totalColumnName || "Amount"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithSubtotals.map((item: any, index: number) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: tableSettings.alternateRowColors && index % 2 === 1
                          ? `${secondaryColor}15`
                          : 'transparent',
                        borderBottom: tableSettings.rowBorders
                          ? `1px solid #e5e7eb`
                          : 'none',
                      }}
                    >
                      <td className="py-3 px-2">{index + 1}</td>
                      <td className="py-3 px-2 font-medium">{item.product_name}</td>
                      {tableSettings.showHSN && (
                        <td className="py-3 px-2 text-center">-</td>
                      )}
                      <td className="py-3 px-2 text-center">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">
                        ₹{Number(item.per_item_price).toFixed(2)}
                      </td>
                      {tableSettings.showTax && (
                        <td className="py-3 px-2 text-right">-</td>
                      )}
                      {tableSettings.showDiscount && (
                        <td className="py-3 px-2 text-right">-</td>
                      )}
                      <td className="py-3 px-2 text-right font-semibold">
                        ₹{item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className={`mt-8 ${totalsSettings.position === 'full' ? '' : 'flex justify-end'}`}>
              <div className={totalsSettings.position === 'full' ? 'w-full' : 'w-80'} style={{ fontSize: fontSizeMap[typography.totalsSize as keyof typeof fontSizeMap] || '16px' }}>
                {totalsSettings.showSubtotal && (
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid #e5e7eb` }}>
                    <span>{content.subtotalLabel || "Subtotal"}:</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                )}
                {totalsSettings.showTax && (
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid #e5e7eb` }}>
                    <span>{content.taxLabel || `GST (${(taxRate * 100).toFixed(0)}%)`}:</span>
                    <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {totalsSettings.showDiscount && (
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid #e5e7eb` }}>
                    <span>Discount:</span>
                    <span className="font-semibold">₹0.00</span>
                  </div>
                )}
                <div
                  className="flex justify-between py-3 font-bold"
                  style={{
                    borderTop: `${borderStyleMap[tableSettings.borderStyle as keyof typeof borderStyleMap] || 2}px solid ${secondaryColor}`,
                    fontSize: fontSizeMap[typography.grandTotalSize as keyof typeof fontSizeMap] || '18px',
                  }}
                >
                  <span>{content.grandTotalLabel || "Total Amount"}:</span>
                  <span style={{ color: primaryColor }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {sections.showNotes && content.notesContent && (
            <div className="px-8" style={{ marginBottom: `${sectionSpacing}px` }}>
              <div className="bg-blue-50 rounded-lg p-4" style={{ backgroundColor: `${secondaryColor}10` }}>
                <h3 className="font-semibold text-gray-900 mb-2" style={{ color: secondaryColor }}>
                  {content.notesTitle || "Notes"}:
                </h3>
                <p className="text-sm text-gray-700">{content.notesContent}</p>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {sections.showTerms && content.termsContent && (
            <div className="px-8" style={{ marginBottom: `${sectionSpacing}px` }}>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {content.termsTitle || "Terms & Conditions"}:
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{content.termsContent}</p>
              </div>
            </div>
          )}

          {/* Signature Section */}
          {sections.showSignature && (
            <div className="px-8" style={{ marginBottom: `${sectionSpacing}px` }}>
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="border-t-2 border-gray-300 pt-2 mb-2" style={{ width: '200px', borderColor: secondaryColor }}>
                    <p className="text-sm font-semibold">Authorized Signature</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Date: {new Date(quotation.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {advanced.showFooter && content.footerText && (
            <div className="p-4 border-t border-gray-200" style={{ backgroundColor: `${secondaryColor}08` }}>
              <p className="text-sm text-gray-600 text-center">
                {content.footerText}
              </p>
            </div>
          )}

          {/* Page Numbers */}
          {advanced.showPageNumbers && (
            <div className="px-8 py-2">
              <p className="text-xs text-gray-500 text-center">
                Page 1 of 1
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          #quotation-content {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields - body should have customer and quotation_data array
    if (!body.customer || !body.quotation_data || !Array.isArray(body.quotation_data) || body.quotation_data.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Invalid quotation data" },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { status: "error", message: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("Saving quotation for user:", user.id);

    // Get user's organization ID
    const { data: orgUserData, error: orgUserError } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (orgUserError || !orgUserData) {
      console.error("Error fetching organization:", orgUserError);
      return NextResponse.json(
        { status: "error", message: "Organization not found" },
        { status: 404 }
      );
    }

    // Get template_id from quotation_templates table
    const { data: templateData, error: templateError } = await supabase
      .from("quotation_templates")
      .select("id")
      .eq("organization_id", orgUserData.organization_id)
      .single();

    if (templateError) {
      console.error("Error fetching template:", templateError);
      return NextResponse.json(
        { status: "error", message: "Failed to fetch quotation template" },
        { status: 500 }
      );
    }

    if (!templateData) {
      return NextResponse.json(
        { status: "error", message: "No quotation template found for user" },
        { status: 404 }
      );
    }

    console.log("Found template_id:", templateData.id);

    // Get organization data to retrieve quotation numbering settings
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("org_data")
      .eq("id", orgUserData.organization_id)
      .single();

    if (orgError) {
      console.error("Error fetching organization data:", orgError);
      return NextResponse.json(
        { status: "error", message: "Failed to fetch organization data" },
        { status: 500 }
      );
    }

    // Generate quotation number
    const quotationNumbering = orgData?.org_data?.quotationNumbering || {};
    const prefix = quotationNumbering.prefix || "QT-";
    const currentNumber = quotationNumbering.currentNumber || quotationNumbering.startNumber || 1;
    const quotationNumber = `${prefix}${currentNumber}`;

    console.log("Generated quotation number:", quotationNumber);

    // Update the current number for next quotation
    const updatedOrgData = {
      ...orgData.org_data,
      quotationNumbering: {
        ...quotationNumbering,
        currentNumber: currentNumber + 1,
      },
    };

    const { error: updateOrgError } = await supabase
      .from("organizations")
      .update({ org_data: updatedOrgData })
      .eq("id", orgUserData.organization_id);

    if (updateOrgError) {
      console.warn("Failed to update quotation number counter:", updateOrgError);
      // Don't fail the request, just log the warning
    }

    // Insert quotation into database - store entire data object in quotation_data field
    const { data: quotationRecord, error: insertError } = await supabase
      .from("quotations")
      .insert({
        user_id: user.id,
        organization_id: orgUserData.organization_id,
        template_id: templateData.id,
        quotation_data: body, // Store the entire data object
        quote_number: quotationNumber, // Add the generated quotation number
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting quotation:", insertError);
      return NextResponse.json(
        { status: "error", message: `Failed to save quotation: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log("Quotation saved successfully with ID:", quotationRecord.id);

    return NextResponse.json({
      status: "success",
      message: "Quotation saved successfully",
      quotation_id: quotationRecord.id,
      quotation_number: quotationNumber,
      total_amount: body.total_amount || 0,
    });

  } catch (error: any) {
    console.error("Error saving quotation:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Get template_id from quotation_templates table
    const { data: templateData, error: templateError } = await supabase
      .from("quotation_templates")
      .select("id")
      .eq("user_id", user.id)
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

    // Insert quotation into database - store entire data object in quotation_data field
    const { data: quotationRecord, error: insertError } = await supabase
      .from("quotations")
      .insert({
        user_id: user.id,
        template_id: templateData.id,
        quotation_data: body, // Store the entire data object
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

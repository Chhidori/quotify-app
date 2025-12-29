import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log("=".repeat(80));
    console.log(" Fetching quotation with ID:", id);
    
    const supabase = await getSupabaseServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return NextResponse.json(
        { status: "error", message: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log(" User authenticated:", user.id);

    // Get user's organization ID
    const { data: orgUserData, error: orgUserError } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (orgUserError || !orgUserData) {
      console.error(" Error fetching organization:", orgUserError);
      return NextResponse.json(
        { status: "error", message: "Organization not found" },
        { status: 404 }
      );
    }

    console.log("Organization ID:", orgUserData.organization_id);

    // Fetch quotation
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgUserData.organization_id)
      .single();

    if (quotationError) {
      console.error(" Error fetching quotation:", quotationError);
      return NextResponse.json(
        { status: "error", message: "Quotation not found" },
        { status: 404 }
      );
    }

    console.log(" Quotation found:", quotation.id);

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from("quotation_templates")
      .select("*")
      .eq("id", quotation.template_id)
      .eq("organization_id", orgUserData.organization_id)
      .single();

    if (templateError) {
      console.error(" Error fetching template:", templateError);
    }

    console.log("Template found:", template?.template_name);

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgUserData.organization_id)
      .single();

    if (orgError) {
      console.error(" Error fetching organization details:", orgError);
    }

    console.log("Organization details:", organization?.name);

    // Combine all data
    const result = {
      ...quotation,
      template: template || null,
      organization: organization || null
    };

    console.log("Response prepared with template and organization");
    console.log("=".repeat(80));

    return NextResponse.json({
      status: "success",
      data: result
    });

  } catch (error: any) {
    console.error("Error fetching quotation:", error);
    console.error("=".repeat(80));
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

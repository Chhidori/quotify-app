import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/conversation-logs
 * Store conversation logs from LiveKit agent sessions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { speaker, text, timestamp, session_id, room_name, metadata } = body;

    // Validate required fields
    if (!speaker || !text || !timestamp || !session_id || !room_name) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields: speaker, text, timestamp, session_id, room_name",
        },
        { status: 400 }
      );
    }

    // Validate speaker value
    const validSpeakers = ["user", "agent", "system"];
    if (!validSpeakers.includes(speaker)) {
      return NextResponse.json(
        {
          status: "error",
          message: `Invalid speaker value. Must be one of: ${validSpeakers.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get user's organization ID from organization_users table
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

    // Insert conversation log into database
    const { data, error } = await supabase
      .from("conversation_logs")
      .insert({
        organization_id: orgUserData.organization_id,
        user_id: user.id,
        session_id,
        room_name,
        speaker,
        text,
        timestamp,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to store conversation log",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Conversation log stored successfully",
      log_id: data.id,
    });
  } catch (error) {
    console.error("Error storing conversation log:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversation-logs?session_id=xxx
 * Retrieve conversation logs for a specific session
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get("session_id");
    const room_name = searchParams.get("room_name");

    let query = supabase
      .from("conversation_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: true });

    if (session_id) {
      query = query.eq("session_id", session_id);
    }

    if (room_name) {
      query = query.eq("room_name", room_name);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to retrieve conversation logs",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      logs: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error retrieving conversation logs:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

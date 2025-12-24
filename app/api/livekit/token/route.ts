import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Authenticated user:", JSON.stringify(user, null, 2));

    const { data: template } = await supabase
      .from("quotation_templates")
      .select("id")
      .eq("user_id", user.id)
      .single();
    console.log("Template:", JSON.stringify(template, null, 2));

    const body = await request.json();
    const roomName =
      body.roomName ||
      `user_session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

    console.log("Creating room:", roomName);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error("Server misconfigured: missing LiveKit credentials");
    }

    // Create access token for THIS specific room
    const token = new AccessToken(apiKey, apiSecret, {
      identity: roomName, // Use room name as identity
      metadata: JSON.stringify({
        userId: user.id,
        templateId: template?.id || null,
      }),
      ttl: "10h",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    console.log("Token created for room:", roomName);

    return NextResponse.json({
      url: wsUrl,
      token: jwt,
      session_id: roomName,
    });
  } catch (error: any) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create room" },
      { status: 500 }
    );
  }
}

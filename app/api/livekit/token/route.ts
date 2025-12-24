import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomName = body.roomName || `user_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
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
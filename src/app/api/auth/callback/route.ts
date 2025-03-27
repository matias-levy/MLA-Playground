import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code missing" },
      { status: 400 }
    );
  }

  const tokenResponse = await fetch(
    "https://freesound.org/apiv2/oauth2/access_token/",
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_FREESOUND_CLIENT_ID!,
        client_secret: process.env.FREESOUND_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: "Failed to get access token", details: tokenData },
      { status: 400 }
    );
  }

  const response = NextResponse.redirect(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT! + "/?acc=" + tokenData.access_token
  );

  return response;
}

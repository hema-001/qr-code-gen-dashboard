import { NextRequest, NextResponse } from "next/server";
import { getVerifiedToken, API_BASE } from "@/app/api/_lib/proxy";

// GET /api/auth/me — restore session from HttpOnly cookie
export async function GET(request: NextRequest) {
  const verified = await getVerifiedToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch fresh user data from the backend
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/me`, {
      headers: { Authorization: `Bearer ${verified.rawToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await response.json();
    // Return both token (for in-memory state) and user
    return NextResponse.json({ token: verified.rawToken, user });
  } catch {
    // If the backend has no /me endpoint, reconstruct from JWT payload
    const { payload } = verified;
    const user = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
    return NextResponse.json({ token: verified.rawToken, user });
  }
}

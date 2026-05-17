import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/app/api/_lib/proxy";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface RateEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateEntry>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) return true;
  return false;
}

// POST /api/auth/login
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: string;
  try {
    body = await request.text();
    // Validate it is valid JSON before forwarding
    JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/api/v1/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Backend request failed" }, { status: 502 });
  }

  let data: Record<string, unknown>;
  try {
    data = await backendRes.json();
  } catch {
    return NextResponse.json({ error: "Invalid backend response" }, { status: 502 });
  }

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  // Extract token from backend response (handles common field names)
  const token =
    (data.token as string | undefined) ??
    (data.accessToken as string | undefined) ??
    null;

  if (!token) {
    return NextResponse.json({ error: "No token in backend response" }, { status: 502 });
  }

  // Build the response — return user (and token for in-memory state) but set the
  // real session cookie as HttpOnly so JavaScript cannot access it directly.
  const nextRes = NextResponse.json(data, { status: 200 });
  nextRes.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 86400, // 24 hours
  });

  return nextRes;
}

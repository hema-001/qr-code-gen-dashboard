import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/urls — list all URLs (super_admin only)
// POST /api/urls — create a URL (super_admin only)
export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/v1/admin/urls", {
    requiredRole: "super_admin",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, "/api/v1/admin/urls", {
    method: "POST",
    body,
    extraHeaders: { "Content-Type": "application/json" },
    requiredRole: "super_admin",
  });
}

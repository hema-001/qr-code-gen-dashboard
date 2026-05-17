import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/users — list all users (super_admin only)
// POST /api/users — create a user (super_admin only)
export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/v1/admin/users", {
    requiredRole: "super_admin",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, "/api/v1/admin/users", {
    method: "POST",
    body,
    extraHeaders: { "Content-Type": "application/json" },
    requiredRole: "super_admin",
  });
}

import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/brand-attribute-types — list all attribute types (any authenticated admin)
// POST /api/brand-attribute-types — create a new attribute type (super_admin only)
export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/v1/admin/brand-attribute-types");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, "/api/v1/admin/brand-attribute-types", {
    method: "POST",
    body,
    extraHeaders: { "Content-Type": "application/json" },
    requiredRole: "super_admin",
  });
}

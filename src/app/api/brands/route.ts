import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/brands — list all brands
// POST /api/brands — create a brand
export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/v1/admin/brands");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, "/api/v1/admin/brands", {
    method: "POST",
    body,
    extraHeaders: { "Content-Type": "application/json" },
  });
}

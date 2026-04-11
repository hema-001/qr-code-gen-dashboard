import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// POST /api/auth/login
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, "/api/v1/admin/login", {
    method: "POST",
    body,
    extraHeaders: { "Content-Type": "application/json" },
  });
}

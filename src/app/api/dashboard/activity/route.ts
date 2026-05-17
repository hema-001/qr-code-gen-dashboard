import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/dashboard/activity?limit=10
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sanitized = new URLSearchParams();
  const limit = searchParams.get("limit");
  if (limit && /^\d{1,4}$/.test(limit)) sanitized.set("limit", limit);
  const query = sanitized.toString();
  const path = `/api/v1/admin/dashboard/activity${query ? `?${query}` : ""}`;
  return proxyRequest(request, path);
}

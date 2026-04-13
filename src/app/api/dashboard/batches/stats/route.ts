import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/dashboard/batches/stats?period=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = `/api/v1/admin/dashboard/batches/stats${query ? `?${query}` : ""}`;
  return proxyRequest(request, path);
}

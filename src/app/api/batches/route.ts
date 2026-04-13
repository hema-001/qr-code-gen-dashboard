import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/batches — list batches with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = `/api/v1/admin/batches${query ? `?${query}` : ""}`;
  return proxyRequest(request, path);
}

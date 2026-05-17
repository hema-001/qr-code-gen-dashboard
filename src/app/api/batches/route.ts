import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

const ALLOWED_BATCH_PARAMS = new Set(["page", "limit", "sort", "order", "status"]);

// GET /api/batches — list batches with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sanitized = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (ALLOWED_BATCH_PARAMS.has(key)) {
      sanitized.set(key, value);
    }
  }
  const query = sanitized.toString();
  const path = `/api/v1/admin/batches${query ? `?${query}` : ""}`;
  return proxyRequest(request, path);
}
